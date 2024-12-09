<script lang="ts">
  import {
    colorStore,
    updateGroupColor,
    resetGroupColor,
  } from '../stores/color';
  import { tooltip } from '../actions/tooltip';
  import * as THREE from 'three';

  function handleColorChange(groupId: string, colorHex: string) {
    const color = new THREE.Color(colorHex);
    updateGroupColor(groupId, color);
  }

  function handleResetColor(groupId: string) {
    resetGroupColor(groupId);
  }

  function colorToHex(color: THREE.Color): string {
    return '#' + color.getHexString();
  }
</script>

<div class="flex flex-col gap-4">
  <h3 class="text-sm font-medium">Color Controls</h3>

  {#if $colorStore.groups.length === 0}
    <p class="text-sm text-gray-500">No color groups found</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each $colorStore.groups as group (group.id)}
        <div class="flex items-center gap-2">
          <input
            type="color"
            value={colorToHex(group.color)}
            on:input={(e) => handleColorChange(group.id, e.currentTarget.value)}
            class="w-8 h-8 rounded cursor-pointer"
          />
          <button
            on:click={() => handleResetColor(group.id)}
            class="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            use:tooltip={{
              text: 'Reset to original color',
              position: 'right',
            }}
          >
            Reset
          </button>
          <span class="text-sm ml-2"
            >Group {group.meshIndices.length} shapes</span
          >
        </div>
      {/each}
    </div>
  {/if}
</div>
