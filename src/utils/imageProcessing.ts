interface ProcessedImage {
  data: Uint8Array;
  width: number;
  height: number;
}

export async function processImage(
  imageData: Uint8Array,
  width: number,
  height: number,
  pixelSize: number
): Promise<ProcessedImage> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  // Create and draw original image
  const blob = new Blob([imageData], { type: 'image/png' });
  const imageBitmap = await createImageBitmap(blob);
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Get image data for processing
  const originalData = ctx.getImageData(0, 0, width, height);

  // Apply pixelation effect
  pixelateCanvas(ctx, originalData, width, height, pixelSize);

  // Get processed data
  const processedBlob = await canvasToBlob(canvas);
  const processedData = new Uint8Array(await processedBlob.arrayBuffer());

  return { data: processedData, width, height };
}

function pixelateCanvas(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  width: number,
  height: number,
  pixelSize: number
): void {
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      const pixelIndex = (y * width + x) * 4;
      const color = {
        r: imageData.data[pixelIndex],
        g: imageData.data[pixelIndex + 1],
        b: imageData.data[pixelIndex + 2],
        a: imageData.data[pixelIndex + 3],
      };

      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  );
}
