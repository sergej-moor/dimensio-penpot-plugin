// Simple utility functions for URL management
export function createImageUrl(imageData: number[]): string {
  const blob = new Blob([new Uint8Array(imageData)], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

export function revokeImageUrl(url: string | undefined): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
