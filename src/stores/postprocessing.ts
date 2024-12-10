import { writable } from 'svelte/store';

export interface PostProcessingEffect {
  type: 'pixelation' | 'noise' | 'edge' | 'color';
  order: number;
  settings: {
    enabled: boolean;
    [key: string]: any;
  };
}

export interface PostProcessingSettings {
  effects: PostProcessingEffect[];
}

const DEFAULT_SETTINGS: PostProcessingSettings = {
  effects: [
    {
      type: 'pixelation',
      order: 0,
      settings: {
        enabled: false,
        pixelSize: 8,
      },
    },
    {
      type: 'noise',
      order: 1,
      settings: {
        enabled: false,
        intensity: 1.0,
      },
    },
    {
      type: 'edge',
      order: 2,
      settings: {
        enabled: false,
        intensity: 1.0,
        threshold: 0.1,
      },
    },
    {
      type: 'color',
      order: 3,
      settings: {
        enabled: false,
        brightness: 1.0,
        saturation: 1.0,
        contrast: 1.0,
      },
    },
  ],
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

export function moveEffect(index: number, direction: 'up' | 'down'): void {
  postProcessingStore.update((state) => {
    const effects = [...state.settings.effects];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < effects.length) {
      [effects[index], effects[newIndex]] = [effects[newIndex], effects[index]];
      // Update order numbers
      effects.forEach((effect, i) => (effect.order = i));
    }

    return {
      ...state,
      settings: { ...state.settings, effects },
    };
  });
}
