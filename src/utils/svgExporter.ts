export async function exportSVGToPNG(svgContent: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.visibility = 'hidden';
      container.style.pointerEvents = 'none';
      container.innerHTML = svgContent;
      document.body.appendChild(container);

      // Get the SVG element
      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        document.body.removeChild(container);
        throw new Error('No SVG element found');
      }

      // Set width and height if not present
      if (!svgElement.hasAttribute('width')) {
        svgElement.setAttribute('width', '800');
      }
      if (!svgElement.hasAttribute('height')) {
        svgElement.setAttribute('height', '800');
      }

      // Convert SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      // Create Image
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw with transparent background
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Convert to PNG
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create PNG blob'));
              return;
            }

            // Convert blob to Uint8Array
            const reader = new FileReader();
            reader.onloadend = () => {
              if (!reader.result) {
                reject(new Error('Failed to read PNG data'));
                return;
              }
              const arrayBuffer = reader.result as ArrayBuffer;
              resolve(new Uint8Array(arrayBuffer));
            };
            reader.readAsArrayBuffer(blob);
          }, 'image/png');
        } finally {
          // Cleanup
          URL.revokeObjectURL(url);
          document.body.removeChild(container);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        document.body.removeChild(container);
        reject(new Error('Failed to load SVG image'));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}
