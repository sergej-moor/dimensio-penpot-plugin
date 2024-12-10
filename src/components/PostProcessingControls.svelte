<script lang="ts">
  import {
    postProcessingStore,
    updatePostProcessingSettings,
    moveEffect,
    type PostProcessingEffect,
  } from '../stores/postprocessing';
  import { tooltip } from '../actions/tooltip';
  import { ChevronDown, ChevronUp } from 'lucide-svelte';

  function handleMove(index: number, direction: 'up' | 'down') {
    moveEffect(index, direction);
  }

  function handleEffectToggle(effect: PostProcessingEffect, enabled: boolean) {
    const updatedEffects = $postProcessingStore.settings.effects.map((e) =>
      e.order === effect.order
        ? { ...e, settings: { ...e.settings, enabled } }
        : e
    );
    updatePostProcessingSettings({ effects: updatedEffects });
  }

  function handleEffectSettingChange(
    effect: PostProcessingEffect,
    setting: string,
    value: number
  ) {
    const updatedEffects = $postProcessingStore.settings.effects.map((e) =>
      e.order === effect.order
        ? { ...e, settings: { ...e.settings, [setting]: value } }
        : e
    );
    updatePostProcessingSettings({ effects: updatedEffects });
  }
</script>

<div class="flex flex-col gap-4">
  <h3 class="text-sm font-medium">Post Processing Settings</h3>
  {#each $postProcessingStore.settings.effects.sort((a, b) => a.order - b.order) as effect, index}
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="flex flex-col gap-1">
            <button
              class="p-0 w-6 h-6 disabled:opacity-50"
              disabled={index === 0}
              on:click={() => handleMove(index, 'up')}
              use:tooltip={{ text: 'Move up', position: 'right' }}
            >
              <ChevronUp class="w-6 h-6 p-0 -mt-1" />
            </button>
            <button
              class="p-0 w-6 h-6 disabled:opacity-50"
              disabled={index ===
                $postProcessingStore.settings.effects.length - 1}
              on:click={() => handleMove(index, 'down')}
              use:tooltip={{ text: 'Move down', position: 'right' }}
            >
              <ChevronDown class="w-6 h-6  p-0 -mb-1" />
            </button>
          </div>
          <h3 class="text-sm font-medium capitalize">{effect.type}</h3>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            class="sr-only peer"
            checked={effect.settings.enabled}
            on:change={(e) =>
              handleEffectToggle(effect, e.currentTarget.checked)}
          />
          <div class="toggle-switch"></div>
        </label>
      </div>

      {#if effect.settings.enabled}
        <div class="flex flex-col gap-2 pl-4">
          {#if effect.type === 'pixelation'}
            <label class="text-sm flex justify-between">
              Size: {effect.settings.pixelSize}
              <input
                type="range"
                min="2"
                max="32"
                step="1"
                value={effect.settings.pixelSize}
                on:input={(e) =>
                  handleEffectSettingChange(
                    effect,
                    'pixelSize',
                    parseInt(e.currentTarget.value)
                  )}
                class="flex-1 ml-2"
              />
            </label>
          {:else if effect.type === 'noise'}
            <label class="text-sm flex justify-between">
              Intensity: {effect.settings.intensity.toFixed(2)}
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={effect.settings.intensity}
                on:input={(e) =>
                  handleEffectSettingChange(
                    effect,
                    'intensity',
                    parseFloat(e.currentTarget.value)
                  )}
                class="flex-1 ml-2"
              />
            </label>
          {:else if effect.type === 'edge'}
            <label class="text-sm flex justify-between">
              Intensity: {effect.settings.intensity.toFixed(2)}
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={effect.settings.intensity}
                on:input={(e) =>
                  handleEffectSettingChange(
                    effect,
                    'intensity',
                    parseFloat(e.currentTarget.value)
                  )}
                class="flex-1 ml-2"
              />
            </label>
            <label class="text-sm flex justify-between">
              Threshold: {effect.settings.threshold.toFixed(2)}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effect.settings.threshold}
                on:input={(e) =>
                  handleEffectSettingChange(
                    effect,
                    'threshold',
                    parseFloat(e.currentTarget.value)
                  )}
                class="flex-1 ml-2"
              />
            </label>
          {:else if effect.type === 'color'}
            <label class="text-sm flex justify-between">
              Brightness: {effect.settings.brightness.toFixed(2)}
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={effect.settings.brightness}
                on:input={(e) =>
                  handleEffectSettingChange(
                    effect,
                    'brightness',
                    parseFloat(e.currentTarget.value)
                  )}
                class="flex-1 ml-2"
              />
            </label>
            <label class="text-sm flex justify-between">
              Saturation: {effect.settings.saturation.toFixed(2)}
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={effect.settings.saturation}
                on:input={(e) =>
                  handleEffectSettingChange(
                    effect,
                    'saturation',
                    parseFloat(e.currentTarget.value)
                  )}
                class="flex-1 ml-2"
              />
            </label>
            <label class="text-sm flex justify-between">
              Contrast: {effect.settings.contrast.toFixed(2)}
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={effect.settings.contrast}
                on:input={(e) =>
                  handleEffectSettingChange(
                    effect,
                    'contrast',
                    parseFloat(e.currentTarget.value)
                  )}
                class="flex-1 ml-2"
              />
            </label>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .toggle-switch {
    @apply w-9 h-5 rounded-full relative;
    background-color: var(--lb-tertiary);
    transition: background-color 0.2s ease;
  }

  .toggle-switch::after {
    content: '';
    @apply absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white;
    transition: transform 0.2s ease;
  }

  :global([data-theme='dark']) .toggle-switch {
    background-color: var(--db-tertiary);
  }

  :global(.peer:checked) + .toggle-switch {
    background-color: var(--la-primary);
  }

  :global([data-theme='dark']) :global(.peer:checked) + .toggle-switch {
    background-color: var(--da-primary);
  }

  :global(.peer:checked) + .toggle-switch::after {
    transform: translateX(calc(100% + 2px));
  }
</style>
