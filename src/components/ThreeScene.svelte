<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { svgStore } from '../stores/svg';
  import { parseSVGPaths } from '../utils/svgParser';

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let animationFrameId: number;
  let currentMesh: THREE.Mesh | null = null;

  function createDefaultCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      flatShading: true,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    currentMesh = cube;
    return cube;
  }

  function createSVGMesh(svgContent: string) {
    // Remove existing mesh if any
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
    }

    try {
      const { shapes, bounds } = parseSVGPaths(svgContent);

      if (shapes.length === 0) {
        console.warn('No valid paths found in SVG');
        return createDefaultCube();
      }

      // Create extruded geometry from shapes
      const extrudeSettings = {
        steps: 1,
        depth: 1,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.1,
        bevelSegments: 3,
      };

      // Create a group to hold all shape meshes
      const group = new THREE.Group();

      shapes.forEach((shape, index) => {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(index / shapes.length, 0.7, 0.5),
          flatShading: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
      });

      // Center and scale the group
      const scale = Math.min(5 / bounds.width, 5 / bounds.height);
      group.scale.set(scale, -scale, scale); // Flip Y to match SVG coordinates
      group.position.set(-bounds.centerX * scale, bounds.centerY * scale, 0);

      scene.add(group);
      currentMesh = group as unknown as THREE.Mesh;

      // Reset camera position
      camera.position.set(0, 0, 10);
      controls.reset();

      return group;
    } catch (error) {
      console.error('Error creating SVG mesh:', error);
      return createDefaultCube();
    }
  }

  onMount(() => {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Initial cube
    const cube = createDefaultCube();

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Camera position
    camera.position.z = 5;

    // Add OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

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

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // Subscribe to SVG store changes
  $: if ($svgStore.content && scene) {
    createSVGMesh($svgStore.content);
  }

  onDestroy(() => {
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

<div bind:this={container} class="w-full h-full"></div>

<style>
  div {
    touch-action: none;
  }
</style>
