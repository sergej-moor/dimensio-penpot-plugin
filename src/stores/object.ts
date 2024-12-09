import { writable } from 'svelte/store';

export interface ObjectSettings {
  depth: number;
  scale: number;
  curveSegments: number;
  steps: number;
}

export const DEFAULT_OBJECT_SETTINGS: ObjectSettings = {
  depth: 10,
  scale: 1,
  curveSegments: 12,
  steps: 1,
};

interface ObjectState {
  settings: ObjectSettings;
}

const initialState: ObjectState = {
  settings: { ...DEFAULT_OBJECT_SETTINGS },
};

export const objectStore = writable<ObjectState>(initialState);

export function updateObjectSettings(settings: Partial<ObjectSettings>): void {
  objectStore.update((state) => ({
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  }));
}
