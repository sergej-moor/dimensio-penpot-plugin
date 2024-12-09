<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { svgStore } from '../stores/svg';
  import { parseSVGPaths } from '../utils/svgParser';
  import type { CaptureOptions } from '../types';
  import {
    setMaterialChangeHandler,
    setThreeSceneComponent,
  } from '../stores/threeScene';
  import {
    materialStore,
    loadMaterials,
    type Material,
    updateMaterialSettings,
    type MaterialSettings,
  } from '../stores/materials';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
  import { objectStore } from '../stores/object';
  import {
    cameraStore,
    updateCameraPosition,
    updateCameraTarget,
    setDefaultCameraPosition,
  } from '../stores/camera';
  import { colorStore, setColorGroups } from '../stores/color';

  // Create a reference to this component instance
  let componentInstance: ThreeScene;

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let animationFrameId: number;
  let currentMesh: THREE.Mesh | null = null;
  let currentMaterial: THREE.MeshStandardMaterial;

  function createDefaultCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      flatShading: true,
      roughness: 0.7,
      metalness: 0.3,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    currentMesh = cube;
    return cube;
  }

  function createColorGroups(meshes: THREE.Mesh[]): void {
    const colorMap = new Map<
      string,
      { color: THREE.Color; indices: number[] }
    >();

    meshes.forEach((mesh, index) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      const colorHex = material.color.getHexString();

      if (!colorMap.has(colorHex)) {
        colorMap.set(colorHex, {
          color: material.color.clone(),
          indices: [index],
        });
      } else {
        colorMap.get(colorHex)?.indices.push(index);
      }
    });

    const groups = Array.from(colorMap.entries()).map(([hex, data]) => ({
      id: hex,
      color: data.color.clone(),
      defaultColor: data.color.clone(),
      meshIndices: data.indices,
    }));

    setColorGroups(groups);
  }

  function createSVGMesh(svgContent: string, preserveCamera = false) {
    // Remove existing mesh if any
    if (currentMesh) {
      console.log('Removing existing mesh');
      scene.remove(currentMesh);
      if ('geometry' in currentMesh) {
        currentMesh.geometry.dispose();
      }
      if ('material' in currentMesh) {
        (Array.isArray(currentMesh.material)
          ? currentMesh.material
          : [currentMesh.material]
        ).forEach((material) => material.dispose());
      }
    }

    try {
      const { shapes, bounds } = parseSVGPaths(svgContent);
      console.log('Parsed SVG:', { shapes, bounds });

      if (shapes.length === 0) {
        console.warn('No valid paths found in SVG');
        return createDefaultCube();
      }

      // Create extruded geometry from shapes
      const extrudeSettings = {
        steps: $objectStore.settings.steps,
        depth: $objectStore.settings.depth,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.1,
        bevelSegments: $objectStore.settings.curveSegments,
      };

      // Create a group to hold all shape meshes
      const group = new THREE.Group();

      const meshes: THREE.Mesh[] = [];

      shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({
          color: 0x000000,
          flatShading: true,
          side: THREE.DoubleSide,
          roughness: 0.7,
          metalness: 0.3,
        });
        const mesh = new THREE.Mesh(geometry, material);
        meshes.push(mesh);
        group.add(mesh);
      });

      // Create color groups after creating meshes
      createColorGroups(meshes);

      // Update scale based on object settings
      const targetWidth = 10; // Target width in units
      const baseScale = targetWidth / bounds.width;
      const scale = baseScale * $objectStore.settings.scale;
      group.scale.set(scale, -scale, scale);
      group.position.set(-bounds.centerX * scale, bounds.centerY * scale, 0);

      // Only set camera position if this is the first load (not preserving camera)
      if (!preserveCamera) {
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2) / 2);

        const defaultPosition = new THREE.Vector3(0, 0, cameraDistance);
        setDefaultCameraPosition(defaultPosition, center);

        camera.position.copy(defaultPosition);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
      }

      scene.add(group);
      currentMesh = group as unknown as THREE.Mesh;
      console.log('Added SVG mesh to scene:', group);

      return group;
    } catch (error) {
      console.error('Error creating SVG mesh:', error);
      return createDefaultCube();
    }
  }

  // Export these methods so they can be called from outside
  export function captureScene(
    options: CaptureOptions = {}
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      try {
        // Create offscreen renderer with enhanced settings
        const offscreenRenderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });

        const renderWidth = options.width || 2000;
        const renderHeight = options.height || 2000;
        offscreenRenderer.setSize(renderWidth, renderHeight);
        offscreenRenderer.setPixelRatio(2); // Increase pixel ratio for sharper render

        // Clone the scene and camera for high-res render
        const offscreenScene = scene.clone();
        const offscreenCamera = camera.clone();

        // Important: Set background to null for transparency
        offscreenScene.background = null;

        // Adjust camera for new aspect ratio
        offscreenCamera.aspect = renderWidth / renderHeight;
        offscreenCamera.updateProjectionMatrix();

        // Render high-res version
        offscreenRenderer.render(offscreenScene, offscreenCamera);

        // Get the canvas and convert to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Create an image from the renderer
        const img = new Image();
        img.src = offscreenRenderer.domElement.toDataURL('image/png');

        img.onload = () => {
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw with transparent background
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create PNG blob'));
              return;
            }

            // Convert blob to Uint8Array
            const reader = new FileReader();
            reader.onloadend = () => {
              if (!reader.result) {
                reject(new Error('Failed to read PNG data'));
                return;
              }
              const arrayBuffer = reader.result as ArrayBuffer;
              resolve(new Uint8Array(arrayBuffer));
            };
            reader.readAsArrayBuffer(blob);
          }, 'image/png');

          // Clean up
          offscreenRenderer.dispose();
          offscreenScene.traverse((object) => {
            if ('geometry' in object) {
              (object as THREE.Mesh).geometry?.dispose();
            }
            if ('material' in object) {
              const material = (object as THREE.Mesh)
                .material as THREE.Material;
              material.dispose();
            }
          });
        };

        img.onerror = () => {
          offscreenRenderer.dispose();
          reject(new Error('Failed to create image from render'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  export function handleMaterialChange(
    textures: Record<string, THREE.Texture>,
    settings = $materialStore.settings
  ): void {
    if (!currentMesh) return;

    const material = new THREE.MeshStandardMaterial({
      map: textures.diffuse,
      normalMap: textures.normal,
      roughnessMap: textures.roughness,
      metalnessMap: textures.metalness,
      aoMap: textures.ao,
      displacementMap: textures.height,
      displacementScale: 0,
      metalness: settings.metalness,
      roughness: settings.roughness,
      envMapIntensity: 1.0,
    });

    // Apply texture repeat settings to all textures
    Object.values(textures).forEach((texture) => {
      texture.repeat.set(settings.textureRepeat, settings.textureRepeat);
    });

    if (currentMesh instanceof THREE.Mesh) {
      currentMesh.material = material;
    } else if ('children' in currentMesh) {
      currentMesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = material.clone();
        }
      });
    }
  }

  async function loadHDREnvironment(): Promise<void> {
    return new Promise((resolve, reject) => {
      const loader = new RGBELoader();
      loader.setPath('/');

      loader.load(
        './sky.hdr',
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          scene.environment = texture;

          // Update all existing materials to use environment mapping
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              const material = object.material as THREE.MeshStandardMaterial;
              if (material.isMeshStandardMaterial) {
                material.envMap = texture;
                material.needsUpdate = true;
              }
            }
          });

          resolve();
        },
        undefined,
        reject
      );
    });
  }

  onMount(async () => {
    setThreeSceneComponent({
      captureScene,
      handleMaterialChange,
    });
    setMaterialChangeHandler(handleMaterialChange);
    console.log('ThreeScene mounting, container:', container);
    // Scene setup
    scene = new THREE.Scene();
    scene.background = null;
    console.log('Scene created');
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    console.log('Camera created with dimensions:', {
      width: container.clientWidth,
      height: container.clientHeight,
    });

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    console.log('Renderer created and appended');

    // Initial cube
    const cube = createDefaultCube();
    console.log('Default cube created');

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add environment light for better PBR materials
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemiLight);

    // Camera position
    camera.position.z = 5;

    // Add OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false; // Disable panning
    controls.target.set(0, 0, 0); // Keep target fixed at center

    // Add this to sync camera position when using orbit controls
    controls.addEventListener('change', () => {
      updateCameraPosition(camera.position);
      updateCameraTarget(controls.target);
    });

    // Animation loop
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      if (currentMesh && !controls.enableDamping) {
        currentMesh.rotation.x += 0.01;
        currentMesh.rotation.y += 0.01;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Load HDR environment
    try {
      await loadHDREnvironment();
    } catch (error) {
      console.error('Failed to load HDR environment:', error);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // Subscribe to SVG store changes
  $: if ($svgStore.content && scene) {
    console.log('Creating SVG mesh from content:', $svgStore.content);
    createSVGMesh($svgStore.content, false); // Don't preserve camera on initial load
  }

  // Subscribe to object store changes to update the mesh
  $: if ($objectStore.settings && $svgStore.content && scene) {
    createSVGMesh($svgStore.content, true); // Preserve camera when updating settings
  }

  // Add these subscriptions after the other subscriptions
  $: if ($cameraStore.position && camera) {
    camera.position.set(
      $cameraStore.position.x,
      $cameraStore.position.y,
      $cameraStore.position.z
    );
    // Always look at the center when position changes
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  $: if ($cameraStore.target && controls) {
    controls.target.set(
      $cameraStore.target.x,
      $cameraStore.target.y,
      $cameraStore.target.z
    );
    controls.update();
  }

  // Add subscription to color store changes
  $: if ($colorStore.groups && currentMesh) {
    // Update mesh colors when color groups change
    $colorStore.groups.forEach((group) => {
      group.meshIndices.forEach((index) => {
        const mesh = (currentMesh as THREE.Group).children[index] as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.color.copy(group.color);
        }
      });
    });
  }

  onDestroy(() => {
    setThreeSceneComponent(undefined);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (renderer) {
      renderer.dispose();
    }
    if (controls) {
      controls.dispose();
    }
    if (currentMesh) {
      scene?.remove(currentMesh);
      if ('geometry' in currentMesh) {
        currentMesh.geometry.dispose();
      }
      if ('material' in currentMesh) {
        (Array.isArray(currentMesh.material)
          ? currentMesh.material
          : [currentMesh.material]
        ).forEach((material) => material.dispose());
      }
    }
  });
</script>

<div class="relative">
  <div bind:this={container} class="w-full h-full min-h-[500px]"></div>
</div>

<style>
  div {
    touch-action: none;
  }
</style>
