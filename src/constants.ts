export const CONSTANTS = {
  DEFAULT_PIXEL_SIZE: 1,
  MAX_PIXEL_SIZE: 96,
  MIN_PIXEL_SIZE: 1,
} as const;

export const LOADING_MESSAGES = {
  PREVIEW: 'Updating preview...',
  PIXELIZING: 'Pixelizing image...',
  UPLOADING: 'Uploading fill...',
  INITIAL: 'Exporting as an image:',
  NO_SELECTION: 'Select something to start',
} as const;
