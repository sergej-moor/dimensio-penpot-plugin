<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import {
    materialStore,
    loadMaterials,
    type Material,
  } from '../stores/materials';
  import { tooltip } from '../actions/tooltip';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import { threeSceneStore } from '../stores/threeScene';

  export let onMaterialChange:
    | ((textures: Record<string, THREE.Texture>) => void)
    | undefined;

  let selectedMaterial: Material | null = null;
  let isLoading = false;

  // Load and cache textures
  const textureLoader = new THREE.TextureLoader();
  const loadedTextures: Record<string, THREE.Texture> = {};

  async function loadTexturesForMaterial(material: Material): Promise<void> {
    isLoading = true;
    try {
      const texturePromises: Promise<void>[] = [];
      const newTextures: Record<string, THREE.Texture> = {};

      // Load each texture type
      for (const [mapType, path] of Object.entries(material.maps)) {
        if (!path) continue;

        const loadPromise = new Promise<void>((resolve, reject) => {
          textureLoader.load(
            path,
            (texture) => {
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              texture.repeat.set(1, 1);

              // Configure texture based on type
              switch (mapType) {
                case 'normal':
                  texture.colorSpace = THREE.LinearSRGBColorSpace;
                  break;
                case 'diffuse':
                  texture.colorSpace = THREE.SRGBColorSpace;
                  break;
              }

              newTextures[mapType] = texture;
              resolve();
            },
            undefined,
            reject
          );
        });

        texturePromises.push(loadPromise);
      }

      await Promise.all(texturePromises);

      // Store loaded textures
      Object.assign(loadedTextures, newTextures);

      // Notify parent component
      $threeSceneStore.component?.handleMaterialChange(newTextures);
    } catch (error) {
      console.error('Error loading textures:', error);
    } finally {
      isLoading = false;
    }
  }

  async function handleMaterialSelect(material: Material): Promise<void> {
    selectedMaterial = material;
    await loadTexturesForMaterial(material);
  }

  onMount(() => {
    loadMaterials();
  });

  // Cleanup textures on component destroy
  onDestroy(() => {
    Object.values(loadedTextures).forEach((texture) => texture.dispose());
  });
</script>

<div class="flex flex-col gap-4">
  <h3 class="text-sm font-medium">Materials</h3>

  {#if $materialStore.isLoading}
    <div class="flex justify-center">
      <LoadingSpinner />
    </div>
  {:else if $materialStore.error}
    <p class="text-sm text-red-600">{$materialStore.error}</p>
  {:else}
    <div class="grid grid-cols-4 gap-1">
      {#each $materialStore.materials as material}
        <button
          class="p-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          class:bg-blue-50={selectedMaterial?.name === material.name}
          disabled={isLoading}
          on:click={() => handleMaterialSelect(material)}
          use:tooltip={{
            text: material.name,
            position: 'top',
          }}
        >
          {#if material.maps.preview}
            <img
              src={material.maps.preview}
              alt={material.name}
              class="w-12 h-12 object-cover rounded"
            />
          {:else if material.maps.diffuse}
            <img
              src={material.maps.diffuse}
              alt={material.name}
              class="w-12 h-12 object-cover rounded"
            />
          {:else}
            <div
              class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs"
            >
              {material.name}
            </div>
          {/if}
        </button>
      {/each}
    </div>

    {#if isLoading}
      <div class="flex justify-center">
        <LoadingSpinner />
      </div>
    {/if}
  {/if}
</div>
