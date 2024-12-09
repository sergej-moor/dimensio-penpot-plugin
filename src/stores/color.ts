import { writable } from 'svelte/store';
import type { Color } from 'three';

export interface ColorGroup {
  id: string;
  color: Color;
  defaultColor: Color;
  meshIndices: number[];
}

interface ColorState {
  groups: ColorGroup[];
}

const initialState: ColorState = {
  groups: [],
};

export const colorStore = writable<ColorState>(initialState);

export function setColorGroups(groups: ColorGroup[]): void {
  colorStore.update((state) => ({
    ...state,
    groups,
  }));
}

export function updateGroupColor(groupId: string, color: Color): void {
  colorStore.update((state) => ({
    ...state,
    groups: state.groups.map((group) =>
      group.id === groupId ? { ...group, color } : group
    ),
  }));
}

export function resetGroupColor(groupId: string): void {
  colorStore.update((state) => ({
    ...state,
    groups: state.groups.map((group) =>
      group.id === groupId
        ? { ...group, color: group.defaultColor.clone() }
        : group
    ),
  }));
}
