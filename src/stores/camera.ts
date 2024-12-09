import { writable } from 'svelte/store';
import type { Vector3 } from 'three';

export interface CameraState {
  position: Vector3;
  target: Vector3;
  defaultPosition: Vector3 | null;
  defaultTarget: Vector3 | null;
}

const initialState: CameraState = {
  position: { x: 0, y: 0, z: 5 } as Vector3,
  target: { x: 0, y: 0, z: 0 } as Vector3,
  defaultPosition: null,
  defaultTarget: null,
};

export const cameraStore = writable<CameraState>(initialState);

export function updateCameraPosition(position: Vector3): void {
  cameraStore.update((state) => ({
    ...state,
    position: { ...position },
  }));
}

export function updateCameraTarget(target: Vector3): void {
  cameraStore.update((state) => ({
    ...state,
    target: { ...target },
  }));
}

export function setDefaultCameraPosition(
  position: Vector3,
  target: Vector3
): void {
  cameraStore.update((state) => ({
    ...state,
    defaultPosition: { ...position },
    defaultTarget: { ...target },
  }));
}

export function resetCamera(): void {
  cameraStore.update((state) => ({
    ...state,
    position: state.defaultPosition || state.position,
    target: { x: 0, y: 0, z: 0 },
  }));
}
