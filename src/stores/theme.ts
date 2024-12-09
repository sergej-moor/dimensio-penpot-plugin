import { writable } from 'svelte/store';

// Get initial theme from URL
const url = new URL(window.location.href);
const initialTheme = url.searchParams.get('theme') || '';

export const theme = writable(initialTheme);

// Helper function to update theme
export function updateTheme(newTheme: string): void {
  theme.set(newTheme);
}
