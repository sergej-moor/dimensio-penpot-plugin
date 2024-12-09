import { writable } from 'svelte/store';

export interface PostProcessingSettings {
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
}

const DEFAULT_SETTINGS: PostProcessingSettings = {
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
