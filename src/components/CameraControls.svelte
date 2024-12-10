<script lang="ts">
  import {
    cameraStore,
    updateCameraPosition,
    resetCamera,
  } from '../stores/camera';
  import { tooltip } from '../actions/tooltip';
  import type { Vector3 } from 'three';

  function handlePositionChange(axis: keyof Vector3, value: number) {
    updateCameraPosition({
      ...$cameraStore.position,
      [axis]: value,
    });
  }

  function handleResetCamera() {
    if ($cameraStore.defaultPosition) {
      resetCamera();
    }
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex justify-between items-center">
    <h3 class="text-sm font-medium">Camera Controls</h3>
    <button
      on:click={handleResetCamera}
      disabled={!$cameraStore.defaultPosition}
      data-appearance="secondary"
      use:tooltip={{
        text: 'Reset camera to default position',
        position: 'left',
      }}
    >
      Reset Camera
    </button>
  </div>

  <div class="flex flex-col gap-2">
    <label class="text-sm flex justify-between">
      X: {$cameraStore.position.x.toFixed(2)}
      <input
        type="range"
        min="-10"
        max="10"
        step="0.1"
        value={$cameraStore.position.x}
        on:input={(e) =>
          handlePositionChange('x', parseFloat(e.currentTarget.value))}
        class="flex-1 ml-2"
      />
    </label>

    <label class="text-sm flex justify-between">
      Y: {$cameraStore.position.y.toFixed(2)}
      <input
        type="range"
        min="-10"
        max="10"
        step="0.1"
        value={$cameraStore.position.y}
        on:input={(e) =>
          handlePositionChange('y', parseFloat(e.currentTarget.value))}
        class="flex-1 ml-2"
      />
    </label>

    <label class="text-sm flex justify-between">
      Z: {$cameraStore.position.z.toFixed(2)}
      <input
        type="range"
        min="0"
        max="20"
        step="0.1"
        value={$cameraStore.position.z}
        on:input={(e) =>
          handlePositionChange('z', parseFloat(e.currentTarget.value))}
        class="flex-1 ml-2"
      />
    </label>
  </div>
</div>
