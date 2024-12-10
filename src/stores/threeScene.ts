import { writable } from 'svelte/store';
import type * as THREE from 'three';
import type { CaptureOptions } from '../types';

interface ThreeSceneComponent {
  captureScene: (options?: CaptureOptions) => Promise<Uint8Array>;
  handleMaterialChange: (
    textures: Record<string, THREE.Texture>,
    settings?: MaterialSettings
  ) => void;
  updateMeshMaterial?: (settings: Partial<MaterialSettings>) => void;
}

interface ThreeSceneState {
  onMaterialChange?: (textures: Record<string, THREE.Texture>) => void;
  component: ThreeSceneComponent | undefined;
}

export const threeSceneStore = writable<ThreeSceneState>({
  component: undefined,
  onMaterialChange: undefined,
});

export function setMaterialChangeHandler(
  handler: (textures: Record<string, THREE.Texture>) => void
): void {
  threeSceneStore.update((state) => ({
    ...state,
    onMaterialChange: handler,
  }));
}

export function setThreeSceneComponent(
  component: ThreeSceneComponent | undefined
): void {
  threeSceneStore.update((state) => ({
    ...state,
    component,
  }));
}
