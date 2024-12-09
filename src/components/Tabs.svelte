<script lang="ts">
  import { tooltip } from '../actions/tooltip';

  export let tabs: Array<{
    id: string;
    label: string;
    icon: any;
    tooltip: string;
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
        on:click={() => (activeTab = tab.id)}
        use:tooltip={{
          text: tab.tooltip,
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

  button:hover:not(.active) {
    background-color: var(--la-tertiary);
  }

  button.active {
    background-color: var(--la-primary);
    color: var(--lf-on-primary);
  }

  /* Dark mode overrides */
  :global(main[data-theme='dark']) button {
    background-color: var(--db-primary);
    color: var(--df-primary);
  }

  :global(main[data-theme='dark']) button:hover:not(.active) {
    background-color: var(--da-tertiary);
  }

  :global(main[data-theme='dark']) button.active {
    background-color: var(--da-primary);
    color: var(--df-on-primary);
  }
</style>
