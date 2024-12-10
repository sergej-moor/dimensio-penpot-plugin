import { writable } from 'svelte/store';

export interface PostProcessingSettings {
  pixelation: {
    enabled: boolean;
    pixelSize: number;
  };
  bloom: {
    enabled: boolean;
    intensity: number;
    threshold: number;
    radius: number;
  };
  noise: {
    enabled: boolean;
    intensity: number;
  };
  edge: {
    enabled: boolean;
    intensity: number;
    threshold: number;
  };
  color: {
    enabled: boolean;
    brightness: number;
    saturation: number;
    contrast: number;
  };
  vignette: {
    enabled: boolean;
    darkness: number;
    offset: number;
  };
}

const DEFAULT_SETTINGS: PostProcessingSettings = {
  pixelation: {
    enabled: false,
    pixelSize: 8,
  },
  bloom: {
    enabled: false,
    intensity: 1,
    threshold: 0.5,
    radius: 0.5,
  },
  noise: {
    enabled: false,
    intensity: 0.5,
  },
  edge: {
    enabled: false,
    intensity: 1.0,
    threshold: 0.1,
  },
  color: {
    enabled: false,
    brightness: 1.0,
    saturation: 1.0,
    contrast: 1.0,
  },
  vignette: {
    enabled: false,
    darkness: 1.0,
    offset: 1.0,
  },
};

interface PostProcessingState {
  settings: PostProcessingSettings;
}

const initialState: PostProcessingState = {
  settings: { ...DEFAULT_SETTINGS },
};

export const postProcessingStore = writable<PostProcessingState>(initialState);

export function updatePostProcessingSettings(
  settings: Partial<PostProcessingSettings>
): void {
  postProcessingStore.update((state) => ({
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  }));
}
