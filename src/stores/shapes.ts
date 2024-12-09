import { writable } from 'svelte/store';
import type { Color } from 'three';

export interface ShapeGroup {
  id: string;
  color: Color;
  defaultColor: Color;
  meshIndices: number[];
  depth: number;
}

interface ShapeState {
  groups: ShapeGroup[];
}

const initialState: ShapeState = {
  groups: [],
};

export const shapeStore = writable<ShapeState>(initialState);

export function setShapeGroups(groups: ShapeGroup[]): void {
  shapeStore.update((state) => ({
    ...state,
    groups: groups.map((group) => ({
      ...group,
      depth: group.depth ?? 1, // Set default depth if not provided
    })),
  }));
}

export function updateGroupColor(groupId: string, color: Color): void {
  shapeStore.update((state) => ({
    ...state,
    groups: state.groups.map((group) =>
      group.id === groupId ? { ...group, color } : group
    ),
  }));
}

export function updateGroupDepth(groupId: string, depth: number): void {
  shapeStore.update((state) => ({
    ...state,
    groups: state.groups.map((group) =>
      group.id === groupId ? { ...group, depth } : group
    ),
  }));
}

export function resetGroupColor(groupId: string): void {
  shapeStore.update((state) => ({
    ...state,
    groups: state.groups.map((group) =>
      group.id === groupId
        ? { ...group, color: group.defaultColor.clone() }
        : group
    ),
  }));
}
