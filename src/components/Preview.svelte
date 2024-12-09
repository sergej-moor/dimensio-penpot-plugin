<script lang="ts">
  import { onDestroy } from 'svelte';
  import { selection } from '../stores/selection';
  import { LOADING_MESSAGES } from '../constants';
  import { createImageUrl, revokeImageUrl } from '../utils/imageUrl';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import { svgStore } from '../stores/svg';
  import ThreeScene from './ThreeScene.svelte';

  let previewUrl: string | undefined;

  $: {
    const imageData =
      $selection.previewImage?.data || $selection.exportedImage?.data;
    revokeImageUrl(previewUrl);
    previewUrl = imageData ? createImageUrl(imageData) : undefined;
  }

  // Computed properties
  $: displayName = formatDisplayName($selection.name);
  $: loadingMessage = getLoadingMessage($selection);

  // Cleanup on destroy
  onDestroy((): void => revokeImageUrl(previewUrl));

  // Helper functions
  function formatDisplayName(name?: string): string {
    if (!name) return 'No selection';
    return name.length > 28 ? `${name.slice(0, 25)}...` : name;
  }

  function getLoadingMessage(state: typeof $selection): string {
    if (state.isPreviewLoading) return LOADING_MESSAGES.PREVIEW;
    if (state.isPixelizing) return LOADING_MESSAGES.PIXELIZING;
    return LOADING_MESSAGES.UPLOADING;
  }
</script>

<div class="rounded-lg border border-gray-200 dark:border-gray-700">
  <div class="relative w-[300px] h-[300px] min-h-[100px]">
    {#if $svgStore.error}
      <div class="flex items-center justify-center h-full p-4">
        <p class="text-sm text-red-600 text-center">{$svgStore.error}</p>
      </div>
    {:else if $svgStore.content}
      <div class="flex items-center justify-center relative w-full h-full">
        {@html $svgStore.content}
      </div>
    {:else if $selection.error}
      <div class="flex items-center justify-center h-full p-4">
        <p class="text-sm text-red-600 text-center">{$selection.error}</p>
      </div>
    {:else if previewUrl}
      <!-- Preview Image -->
      <div class="flex items-center justify-center relative w-full h-full">
        <img
          src={previewUrl}
          alt="Selected shape"
          class="w-[300px] h-[300px] max-w-full max-h-[300px] p-2 object-contain rounded transition-opacity"
          class:opacity-50={$selection.isPreviewLoading}
        />

        <!-- Loading Overlay -->
        {#if $selection.isPreviewLoading || $selection.isPixelizing || $selection.isUploadingFill}
          <div
            class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded transition-all duration-200"
          >
            <LoadingSpinner />
            <p class="text-sm text-white font-medium">{loadingMessage}</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Show Three.js scene when no other content is displayed -->
      <div class="w-full h-full">
        <ThreeScene />
      </div>
    {/if}
  </div>
</div>

<style>
  /* Add this to ensure SVGs fit properly in the preview */
  :global(svg) {
    width: 100%;
    height: 100%;
    max-width: 300px;
    max-height: 300px;
    padding: 8px;
  }
</style>
