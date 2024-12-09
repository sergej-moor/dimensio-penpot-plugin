import { writable } from 'svelte/store';
import { MATERIALS } from '../config/materials';

export interface Material {
  name: string;
  folder: string;
  maps: {
    diffuse?: string;
    normal?: string;
    roughness?: string;
    metalness?: string;
    ao?: string;
    height?: string;
    preview?: string;
  };
}

export interface MaterialSettings {
  textureRepeat: number;
  metalness: number;
  roughness: number;
}

export const DEFAULT_MATERIAL_SETTINGS: MaterialSettings = {
  textureRepeat: 0.005,
  metalness: 1,
  roughness: 0,
};

interface MaterialState {
  currentMaterial: Material | null;
  materials: Material[];
  isLoading: boolean;
  error: string | null;
  settings: MaterialSettings;
}

const initialState: MaterialState = {
  currentMaterial: null,
  materials: [],
  isLoading: false,
  error: null,
  settings: { ...DEFAULT_MATERIAL_SETTINGS },
};

export const materialStore = writable<MaterialState>(initialState);

export async function loadMaterials(): Promise<void> {
  try {
    materialStore.update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    // Use the generated materials from config
    materialStore.update((state) => ({
      ...state,
      materials: MATERIALS,
      isLoading: false,
    }));
  } catch (error) {
    materialStore.update((state) => ({
      ...state,
      isLoading: false,
      error: 'Failed to load materials',
    }));
  }
}

export function setCurrentMaterial(material: Material | null): void {
  materialStore.update((state) => ({
    ...state,
    currentMaterial: material,
  }));
}

export function updateMaterialSettings(
  settings: Partial<MaterialSettings>
): void {
  materialStore.update((state) => ({
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  }));
}
