<script lang="ts">
  import Controls from './components/Controls.svelte';
  import Preview from './components/Preview.svelte';
  import { theme } from './stores/theme';
  import { MessageHandler } from './services/messageHandler';
  import ErrorBoundary from './components/ErrorBoundary.svelte';

  function handlePreviewError(error: Error): void {
    // Report to error tracking service
    console.error('Preview error:', error);
  }
</script>

<svelte:window onmessage={MessageHandler.handle} />

<main data-theme={$theme}>
  <h2
    class=" text-center mb-2 font-GamjaFlower tracking-widest hover:tracking-[0.7rem] transition-all duration-700 font-bold"
  >
    Pixelize!
  </h2>
  <div class="flex flex-col gap-4">
    <!-- Wrap Preview with its own error boundary -->
    <ErrorBoundary
      fallback="Unable to load preview. Please try selecting a different image."
      onError={handlePreviewError}
    >
      <Preview />
    </ErrorBoundary>

    <!-- Wrap Controls with its own error boundary -->
    <ErrorBoundary
      fallback="Controls are temporarily unavailable. Please refresh the page."
    >
      <Controls />
    </ErrorBoundary>
  </div>
</main>

<style>
  main {
    padding: var(--spacing-8);
    max-width: 408px; /* Match plugin width */
    margin: 0 auto;
  }
</style>
