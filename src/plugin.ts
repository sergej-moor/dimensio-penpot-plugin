import type {
  PixelatedShapeConfig,
  NewLayerConfig,
  PluginMessage,
  SelectionState,
} from './types';
import type {
  Fill,
  ImageData as PenpotImageData,
  Shape,
} from '@penpot/plugin-types';

// Configuration
const PLUGIN_CONFIG = {
  name: 'Dimensio',
  width: 940,
  height: 922,
} as const;

// Plugin initialization
function initializePlugin(): void {
  penpot.ui.open(PLUGIN_CONFIG.name, `?theme=${penpot.theme}`, {
    width: PLUGIN_CONFIG.width,
    height: PLUGIN_CONFIG.height,
  });

  setupEventListeners();
}

// Event listeners setup
function setupEventListeners(): void {
  penpot.ui.onMessage(handlePluginMessage);
  penpot.on('themechange', handleThemeChange);
  penpot.on('selectionchange', handleSelectionChange);
}

// Image handling
async function uploadImage(imageData: Uint8Array): Promise<PenpotImageData> {
  try {
    const uploadedImage = await penpot.uploadMediaData(
      'exported-image',
      imageData,
      'image/png'
    );
    if (!uploadedImage) throw new Error('Failed to upload image');
    return uploadedImage;
  } catch (error) {
    console.error('Error uploading image:', error);
    sendMessage({
      type: 'export-error',
      error: 'Failed to upload image. The file might be too large.',
    });
    throw error;
  }
}

// Shape creation
function createPixelatedShape({
  width,
  height,
  imageFill,
}: PixelatedShapeConfig): void {
  const rect = penpot.createRectangle();
  rect.x = penpot.viewport.center.x;
  rect.y = penpot.viewport.center.y;
  rect.resize(width, height);
  rect.fills = [imageFill];
}

// Layer management
async function addNewPixelatedLayer(data: NewLayerConfig): Promise<void> {
  const blockId = penpot.history.undoBlockBegin();

  try {
    const imageUrl = await uploadImage(data.imageData);
    const imageFill: Fill & { type: 'image' } = {
      ...data.originalFill,
      type: 'image',
      fillImage: imageUrl,
    };

    createPixelatedShape({
      width: data.width,
      height: data.height,
      imageFill,
    });
    sendMessage({ type: 'fill-upload-complete' });
  } catch (error) {
    console.error('Error creating new layer:', error);
    sendMessage({
      type: 'export-error',
      error: 'Failed to create new layer. Please try again.',
    });
  } finally {
    penpot.history.undoBlockFinish(blockId);
  }
}

async function updateExistingLayer(
  selection: Shape,
  imageData: Uint8Array,
  originalFill: Fill,
  shouldDeleteFirst: boolean
): Promise<void> {
  const imageUrl = await uploadImage(imageData);
  const imageFill: Fill & { type: 'image' } = {
    ...originalFill,
    type: 'image',
    fillImage: imageUrl,
  };

  if (Array.isArray(selection.fills)) {
    const lastFill = selection.fills[selection.fills.length - 1];
    selection.fills = shouldDeleteFirst
      ? [imageFill, lastFill]
      : [imageFill, lastFill];
  } else {
    selection.fills = [imageFill];
  }

  sendMessage({ type: 'fill-upload-complete' });
}

function deleteTopLayer(selection: Shape): void {
  if (!Array.isArray(selection.fills) || selection.fills.length <= 1) return;

  const blockId = penpot.history.undoBlockBegin();
  try {
    selection.fills = selection.fills.slice(1);
  } finally {
    penpot.history.undoBlockFinish(blockId);
  }
}
/* 
function clearAllExceptLast(selection: any): void {
  if (!Array.isArray(selection.fills) || selection.fills.length <= 1) return;

  const blockId = penpot.history.undoBlockBegin();
  try {
    const lastFill = selection.fills[selection.fills.length - 1];
    selection.fills = [lastFill];
  } finally {
    penpot.history.undoBlockFinish(blockId);
  }
} */

// Event handlers
function handleThemeChange(theme: string): void {
  sendMessage({ type: 'theme', content: theme });
}

async function handleSelectionChange(): Promise<void> {
  const selection = penpot.selection[0];
  if (!selection) {
    sendMessage({ type: 'selection', content: null });
    return;
  }

  try {
    sendMessage({ type: 'selection-loading', isLoading: true });

    const selectionState: SelectionState = {
      id: selection.id,
      name: selection.name,
      fills: selection.fills,
      isLoading: true,
      isPixelizing: false,
      isUploadingFill: false,
      isPreviewLoading: false,
      pixelSize: 1,
    };

    sendMessage({ type: 'selection', content: selectionState });

    if (Array.isArray(selection.fills)) {
      const imageData = await selection.export({ type: 'svg', scale: 2 });
      sendMessage({
        type: 'selection-loaded',
        imageData: new Uint8Array(imageData),
        width: selection.width,
        height: selection.height,
        selectionId: selection.id,
      });
    }
  } catch (error) {
    console.error('Error handling selection change:', error);
    sendMessage({
      type: 'export-error',
      error: 'Failed to process selection. The image might be too complex.',
    });
  } finally {
    sendMessage({ type: 'selection-loading', isLoading: false });
  }
}

async function handlePluginMessage(message: PluginMessage): Promise<void> {
  const selection = penpot.selection[0] as Shape | undefined;
  if (!selection) return;

  switch (message.type) {
    case 'update-image-fill':
      await handleImageFillUpdate(selection, message);
      break;
    case 'delete-top-layer':
      deleteTopLayer(selection);
      break;
    default:
      console.warn(`Unhandled message type: ${message.type}`);
  }
}

// Helper functions
function sendMessage(message: PluginMessage): void {
  penpot.ui.sendMessage(message);
}

async function handleImageFillUpdate(
  selection: Shape,
  message: PluginMessage & { type: 'update-image-fill' }
): Promise<void> {
  try {
    if (message.addNewLayer) {
      await addNewPixelatedLayer({
        imageData: message.imageData,
        width: selection.width,
        height: selection.height,
        originalFill: message.originalFill,
      });
    } else {
      await updateExistingLayer(
        selection,
        message.imageData,
        message.originalFill,
        message.shouldDeleteFirst
      );
    }
  } catch (error) {
    console.error('Error updating image fill:', error);
  }
}

// Initialize plugin
initializePlugin();
