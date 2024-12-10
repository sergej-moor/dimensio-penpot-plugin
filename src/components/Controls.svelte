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
  import ShapeControls from './ShapeControls.svelte';
  import Tabs from './Tabs.svelte';
  import {
    Upload,
    Settings2,
    Paintbrush,
    Aperture,
    Sparkles,
    Save,
    Palette,
  } from 'lucide-svelte';
  import PostProcessingControls from './PostProcessingControls.svelte';
  import { onMount } from 'svelte';

  let currentValue = $selection.pixelSize;
  let displayValue = currentValue;
  let lastSelectionId = $selection.id;
  let realtimePreview = false;
  let previousRealtimeState = false;
  let isExporting = false;

  onMount(async () => {
    try {
      const response = await fetch('./placeholder.svg');
      const text = await response.text();
      setSVGContent(text);
    } catch (error) {
      console.error('Error loading default SVG:', error);
      setError('Failed to load default SVG');
    }
  });

  const tabs = [
    {
      id: 'file',
      label: 'File',
      icon: Upload,
      component: undefined,
      tooltip: 'File Operations',
    },

    {
      id: 'shapes',
      label: 'Shapes',
      icon: Palette,
      component: ShapeControls,
      tooltip: 'Shape Controls',
      requiresSVG: true,
    },
    {
      id: 'object',
      label: 'Object',
      icon: Settings2,
      component: ObjectControls,
      tooltip: 'Object Settings',
      requiresSVG: true,
    },
    {
      id: 'material',
      label: 'Material',
      icon: Paintbrush,
      component: MaterialControls,
      tooltip: 'Material Settings',
      requiresSVG: true,
    },

    {
      id: 'camera',
      label: 'Camera',
      icon: Aperture,
      component: CameraControls,
      tooltip: 'Camera Controls',
      requiresSVG: true,
    },
    {
      id: 'postprocessing',
      label: 'Post Processing',
      icon: Sparkles,
      component: PostProcessingControls,
      tooltip: 'Post Processing Effects',
      requiresSVG: true,
    },

    {
      id: 'exports',
      label: 'Exports',
      icon: Save,
      component: undefined,
      tooltip: 'Export Options',
      requiresSVG: true,
    },
  ];

  let activeTab = 'file';

  // Reset to file tab when SVG is removed
  $: if (!$svgStore.content && activeTab !== 'file') {
    activeTab = 'file';
  }

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

  async function handleExportToPenpot(
    options: { width?: number; height?: number } = { width: 2000, height: 2000 }
  ): Promise<void> {
    console.log('Export clicked with options:', options);
    if (isExporting || !$threeSceneStore.component) return;

    try {
      isExporting = true;
      const pngData = await $threeSceneStore.component.captureScene({
        width: options.width,
        height: options.height,
      });

      window.parent.postMessage(
        {
          type: 'export-to-canvas',
          imageData: pngData,
          width: options.width,
          height: options.height,
        },
        '*'
      );
      console.log('Posted message to parent window');
    } catch (error) {
      console.error('Error exporting scene:', error, error.stack);
      setError('Failed to capture 3D scene');
    } finally {
      isExporting = false;
    }
  }
</script>

<div class="flex flex-col gap-4 w-[330px] h-full justify-between">
  <Tabs {tabs} bind:activeTab>
    {#if activeTab === 'file'}
      <div class="flex flex-col gap-2">
        <h3 class="text-sm font-medium">Import Settings</h3>
        <button
          on:click={() => document.getElementById('svgInput').click()}
          disabled={isProcessing}
          data-appearance="primary"
          class="flex-1 flex justify-center gap-2 items-center"
          use:tooltip={{
            text: 'Upload an SVG file to work with',
            position: 'bottom',
            maxWidth: 'max-w-[300px]',
          }}
        >
          Upload SVG
        </button>

        <input
          id="svgInput"
          type="file"
          accept=".svg"
          class="hidden"
          on:change={handleSVGUpload}
        />
      </div>
      <div class="flex flex-col gap-2 mt-8">
        <div class="text-sm text-gray-600 dark:text-gray-400 px-2">
          {#if $selection.name}
            Selected: {$selection.name}
          {:else}
            Selection: No element selected
          {/if}
        </div>
        <button
          on:click={() => {
            window.parent.postMessage({ type: 'export-selection-as-svg' }, '*');
          }}
          disabled={!$selection.name}
          data-appearance="secondary"
          class="flex-1 flex justify-center gap-2 items-center"
          use:tooltip={{
            text: 'Export current selection as SVG',
            position: 'bottom',
            maxWidth: 'max-w-[300px]',
          }}
        >
          Import selected SVG from Penpot
        </button>
      </div>

      <!-- Help Accordion -->
      <div class="flex flex-col gap-2 mt-8">
        <details class="group">
          <summary
            class="flex items-center justify-between cursor-pointer text-sm font-medium"
          >
            <span>Help</span>
            <span
              class="transform transition duration-300 group-open:rotate-180"
            >
              ▼
            </span>
          </summary>
          <div class="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <p>
              To ensure your shape works correctly in the Dimensio, follow these
              steps:
            </p>
            <ol class="list-decimal pl-5 space-y-2">
              <li>Use SVG files with an alpha background</li>
              <li>
                If issues arise when importing, adjust the SVG in a vector
                editor:
                <ul class="list-disc pl-5 mt-2 space-y-2">
                  <li>Reverse the path direction if holes don't appear.</li>
                  <li>
                    Remove any leftover background if a box appears instead.
                  </li>
                </ul>
              </li>
            </ol>
          </div>
        </details>
      </div>
    {:else if activeTab === 'exports'}
      <div class="flex flex-col gap-2">
        <h3 class="text-sm font-medium">Export Resolution</h3>

        <button
          on:click={() => handleExportToPenpot({ width: 1000, height: 1000 })}
          disabled={!$threeSceneStore.component || isExporting}
          data-appearance="primary"
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
            Export (1000px x 1000px)
          {/if}
        </button>

        <button
          on:click={() => handleExportToPenpot({ width: 2000, height: 2000 })}
          disabled={!$threeSceneStore.component || isExporting}
          data-appearance="primary"
          class="flex-1 flex justify-center gap-2 items-center"
          use:tooltip={{
            text: 'Export at 2x resolution (4000x4000)',
            position: 'bottom',
            maxWidth: 'max-w-[300px]',
          }}
        >
          {#if isExporting}
            Exporting...
          {:else}
            Export (2x)
          {/if}
        </button>

        <button
          on:click={() => handleExportToPenpot({ width: 4000, height: 4000 })}
          disabled={!$threeSceneStore.component || isExporting}
          data-appearance="primary"
          class="flex-1 flex justify-center gap-2 items-center"
          use:tooltip={{
            text: 'Export at 4x resolution (8000x8000)',
            position: 'bottom',
            maxWidth: 'max-w-[300px]',
          }}
        >
          {#if isExporting}
            Exporting...
          {:else}
            Export (4x)
          {/if}
        </button>
      </div>
    {:else if activeTab === 'material'}
      <MaterialControls />
    {:else if activeTab === 'object'}
      <ObjectControls />
    {:else if activeTab === 'camera'}
      <CameraControls />
    {:else if activeTab === 'shapes'}
      <ShapeControls />
    {:else if activeTab === 'postprocessing'}
      <PostProcessingControls />
    {/if}
  </Tabs>
</div>
