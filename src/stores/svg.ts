import { writable } from 'svelte/store';

interface SVGState {
  content: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SVGState = {
  content: null,
  isLoading: false,
  error: null,
};

export const svgStore = writable<SVGState>(initialState);

export function setSVGContent(content: string): void {
  svgStore.update((state) => ({
    ...state,
    content,
    error: null,
  }));
}

export function setLoading(isLoading: boolean): void {
  svgStore.update((state) => ({
    ...state,
    isLoading,
  }));
}

export function setError(error: string): void {
  svgStore.update((state) => ({
    ...state,
    error,
    content: null,
  }));
}
