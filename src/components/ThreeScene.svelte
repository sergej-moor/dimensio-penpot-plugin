<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
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
    setCurrentMaterial,
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
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
  import { postProcessingStore } from '../stores/postprocessing';
  import { ShaderLib } from 'three';

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
  let noisePass: ShaderPass;
  let edgePass: ShaderPass;
  let colorPass: ShaderPass;
  let pixelationPass: ShaderPass;
  let previousSVGContent: string | null = null;

  // Update noise shader
  const noiseShader = {
    uniforms: {
      tDiffuse: { value: null },
      intensity: { value: 0.5 },
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
      uniform float intensity;
      varying vec2 vUv;
      
      float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        if (color.a > 0.0) {
          vec2 uvRandom = vUv;
          uvRandom.y *= random(vec2(uvRandom.y, 0.4));
          color.rgb += random(uvRandom) * intensity;
        }
        
        gl_FragColor = color;
      }
    `,
  };

  // Add new shader definitions
  const edgeShader = {
    uniforms: {
      tDiffuse: { value: null },
      intensity: { value: 1.0 },
      threshold: { value: 0.1 },
      resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
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
      uniform float intensity;
      uniform float threshold;
      uniform vec2 resolution;
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
        
        vec4 n = texture2D(tDiffuse, vUv + vec2(0.0, texel.y));
        vec4 s = texture2D(tDiffuse, vUv + vec2(0.0, -texel.y));
        vec4 e = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0));
        vec4 w = texture2D(tDiffuse, vUv + vec2(-texel.x, 0.0));
        
        float edge = length(n.rgb - s.rgb) + length(e.rgb - w.rgb);
        edge = edge > threshold ? 1.0 : 0.0;
        
        gl_FragColor = vec4(mix(color.rgb, vec3(edge), intensity), color.a);
      }
    `,
  };

  const colorAdjustmentShader = {
    uniforms: {
      tDiffuse: { value: null },
      brightness: { value: 1.0 },
      saturation: { value: 1.0 },
      contrast: { value: 1.0 },
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
      uniform float brightness;
      uniform float saturation;
      uniform float contrast;
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        if (color.a == 0.0) {
          gl_FragColor = color;
          return;
        }
        
        // Brightness
        color.rgb *= brightness;
        
        // Saturation
        float gray = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        color.rgb = mix(vec3(gray), color.rgb, saturation);
        
        // Contrast
        color.rgb = (color.rgb - 0.5) * contrast + 0.5;
        
        gl_FragColor = vec4(color.rgb, color.a);
      }
    `,
  };

  // Add new shader definitions
  const pixelationShader = {
    uniforms: {
      tDiffuse: { value: null },
      pixelSize: { value: 8 },
      resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
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
      uniform float pixelSize;
      uniform vec2 resolution;
      varying vec2 vUv;
      
      void main() {
        vec2 dxy = pixelSize / resolution;
        vec2 coord = dxy * floor(vUv / dxy);
        gl_FragColor = texture2D(tDiffuse, coord);
      }
    `,
  };

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
    try {
      const { shapes, bounds, colorGroups } = parseSVGPaths(svgContent);
      console.log('Parsed SVG:', { shapes, bounds });

      if (shapes.length === 0) {
        console.warn('No valid paths found in SVG');
        return null;
      }

      // Get default material if available
      const defaultMaterial = $materialStore.materials[0];
      if (defaultMaterial) {
        setCurrentMaterial(defaultMaterial);
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

      // Create meshes by color group
      Object.entries(colorGroups).forEach(([color, groupData]) => {
        groupData.paths.forEach(({ data: path }) => {
          const shapes = path.toShapes(true);
          shapes.forEach((shape) => {
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            // Create material with default textures if available
            const material = defaultMaterial
              ? new THREE.MeshStandardMaterial({
                  color: new THREE.Color(groupData.color),
                  flatShading: true,
                  side: THREE.DoubleSide,
                  roughness: $materialStore.settings.roughness,
                  metalness: $materialStore.settings.metalness,
                  envMapIntensity: $materialStore.settings.envMapIntensity,
                  displacementScale: 0,
                  displacementBias: 0,
                })
              : new THREE.MeshStandardMaterial({
                  color: new THREE.Color(groupData.color),
                  flatShading: true,
                  side: THREE.DoubleSide,
                  roughness: 0.7,
                  metalness: 0.3,
                  displacementScale: 0,
                  displacementBias: 0,
                });

            // Apply textures if default material exists
            if (defaultMaterial) {
              const textureLoader = new THREE.TextureLoader();
              Object.entries(defaultMaterial.maps).forEach(([type, path]) => {
                if (path) {
                  const texture = textureLoader.load(path);
                  texture.wrapS = THREE.RepeatWrapping;
                  texture.wrapT = THREE.RepeatWrapping;
                  texture.repeat.set(
                    $materialStore.settings.textureRepeat,
                    $materialStore.settings.textureRepeat
                  );

                  switch (type) {
                    case 'diffuse':
                      texture.colorSpace = THREE.SRGBColorSpace;
                      material.map = texture;
                      break;
                    case 'normal':
                      texture.colorSpace = THREE.LinearSRGBColorSpace;
                      material.normalMap = texture;
                      break;
                    case 'roughness':
                      material.roughnessMap = texture;
                      break;
                    case 'metalness':
                      material.metalnessMap = texture;
                      break;
                    case 'ao':
                      material.aoMap = texture;
                      break;
                  }
                }
              });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z =
              meshes.length * 0.05 * $objectStore.settings.depth;
            mesh.visible = true;
            mesh.frustumCulled = false;
            mesh.renderOrder = meshes.length;

            meshes.push(mesh);
            group.add(mesh);
          });
        });
      });

      // Update all materials after creation
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.needsUpdate = true;
        }
      });

      // Create color groups for shape controls
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

      const groups = Array.from(colorMap.entries()).map(
        ([hex, data], index) => ({
          id: hex,
          color: data.color.clone(),
          defaultColor: data.color.clone(),
          meshIndices: data.indices,
          depth: 1 + index * 0.05,
        })
      );

      setShapeGroups(groups);

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
      return null;
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

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);

    // Create render target with alpha
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio,
      {
        alpha: true,
        format: THREE.RGBAFormat,
      }
    );

    composer = new EffectComposer(renderer, renderTarget);

    // Add render pass first
    const renderPass = new RenderPass(scene, camera);
    renderPass.clear = true;
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    // Initialize all passes first
    pixelationPass = new ShaderPass(pixelationShader);
    noisePass = new ShaderPass(noiseShader);
    edgePass = new ShaderPass(edgeShader);
    colorPass = new ShaderPass(colorAdjustmentShader);

    // Add passes based on effect order
    const passes = $postProcessingStore.settings.effects
      .sort((a, b) => a.order - b.order)
      .map((effect) => {
        switch (effect.type) {
          case 'pixelation':
            return pixelationPass;
          case 'noise':
            return noisePass;
          case 'edge':
            return edgePass;
          case 'color':
            return colorPass;
          default:
            return null;
        }
      })
      .filter((pass) => pass !== null);

    passes.forEach((pass) => {
      if (pass) {
        pass.renderToScreen = false;
        composer.addPass(pass);
      }
    });

    // Output pass should still be last
    const outputPass = new OutputPass();
    outputPass.renderToScreen = true;
    composer.addPass(outputPass);
  }

  function updatePostProcessingEffects(settings: PostProcessingSettings) {
    if (!noisePass || !edgePass || !colorPass || !pixelationPass) return;

    // Find each effect in the effects array
    const pixelationEffect = settings.effects.find(
      (e) => e.type === 'pixelation'
    );
    const noiseEffect = settings.effects.find((e) => e.type === 'noise');
    const edgeEffect = settings.effects.find((e) => e.type === 'edge');
    const colorEffect = settings.effects.find((e) => e.type === 'color');

    // Update pixelation
    if (pixelationEffect) {
      pixelationPass.enabled = pixelationEffect.settings.enabled;
      pixelationPass.uniforms.pixelSize.value =
        pixelationEffect.settings.pixelSize;
    }

    // Update noise
    if (noiseEffect) {
      noisePass.enabled = noiseEffect.settings.enabled;
      noisePass.uniforms.intensity.value = noiseEffect.settings.intensity;
    }

    // Update edge detection
    if (edgeEffect) {
      edgePass.enabled = edgeEffect.settings.enabled;
      edgePass.uniforms.intensity.value = edgeEffect.settings.intensity;
      edgePass.uniforms.threshold.value = edgeEffect.settings.threshold;
    }

    // Update color adjustment
    if (colorEffect) {
      colorPass.enabled = colorEffect.settings.enabled;
      colorPass.uniforms.brightness.value = colorEffect.settings.brightness;
      colorPass.uniforms.saturation.value = colorEffect.settings.saturation;
      colorPass.uniforms.contrast.value = colorEffect.settings.contrast;
    }
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
      if (material.displacementMap) {
        material.displacementScale = 0;
        material.displacementBias = 0;
      }
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

        // Update edge detection resolution
        if (edgePass) {
          edgePass.uniforms.resolution.value.set(width, height);
        }
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

    // Force material update after creation
    if (currentMesh && $materialStore.settings) {
      updateMeshMaterial($materialStore.settings);
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
          // Update the mesh's position in Z axis for extrusion effect
          mesh.position.z = (group.depth - 1) * $objectStore.settings.depth;
        }
      });
    });
  }

  // Subscribe to postprocessing store changes
  $: if (composer && $postProcessingStore.settings) {
    updatePostProcessingEffects($postProcessingStore.settings);
  }

  // Subscribe to material settings changes
  $: if (currentMesh && $materialStore.settings) {
    const updateMaterial = (material: THREE.MeshStandardMaterial) => {
      if ($materialStore.settings.roughness !== undefined)
        material.roughness = $materialStore.settings.roughness;
      if ($materialStore.settings.metalness !== undefined)
        material.metalness = $materialStore.settings.metalness;
      if ($materialStore.settings.envMapIntensity !== undefined)
        material.envMapIntensity = $materialStore.settings.envMapIntensity;
      if (material.displacementMap) {
        material.displacementScale = 0;
        material.displacementBias = 0;
      }
    };

    // Update all materials in the mesh
    if (currentMesh instanceof THREE.Group) {
      currentMesh.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          updateMaterial(child.material);
        }
      });
    }

    const currentTextures = Object.entries(
      $materialStore.currentMaterial?.maps || {}
    ).reduce(
      (acc, [key, path]) => {
        if (path && key in acc) {
          const texture = acc[key];
          texture.repeat.set(
            $materialStore.settings.textureRepeat,
            $materialStore.settings.textureRepeat
          );
        }
        return acc;
      },
      {} as Record<string, THREE.Texture>
    );

    // Update material settings
    updateMeshMaterial($materialStore.settings);
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
