import { writable, get } from 'svelte/store';
import type { Fill } from '@penpot/plugin-types';
import { processImage } from '../utils/imageProcessing';
import type { SelectionState } from '../types';

const initialState: SelectionState = {
  id: '',
  name: '',
  fills: [],
  isLoading: false,
  isPixelizing: false,
  isUploadingFill: false,
  isPreviewLoading: false,
  pixelSize: 1,
  error: undefined,
};

export const selection = writable<SelectionState>(initialState);

export function updateSelection(
  shapes: { id: string; name: string; fills: Fill[] | 'mixed' } | null
): void {
  // If no shapes or shapes is null, reset to initial state
  if (!shapes) {
    selection.set(initialState);
    return;
  }

  // Use Penpot's ID directly
  selection.update(() => ({
    ...initialState,
    id: shapes.id,
    name: shapes.name,
    fills: shapes.fills,
    // Clear all image data
    originalImage: undefined,
    exportedImage: undefined,
    previewImage: undefined,
  }));
}

export async function updatePreview(pixelSize: number): Promise<void> {
  const state = get(selection);
  if (!state.originalImage || !state.name || !state.fills || !state.id) return;
  const currentId = state.id;

  try {
    // Clear any existing preview data before starting new preview
    selection.update((state) => ({
      ...state,
      isPreviewLoading: true,
      previewImage: undefined, // Clear existing preview
    }));

    const processed = await processImage(
      new Uint8Array(state.originalImage.data),
      state.originalImage.width,
      state.originalImage.height,
      pixelSize
    );

    // Check if we still have the same selection
    const currentState = get(selection);
    if (
      !currentState.name ||
      !currentState.fills ||
      currentState.id !== currentId
    ) {
      return;
    }

    selection.update((state) => ({
      ...state,
      pixelSize,
      isPreviewLoading: false,
      previewImage: {
        width: state.originalImage!.width,
        height: state.originalImage!.height,
        data: Array.from(processed.data),
      },
    }));
  } catch (error) {
    console.error('Failed to update preview:', error);
    selection.update((state) => ({
      ...state,
      isPreviewLoading: false,
      previewImage: undefined, // Clear preview on error
    }));
  }
}

export async function pixelateImage(
  pixelSize: number,
  addNewLayer: boolean
): Promise<void> {
  const state = get(selection);
  if (!state.originalImage || !state.fills?.length || !state.name) return;

  try {
    selection.update((state) => ({ ...state, isPixelizing: true }));

    const processed = await processImage(
      new Uint8Array(state.originalImage.data),
      state.originalImage.width,
      state.originalImage.height,
      pixelSize
    );

    // Check if we still have a selection before continuing
    const currentState = get(selection);
    if (!currentState.name || !currentState.fills) {
      return;
    }

    selection.update((state) => ({ ...state, isUploadingFill: true }));

    // Send the processed image to be uploaded
    const message = {
      type: 'update-image-fill' as const,
      imageData: processed.data,
      fillIndex: 0,
      originalFill: state.fills[state.fills.length - 1],
      shouldDeleteFirst: !addNewLayer && state.fills.length >= 2,
      addNewLayer,
    };
    window.parent.postMessage(message, '*');

    // Update the preview with the processed image
    selection.update((state) => ({
      ...state,
      pixelSize,
      isPixelizing: false,
      exportedImage: {
        width: state.originalImage!.width,
        height: state.originalImage!.height,
        data: Array.from(processed.data),
      },
    }));
  } catch (error) {
    console.error('Failed to pixelate image:', error);
    selection.update((state) => ({ ...state, isPixelizing: false }));
  }
}

export function updateExportedImage(
  imageData: number[],
  width: number,
  height: number,
  selectionId: string
): void {
  try {
    selection.update((state) => {
      // Only update if we still have the same selection
      if (!state.name || !state.fills || state.id !== selectionId) {
        return state;
      }

      return {
        ...state,
        isLoading: false,
        originalImage: {
          data: imageData,
          width,
          height,
        },
        exportedImage: {
          data: imageData,
          width,
          height,
        },
      };
    });
  } catch (error) {
    console.error('Failed to update exported image:', error);
    selection.update((state) => ({
      ...state,
      isLoading: false,
      error:
        'Failed to process image. Please try again with a different selection.',
    }));
  }
}

export function setUploadingFill(isUploading: boolean): void {
  selection.update((state) => {
    // Only update if we still have a selection
    if (!state.name || !state.fills) {
      return initialState;
    }
    return {
      ...state,
      isUploadingFill: isUploading,
    };
  });
}

export function setLoading(isLoading: boolean): void {
  selection.update((state) => {
    // If setting to false and we don't have a selection, reset to initial state
    if (!isLoading && (!state.name || !state.fills)) {
      return initialState;
    }
    return {
      ...state,
      isLoading,
    };
  });
}
