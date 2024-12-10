<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import {
    materialStore,
    loadMaterials,
    type Material,
    updateMaterialSettings,
    type MaterialSettings,
    setCurrentMaterial,
  } from '../stores/materials';
  import { tooltip } from '../actions/tooltip';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import { threeSceneStore } from '../stores/threeScene';

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

  function handleSettingChange(setting: keyof MaterialSettings, value: number) {
    updateMaterialSettings({ [setting]: value });

    // If we have textures loaded, only update the texture repeat if that's what changed
    if (selectedMaterial) {
      if (setting === 'textureRepeat') {
        // Only update texture repeats
        const currentTextures = Object.entries(loadedTextures).reduce(
          (acc, [key, texture]) => {
            texture.repeat.set(value, value);
            acc[key] = texture;
            return acc;
          },
          {} as Record<string, THREE.Texture>
        );

        // Pass only the settings that changed
        $threeSceneStore.component?.handleMaterialChange(currentTextures);
      } else {
        // For other settings, we can just update the material properties directly
        // without recreating textures or triggering a full material change
        $threeSceneStore.component?.updateMeshMaterial?.({
          [setting]: value,
        });
      }
    }
  }

  onMount(() => {
    loadMaterials();
  });

  // Cleanup textures on component destroy
  onDestroy(() => {
    Object.values(loadedTextures).forEach((texture) => texture.dispose());
  });
</script>

<div class="mt-4 flex flex-col gap-4">
  <div class="flex flex-col gap-2">
    <label class="text-sm flex justify-between">
      Texture Repeat: {$materialStore.settings.textureRepeat.toFixed(3)}
      <input
        type="range"
        min="0.001"
        max="0.02"
        step="0.001"
        value={$materialStore.settings.textureRepeat}
        on:input={(e) =>
          handleSettingChange(
            'textureRepeat',
            parseFloat(e.currentTarget.value)
          )}
        class="flex-1 ml-2"
      />
    </label>

    <label class="text-sm flex justify-between">
      Metalness: {$materialStore.settings.metalness.toFixed(2)}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={$materialStore.settings.metalness}
        on:input={(e) =>
          handleSettingChange('metalness', parseFloat(e.currentTarget.value))}
        class="flex-1 ml-2"
      />
    </label>

    <label class="text-sm flex justify-between">
      Roughness: {$materialStore.settings.roughness.toFixed(2)}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={$materialStore.settings.roughness}
        on:input={(e) =>
          handleSettingChange('roughness', parseFloat(e.currentTarget.value))}
        class="flex-1 ml-2"
      />
    </label>

    <label class="text-sm flex justify-between">
      Environment Intensity: {$materialStore.settings.envMapIntensity.toFixed(
        2
      )}
      <input
        type="range"
        min="0"
        max="2"
        step="0.01"
        value={$materialStore.settings.envMapIntensity}
        on:input={(e) =>
          handleSettingChange(
            'envMapIntensity',
            parseFloat(e.currentTarget.value)
          )}
        class="flex-1 ml-2"
      />
    </label>
  </div>
</div>

<div class="flex flex-col gap-4">
  <h3 class="mt-2 font-medium">Materials</h3>

  {#if $materialStore.isLoading}
    <div class="flex justify-center">
      <LoadingSpinner />
    </div>
  {:else if $materialStore.error}
    <p class="text-sm text-red-600">{$materialStore.error}</p>
  {:else}
    <div class="flex flex-wrap gap-2">
      {#each $materialStore.materials as material}
        <button
          class="p-0 w-12 h-12 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
              class="w-full h-full rounded-full object-cover"
            />
          {:else if material.maps.diffuse}
            <img
              src={material.maps.diffuse}
              alt={material.name}
              class="w-full h-full rounded-full object-cover"
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
