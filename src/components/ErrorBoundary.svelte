<script lang="ts">
  import { onMount } from 'svelte';

  export let fallback: string = 'Something went wrong. Please try again.';
  export let onError: ((error: Error) => void) | undefined = undefined;

  let error: Error | null = null;

  onMount(() => {
    window.addEventListener('error', (e: ErrorEvent) => {
      error = e.error;
      console.error('Caught error:', e.error);
      onError?.(e.error);
    });
  });
</script>

{#if error}
  <div class="error-boundary p-4 bg-red-100 text-red-700 rounded">
    <p class="font-medium">Error:</p>
    <p class="mt-1">{fallback}</p>
    {#if import.meta.env.DEV}
      <pre class="text-sm mt-2 p-2 bg-red-50 rounded">{error.message}</pre>
    {/if}
  </div>
{:else}
  <slot />
{/if}
