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
</div>
