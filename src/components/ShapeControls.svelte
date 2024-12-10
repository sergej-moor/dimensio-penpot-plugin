<script lang="ts">
  import * as THREE from 'three';
  import {
    shapeStore,
    updateGroupColor,
    updateGroupDepth,
    resetGroupColor,
  } from '../stores/shapes';
  import type { Color } from 'three';

  function handleColorChange(groupId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const color = new THREE.Color(input.value);
    updateGroupColor(groupId, color);
  }

  function handleDepthChange(groupId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const depth = parseFloat(input.value);
    updateGroupDepth(groupId, depth);
  }

  function handleReset(groupId: string) {
    resetGroupColor(groupId);
  }
</script>

<div class="space-y-4">
  <h2 class="text-lg font-semibold">Shape Groups</h2>
  {#each $shapeStore.groups as group (group.id)}
    <div class="p-4 border border-gray-100 rounded-lg">
      <div class="flex items-center gap-4 mb-2">
        <input
          type="color"
          value={'#' + group.color.getHexString()}
          on:input={(e) => handleColorChange(group.id, e)}
          class="w-12 h-8"
        />
        <button
          on:click={() => handleReset(group.id)}
          data-appearance="secondary"
          class="normal-case"
        >
          Reset Color
        </button>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm">Depth:</label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={group.depth}
          on:input={(e) => handleDepthChange(group.id, e)}
          class="flex-grow"
        />
        <span class="text-sm w-12 text-right">{group.depth.toFixed(1)}</span>
      </div>
    </div>
  {/each}
</div>

<style>
  input[type='color'] {
    -webkit-appearance: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  input[type='color']::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
</style>
