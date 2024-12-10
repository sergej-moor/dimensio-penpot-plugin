<script lang="ts">
  import { tooltip } from '../actions/tooltip';
  import { svgStore } from '../stores/svg';

  export let tabs: Array<{
    id: string;
    label: string;
    icon: any;
    tooltip: string;
    requiresSVG?: boolean;
  }>;
  export let activeTab: string;
</script>

<div class="flex flex-col h-full">
  <div class="flex gap-2 mb-4">
    {#each tabs as tab}
      <button
        class="w-10 h-10 flex justify-center items-center"
        data-appearance="secondary"
        class:active={activeTab === tab.id}
        class:disabled={tab.requiresSVG && !$svgStore.content}
        disabled={tab.requiresSVG && !$svgStore.content}
        on:click={() => (activeTab = tab.id)}
        use:tooltip={{
          text:
            tab.requiresSVG && !$svgStore.content
              ? 'Upload an SVG first'
              : tab.tooltip,
          position: 'bottom',
          maxWidth: 'max-w-[300px]',
        }}
      >
        <svelte:component this={tab.icon} size={18} />
      </button>
    {/each}
  </div>
  <div class="flex-1">
    <slot />
  </div>
</div>

<style>
  button {
    background-color: var(--background-color);
    color: var(--text-color);
    border-radius: 0.8rem;
    transition: all 0.2s ease;
    min-width: 2.5rem;
    min-height: 2.5rem;
    padding: 0;
  }

  :global(main[data-theme='light']) button {
    color: var(--lf-primary);
  }
  :global(main[data-theme='light']) button:hover:not(.active):not(.disabled) {
    background-color: var(--la-tertiary);
  }

  :global(main[data-theme='light']) button.active {
    border: var(--la-primary) 1px solid;
    color: var(--lf-on-primary);
  }

  button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Dark mode overrides */
  :global(main[data-theme='dark']) button {
    background-color: var(--db-primary);
    color: var(--df-primary);
  }

  :global(main[data-theme='dark']) button:hover:not(.active):not(.disabled) {
    background-color: var(--da-tertiary);
  }

  :global(main[data-theme='dark']) button.active {
    border: var(--la-primary) 1px solid;
    color: var(--df-on-primary);
  }
</style>
