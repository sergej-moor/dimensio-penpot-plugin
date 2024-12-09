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
  <div class="flex w-full gap-4">
    <!-- Wrap Preview with its own error boundary -->

    <ErrorBoundary
      fallback="Unable to load preview. Please try selecting a different image."
      onError={handlePreviewError}
    >
      <Preview />
    </ErrorBoundary>

    <!-- Wrap Controls with its own error boundary -->
    <div class="max-h-[500px] flex flex-col">
      <h2
        class=" font-Montserrat tracking-wide hover:tracking-[0.3rem] transition-all duration-700 font-medium my-4"
      >
        Dimensio
      </h2>

      <ErrorBoundary
        fallback="Controls are temporarily unavailable. Please refresh the page."
      >
        <Controls />
      </ErrorBoundary>
    </div>
  </div>
</main>

<style>
  main {
    padding: var(--spacing-8);

    margin: 0 auto;
  }
</style>
