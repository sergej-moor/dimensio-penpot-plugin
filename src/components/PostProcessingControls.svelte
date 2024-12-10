<script lang="ts">
  import {
    postProcessingStore,
    updatePostProcessingSettings,
  } from '../stores/postprocessing';
  import { tooltip } from '../actions/tooltip';

  function handleBloomToggle(enabled: boolean) {
    updatePostProcessingSettings({
      bloom: { ...$postProcessingStore.settings.bloom, enabled },
    });
  }

  function handleNoiseToggle(enabled: boolean) {
    updatePostProcessingSettings({
      noise: { ...$postProcessingStore.settings.noise, enabled },
    });
  }

  function handleBloomSettingChange(
    setting: keyof typeof $postProcessingStore.settings.bloom,
    value: number
  ) {
    updatePostProcessingSettings({
      bloom: { ...$postProcessingStore.settings.bloom, [setting]: value },
    });
  }

  function handleNoiseSettingChange(
    setting: keyof typeof $postProcessingStore.settings.noise,
    value: number
  ) {
    updatePostProcessingSettings({
      noise: { ...$postProcessingStore.settings.noise, [setting]: value },
    });
  }

  function handleEdgeSettingChange(
    setting: keyof typeof $postProcessingStore.settings.edge,
    value: number
  ) {
    updatePostProcessingSettings({
      edge: { ...$postProcessingStore.settings.edge, [setting]: value },
    });
  }

  function handleColorSettingChange(
    setting: keyof typeof $postProcessingStore.settings.color,
    value: number
  ) {
    updatePostProcessingSettings({
      color: { ...$postProcessingStore.settings.color, [setting]: value },
    });
  }

  function handleVignetteSettingChange(
    setting: keyof typeof $postProcessingStore.settings.vignette,
    value: number
  ) {
    updatePostProcessingSettings({
      vignette: { ...$postProcessingStore.settings.vignette, [setting]: value },
    });
  }

  function handleEdgeToggle(enabled: boolean) {
    updatePostProcessingSettings({
      edge: { ...$postProcessingStore.settings.edge, enabled },
    });
  }

  function handleColorToggle(enabled: boolean) {
    updatePostProcessingSettings({
      color: { ...$postProcessingStore.settings.color, enabled },
    });
  }

  function handleVignetteToggle(enabled: boolean) {
    updatePostProcessingSettings({
      vignette: { ...$postProcessingStore.settings.vignette, enabled },
    });
  }

  function handlePixelationToggle(enabled: boolean) {
    updatePostProcessingSettings({
      pixelation: { ...$postProcessingStore.settings.pixelation, enabled },
    });
  }

  function handlePixelationSettingChange(value: number) {
    updatePostProcessingSettings({
      pixelation: {
        ...$postProcessingStore.settings.pixelation,
        pixelSize: value,
      },
    });
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">Bloom Effect</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          class="sr-only peer"
          checked={$postProcessingStore.settings.bloom.enabled}
          on:change={(e) => handleBloomToggle(e.currentTarget.checked)}
        />
        <div
          class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        ></div>
      </label>
    </div>

    {#if $postProcessingStore.settings.bloom.enabled}
      <div class="flex flex-col gap-2 pl-4">
        <label class="text-sm flex justify-between">
          Intensity: {$postProcessingStore.settings.bloom.intensity.toFixed(2)}
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={$postProcessingStore.settings.bloom.intensity}
            on:input={(e) =>
              handleBloomSettingChange(
                'intensity',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>

        <label class="text-sm flex justify-between">
          Threshold: {$postProcessingStore.settings.bloom.threshold.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={$postProcessingStore.settings.bloom.threshold}
            on:input={(e) =>
              handleBloomSettingChange(
                'threshold',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>

        <label class="text-sm flex justify-between">
          Radius: {$postProcessingStore.settings.bloom.radius.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={$postProcessingStore.settings.bloom.radius}
            on:input={(e) =>
              handleBloomSettingChange(
                'radius',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">Noise Effect</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          class="sr-only peer"
          checked={$postProcessingStore.settings.noise.enabled}
          on:change={(e) => handleNoiseToggle(e.currentTarget.checked)}
        />
        <div
          class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        ></div>
      </label>
    </div>

    {#if $postProcessingStore.settings.noise.enabled}
      <div class="flex flex-col gap-2 pl-4">
        <label class="text-sm flex justify-between">
          Intensity: {$postProcessingStore.settings.noise.intensity.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={$postProcessingStore.settings.noise.intensity}
            on:input={(e) =>
              handleNoiseSettingChange(
                'intensity',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">Edge Detection</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          class="sr-only peer"
          checked={$postProcessingStore.settings.edge.enabled}
          on:change={(e) => handleEdgeToggle(e.currentTarget.checked)}
        />
        <div
          class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        />
      </label>
    </div>

    {#if $postProcessingStore.settings.edge.enabled}
      <div class="flex flex-col gap-2 pl-4">
        <label class="text-sm flex justify-between">
          Intensity: {$postProcessingStore.settings.edge.intensity.toFixed(2)}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={$postProcessingStore.settings.edge.intensity}
            on:input={(e) =>
              handleEdgeSettingChange(
                'intensity',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>

        <label class="text-sm flex justify-between">
          Threshold: {$postProcessingStore.settings.edge.threshold.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={$postProcessingStore.settings.edge.threshold}
            on:input={(e) =>
              handleEdgeSettingChange(
                'threshold',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">Color Adjustment</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          class="sr-only peer"
          checked={$postProcessingStore.settings.color.enabled}
          on:change={(e) => handleColorToggle(e.currentTarget.checked)}
        />
        <div
          class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        />
      </label>
    </div>

    {#if $postProcessingStore.settings.color.enabled}
      <div class="flex flex-col gap-2 pl-4">
        <label class="text-sm flex justify-between">
          Brightness: {$postProcessingStore.settings.color.brightness.toFixed(
            2
          )}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={$postProcessingStore.settings.color.brightness}
            on:input={(e) =>
              handleColorSettingChange(
                'brightness',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>

        <label class="text-sm flex justify-between">
          Saturation: {$postProcessingStore.settings.color.saturation.toFixed(
            2
          )}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={$postProcessingStore.settings.color.saturation}
            on:input={(e) =>
              handleColorSettingChange(
                'saturation',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>

        <label class="text-sm flex justify-between">
          Contrast: {$postProcessingStore.settings.color.contrast.toFixed(2)}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={$postProcessingStore.settings.color.contrast}
            on:input={(e) =>
              handleColorSettingChange(
                'contrast',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">Vignette</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          class="sr-only peer"
          checked={$postProcessingStore.settings.vignette.enabled}
          on:change={(e) => handleVignetteToggle(e.currentTarget.checked)}
        />
        <div
          class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        />
      </label>
    </div>

    {#if $postProcessingStore.settings.vignette.enabled}
      <div class="flex flex-col gap-2 pl-4">
        <label class="text-sm flex justify-between">
          Darkness: {$postProcessingStore.settings.vignette.darkness.toFixed(2)}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={$postProcessingStore.settings.vignette.darkness}
            on:input={(e) =>
              handleVignetteSettingChange(
                'darkness',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>

        <label class="text-sm flex justify-between">
          Offset: {$postProcessingStore.settings.vignette.offset.toFixed(2)}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={$postProcessingStore.settings.vignette.offset}
            on:input={(e) =>
              handleVignetteSettingChange(
                'offset',
                parseFloat(e.currentTarget.value)
              )}
            class="flex-1 ml-2"
          />
        </label>
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">Pixelation</h3>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          class="sr-only peer"
          checked={$postProcessingStore.settings.pixelation.enabled}
          on:change={(e) => handlePixelationToggle(e.currentTarget.checked)}
        />
        <div
          class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        />
      </label>
    </div>

    {#if $postProcessingStore.settings.pixelation.enabled}
      <div class="flex flex-col gap-2 pl-4">
        <label class="text-sm flex justify-between">
          Pixel Size: {$postProcessingStore.settings.pixelation.pixelSize}
          <input
            type="range"
            min="2"
            max="32"
            step="1"
            value={$postProcessingStore.settings.pixelation.pixelSize}
            on:input={(e) =>
              handlePixelationSettingChange(parseInt(e.currentTarget.value))}
            class="flex-1 ml-2"
          />
        </label>
      </div>
    {/if}
  </div>
</div>
