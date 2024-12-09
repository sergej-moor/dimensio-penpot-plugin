<script lang="ts">
  export let state: 'preview' | 'pixelizing' | 'uploading';
</script>

<div
  class="loading-overlay absolute inset-0 flex items-center justify-center bg-black/50 rounded"
>
  <p class="text-sm text-white font-medium">
    {#if state === 'preview'}
      Updating preview...
    {:else if state === 'pixelizing'}
      Pixelizing image...
    {:else}
      Uploading fill...
    {/if}
  </p>
</div>

<style>
  .loading-overlay {
    backdrop-filter: blur(2px);
    transition: all 0.2s ease;
  }
</style>
