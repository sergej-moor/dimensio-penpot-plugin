<script lang="ts">
  import { selection, pixelateImage, updatePreview } from '../stores/selection';
  import { CONSTANTS } from '../constants';
  import { tooltip } from '../actions/tooltip';
  import { svgStore, setSVGContent, setError } from '../stores/svg';
  import ThreeScene from './ThreeScene.svelte';
  import MaterialControls from './MaterialControls.svelte';
  import { threeSceneStore } from '../stores/threeScene';
  import ObjectControls from './ObjectControls.svelte';
  import CameraControls from './CameraControls.svelte';
  import ColorControls from './ColorControls.svelte';

  let currentValue = $selection.pixelSize;
  let displayValue = currentValue;
  let lastSelectionId = $selection.id;
  let realtimePreview = false;
  let previousRealtimeState = false;
  let isExporting = false;

  // Just update the display value during dragging
  function handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    displayValue = parseInt(input.value);
  }

  // Update preview when slider is released
  function handleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pixelSize = parseInt(input.value);
    currentValue = pixelSize;
    displayValue = pixelSize;

    // Update the preview
    updatePreview(pixelSize);

    // If realtime preview is enabled, apply the effect immediately
    if (realtimePreview) {
      handleApplyEffect();
    }
  }

  // Watch for changes in realtime preview and selection fills
  $: {
    if (previousRealtimeState !== realtimePreview) {
      if (realtimePreview) {
        handleApplyEffect();
      } else if ($selection.fills.length > 0) {
        handleDeleteTopLayer();
      }
      previousRealtimeState = realtimePreview;
    }
  }

  function handleApplyEffect(): void {
    pixelateImage(currentValue, false);
  }

  function handleAddNewLayer(): void {
    pixelateImage(currentValue, true);
  }

  function handleDeleteTopLayer(): void {
    window.parent.postMessage(
      {
        type: 'delete-top-layer',
      },
      '*'
    );
  }

  // Only update values when selection changes (new image selected)
  $: if ($selection.id !== lastSelectionId) {
    currentValue = $selection.pixelSize;
    displayValue = currentValue;
    lastSelectionId = $selection.id;
  }

  // Check if controls should be disabled
  $: isDisabled = !$selection.exportedImage;
  $: isProcessing =
    $selection.isPixelizing ||
    $selection.isUploadingFill ||
    $selection.isPreviewLoading;
  $: shouldDisableApply = isDisabled || isProcessing || realtimePreview;

  async function handleSVGUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.svg')) {
      setError('Please upload an SVG file');
      return;
    }

    try {
      const text = await file.text();
      setSVGContent(text);
    } catch (error) {
      console.error('Error reading SVG file:', error);
      setError('Failed to read SVG file');
    } finally {
      // Clear the input so the same file can be uploaded again
      input.value = '';
    }
  }

  $: console.log('ThreeScene store state:', $threeSceneStore);

  async function handleExportToPenpot(): Promise<void> {
    console.log('Export clicked, component:', $threeSceneStore.component);
    if (isExporting || !$threeSceneStore.component) return;

    try {
      isExporting = true;
      const pngData = await $threeSceneStore.component.captureScene({
        width: 2000,
        height: 2000,
      });

      window.parent.postMessage(
        {
          type: 'update-image-fill',
          imageData: pngData,
          addNewLayer: true,
          originalFill: {
            opacity: 1,
            color: '#000000',
          },
        },
        '*'
      );
    } catch (error) {
      console.error('Error exporting scene:', error);
      setError('Failed to capture 3D scene');
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="flex flex-col gap-4 min-w-72 w-full h-full justify-between">
  <!--   <div class="checkbox-container flex items-center justify-end gap-2">
    <div
      use:tooltip={{
        text: 'Automatically apply changes while adjusting pixel size',
        position: 'left',
        maxWidth: 'max-w-[200px]',
      }}
    >
      <label for="realtimePreview" class="text-sm"> Realtime </label>
      <input
        id="realtimePreview"
        type="checkbox"
        bind:checked={realtimePreview}
        disabled={isDisabled || isProcessing}
        class="checkbox-input"
      />
    </div>
  </div>

  <label class="slider-row">
    <span
      class="body-s"
      use:tooltip={{
        text: 'Adjust the size of pixels in the effect',
        maxWidth: 'max-w-[200px]',
        position: 'right',
      }}
    >
      Pixel Size:
    </span>
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <input
          type="range"
          min={CONSTANTS.MIN_PIXEL_SIZE}
          max={CONSTANTS.MAX_PIXEL_SIZE}
          value={displayValue}
          on:input={handleInput}
          on:change={handleChange}
          class="w-full {isDisabled || isProcessing ? 'opacity-50' : ''}"
          disabled={isDisabled || isProcessing}
        />
      </div>
      <span class="text-sm w-8 text-right">{displayValue}</span>
    </div>
  </label> -->

  <div class="flex flex-col gap-2">
    <!--     <button
      on:click={handleApplyEffect}
      data-appearance="primary"
      disabled={shouldDisableApply}
      class:opacity-50={realtimePreview}
      class="flex-1 flex justify-center gap-2 items-center"
      use:tooltip={{
        text: 'Apply a pixelated fill layer to the current shape',
        position: 'top',
        maxWidth: 'max-w-[300px]',
      }}
    >
      {realtimePreview ? 'Auto-applying changes' : 'Apply to shape'}
    </button>

    <button
      on:click={handleAddNewLayer}
      disabled={isDisabled || isProcessing}
      data-appearance="primary"
      class="flex-1 flex justify-center gap-2 items-center"
      use:tooltip={{
        text: 'Create a new shape with the pixelation effect',
        position: 'bottom',
        maxWidth: 'max-w-[300px]',
      }}
    >
      Create new Shape
    </button> -->

    <button
      on:click={() => document.getElementById('svgInput').click()}
      disabled={isProcessing}
      data-appearance="secondary"
      class="flex-1 flex justify-center gap-2 items-center"
      use:tooltip={{
        text: 'Upload an SVG file to work with',
        position: 'bottom',
        maxWidth: 'max-w-[300px]',
      }}
    >
      Upload SVG
    </button>

    <button
      on:click={handleExportToPenpot}
      disabled={!$threeSceneStore.component || isExporting}
      data-appearance="secondary"
      class="flex-1 flex justify-center gap-2 items-center"
      use:tooltip={{
        text: 'Export the SVG as PNG and upload to Penpot',
        position: 'bottom',
        maxWidth: 'max-w-[300px]',
      }}
    >
      {#if isExporting}
        Exporting...
      {:else}
        Export to Penpot
      {/if}
    </button>

    <input
      id="svgInput"
      type="file"
      accept=".svg"
      class="hidden"
      on:change={handleSVGUpload}
    />
  </div>

  <div class="border-t pt-4 mt-4">
    <MaterialControls />
  </div>

  <div class="border-t pt-4 mt-4">
    <ObjectControls />
  </div>

  <div class="border-t pt-4 mt-4">
    <CameraControls />
  </div>

  <div class="border-t pt-4 mt-4">
    <ColorControls />
  </div>
</div>
