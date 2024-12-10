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
  import { shapeStore, setShapeGroups } from '../stores/shapes';
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
  import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
  import { postProcessingStore } from '../stores/postprocessing';

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
  let composer: EffectComposer;
  let bloomPass: UnrealBloomPass;
  let noisePass: ShaderPass;
  let previousSVGContent: string | null = null;

  // Update noise shader
  const noiseShader = {
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: null },
      intensity: { value: 0.5 },
      cameraNear: { value: 0.1 },
      cameraFar: { value: 1000 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform float intensity;
      uniform float cameraNear;
      uniform float cameraFar;
      varying vec2 vUv;
      
      float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }

      float perspectiveDepthToViewZ(float invClipZ, float near, float far) {
        return (near * far) / ((far - near) * invClipZ - far);
      }
      
      float viewZToOrthographicDepth(float viewZ, float near, float far) {
        return (viewZ + near) / (near - far);
      }

      float getDepth(vec2 coord) {
        float fragCoordZ = texture2D(tDepth, coord).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
      }
      
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float depth = getDepth(vUv);
        
        // Only apply noise to non-background pixels (where depth is not at far plane)
        if (depth > 0.0 && depth < 0.99) {
          vec2 uvRandom = vUv;
          uvRandom.y *= random(vec2(uvRandom.y, 0.4));
          color.rgb += random(uvRandom) * intensity;
        }
        
        gl_FragColor = color;
      }
    `,
  };

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
      depth: 1, // Default depth
    }));

    setShapeGroups(groups);
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
        bevelEnabled: false,
        curveSegments: $objectStore.settings.curveSegments,
      };

      // Create a group to hold all shape meshes
      const group = new THREE.Group();

      const meshes: THREE.Mesh[] = [];

      shapes.forEach(({ shape, color }) => {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({
          color: color,
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
        console.log('Starting scene capture with options:', options);
        // Create offscreen renderer with enhanced settings
        const offscreenRenderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });

        const renderWidth = options.width || 2000;
        const renderHeight = options.height || 2000;
        offscreenRenderer.setSize(renderWidth, renderHeight);
        offscreenRenderer.setPixelRatio(1); // Increase pixel ratio for sharper render

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

        console.log('Scene rendered, converting to PNG');

        // Get the canvas and convert to PNG
        const canvas = document.createElement('canvas');
        canvas.width = renderWidth;
        canvas.height = renderHeight;
        const ctx = canvas.getContext('2d')!;

        // Create an image from the renderer
        const img = new Image();
        img.src = offscreenRenderer.domElement.toDataURL('image/png');

        img.onload = () => {
          // Draw with transparent background
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          console.log('Image drawn to canvas, dimensions:', {
            width: canvas.width,
            height: canvas.height,
            imgWidth: img.width,
            imgHeight: img.height,
          });

          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create PNG blob'));
              return;
            }

            console.log('Created blob:', { size: blob.size });

            // Convert blob to Uint8Array
            const reader = new FileReader();
            reader.onloadend = () => {
              if (!reader.result) {
                reject(new Error('Failed to read PNG data'));
                return;
              }
              const arrayBuffer = reader.result as ArrayBuffer;
              console.log('Converted to array buffer:', {
                byteLength: arrayBuffer.byteLength,
              });
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

        img.onerror = (error) => {
          console.error('Failed to load image:', error);
          offscreenRenderer.dispose();
          reject(new Error('Failed to create image from render'));
        };
      } catch (error) {
        console.error('Error in captureScene:', error);
        reject(error);
      }
    });
  }

  export function handleMaterialChange(
    textures: Record<string, THREE.Texture>,
    settings = $materialStore.settings
  ): void {
    if (!currentMesh) return;

    const updateMaterial = (material: THREE.MeshStandardMaterial) => {
      material.map = textures.diffuse;
      material.normalMap = textures.normal;
      material.roughnessMap = textures.roughness;
      material.metalnessMap = textures.metalness;
      material.aoMap = textures.ao;
      material.displacementMap = textures.height;
      material.needsUpdate = true;
    };

    // Apply texture repeat settings to all textures
    Object.values(textures).forEach((texture) => {
      texture.repeat.set(settings.textureRepeat, settings.textureRepeat);
    });

    if (currentMesh instanceof THREE.Mesh) {
      if (currentMesh.material instanceof THREE.MeshStandardMaterial) {
        updateMaterial(currentMesh.material);
      }
    } else if ('children' in currentMesh) {
      currentMesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            updateMaterial(child.material);
          }
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

  function setupPostprocessing() {
    if (!renderer || !scene || !camera) return;

    // Enable depth texture
    renderer.setPixelRatio(window.devicePixelRatio);
    const depthTexture = new THREE.DepthTexture();
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio,
      {
        depthTexture: depthTexture,
        depthBuffer: true,
      }
    );

    composer = new EffectComposer(renderer, renderTarget);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom pass
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    // Noise pass with depth
    noisePass = new ShaderPass(noiseShader);
    noisePass.uniforms.tDepth.value = depthTexture;
    noisePass.uniforms.cameraNear.value = camera.near;
    noisePass.uniforms.cameraFar.value = camera.far;
    composer.addPass(noisePass);

    // Initial state
    updatePostProcessingEffects($postProcessingStore.settings);
  }

  function updatePostProcessingEffects(settings: PostProcessingSettings) {
    if (!bloomPass || !noisePass) return;

    // Update bloom
    bloomPass.enabled = settings.bloom.enabled;
    bloomPass.strength = settings.bloom.intensity;
    bloomPass.threshold = settings.bloom.threshold;
    bloomPass.radius = settings.bloom.radius;

    // Update noise
    noisePass.enabled = settings.noise.enabled;
    noisePass.uniforms.intensity.value = settings.noise.intensity;
  }

  export function updateMeshMaterial(
    settings: Partial<MaterialSettings>
  ): void {
    if (!currentMesh) return;

    const updateMaterial = (material: THREE.MeshStandardMaterial) => {
      if (settings.roughness !== undefined)
        material.roughness = settings.roughness;
      if (settings.metalness !== undefined)
        material.metalness = settings.metalness;
      if (settings.envMapIntensity !== undefined)
        material.envMapIntensity = settings.envMapIntensity;
    };

    if (
      currentMesh instanceof THREE.Mesh &&
      currentMesh.material instanceof THREE.MeshStandardMaterial
    ) {
      updateMaterial(currentMesh.material);
    } else if ('children' in currentMesh) {
      currentMesh.children.forEach((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          updateMaterial(child.material);
        }
      });
    }
  }

  onMount(async () => {
    setThreeSceneComponent({
      captureScene,
      handleMaterialChange,
      updateMeshMaterial,
    });
    setMaterialChangeHandler(handleMaterialChange);

    // Load materials first
    await loadMaterials();

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

      // Use composer instead of renderer
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    }

    animate();

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth * window.devicePixelRatio;
      const height = container.clientHeight * window.devicePixelRatio;

      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);

      if (composer) {
        composer.setSize(container.clientWidth, container.clientHeight);
        // Update render target size
        const depthTexture = composer.renderTarget1.depthTexture;
        composer.renderTarget1.setSize(width, height);
        composer.renderTarget2.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Load HDR environment
    try {
      await loadHDREnvironment();
    } catch (error) {
      console.error('Failed to load HDR environment:', error);
    }

    setupPostprocessing();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // Subscribe to SVG store changes
  $: if (
    $svgStore.content &&
    scene &&
    $svgStore.content !== previousSVGContent
  ) {
    previousSVGContent = $svgStore.content;
    console.log('Creating SVG mesh from content:', $svgStore.content);
    createSVGMesh($svgStore.content, false);

    // Apply default material if available
    if ($materialStore.defaultMaterial) {
      // Only load default material on initial creation
      if (!currentMesh) {
        loadDefaultMaterial();
      }
    }
  }

  // Subscribe to object store changes to update the mesh
  $: if ($objectStore.settings && $svgStore.content && scene) {
    // Store current materials before recreating mesh
    const currentMaterials =
      currentMesh instanceof THREE.Group
        ? currentMesh.children.map((child) =>
            child instanceof THREE.Mesh ? child.material : null
          )
        : currentMesh instanceof THREE.Mesh
          ? [currentMesh.material]
          : [];

    createSVGMesh($svgStore.content, true); // Preserve camera when updating settings

    // Restore materials after mesh recreation
    if (currentMesh instanceof THREE.Group) {
      currentMesh.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && currentMaterials[index]) {
          child.material = currentMaterials[index];
        }
      });
    } else if (currentMesh instanceof THREE.Mesh && currentMaterials[0]) {
      currentMesh.material = currentMaterials[0];
    }
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

  // Update subscription to shape store changes
  $: if ($shapeStore.groups && currentMesh) {
    // Update mesh colors and depths when shape groups change
    $shapeStore.groups.forEach((group) => {
      group.meshIndices.forEach((index) => {
        const mesh = (currentMesh as THREE.Group).children[index] as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.color.copy(group.color);
          // Update the mesh's scale in Z axis for depth
          mesh.scale.z = group.depth;
        }
      });
    });
  }

  // Subscribe to postprocessing store changes
  $: if (composer && $postProcessingStore.settings) {
    updatePostProcessingEffects($postProcessingStore.settings);
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
