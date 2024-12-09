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

interface MaterialState {
  currentMaterial: Material | null;
  materials: Material[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MaterialState = {
  currentMaterial: null,
  materials: [],
  isLoading: false,
  error: null,
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
