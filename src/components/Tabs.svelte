<script lang="ts">
  export let tabs: { id: string; label: string }[];
  export let activeTab: string;

  function setActiveTab(tabId: string) {
    activeTab = tabId;
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex gap-1 border-b">
    {#each tabs as tab}
      <button
        class="px-4 py-2 text-sm font-medium transition-colors rounded-t-lg {activeTab ===
        tab.id
          ? 'bg-gray-100 border-b-2 border-blue-500'
          : 'hover:bg-gray-50'}"
        on:click={() => setActiveTab(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div class="flex-1">
    <slot {activeTab} />
  </div>
</div>
