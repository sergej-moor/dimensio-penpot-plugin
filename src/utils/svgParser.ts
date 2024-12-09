import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

interface SVGParseResult {
  shapes: Array<{
    shape: THREE.Shape;
    color: THREE.Color;
  }>;
  bounds: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

function parseColor(color: string | null): THREE.Color {
  if (!color || color === 'none') {
    return new THREE.Color(0x000000);
  }
  return new THREE.Color(color);
}

export function parseSVGPaths(svgString: string): SVGParseResult {
  console.log('Parsing SVG string:', svgString);

  // Create a temporary container for the SVG
  const container = document.createElement('div');
  container.innerHTML = svgString;
  const svgElement = container.querySelector('svg');
  if (!svgElement) {
    throw new Error('No SVG element found');
  }

  // Get SVG dimensions
  const viewBox =
    svgElement?.getAttribute('viewBox')?.split(' ').map(Number) || [];
  const width =
    viewBox[2] || parseFloat(svgElement?.getAttribute('width') || '100');
  const height =
    viewBox[3] || parseFloat(svgElement?.getAttribute('height') || '100');

  // Use Three.js SVGLoader
  const loader = new SVGLoader();
  const svgData = loader.parse(svgString);
  const shapes: Array<{ shape: THREE.Shape; color: THREE.Color }> = [];

  // Process each path
  svgData.paths.forEach((path) => {
    // Get the fill color
    const fillColor = parseColor(path.color);

    // Convert subpaths to shapes
    path.subPaths.forEach((subPath) => {
      const shape = new THREE.Shape();

      // Get the points from the path
      const points = subPath.getPoints();

      if (points.length > 0) {
        // Start the shape at the first point
        shape.moveTo(points[0].x, points[0].y);

        // Add the remaining points
        for (let i = 1; i < points.length; i++) {
          shape.lineTo(points[i].x, points[i].y);
        }

        // Only close the path if it's meant to be closed
        // Check if the path has a fill or if it's explicitly marked as closed
        const shouldClose =
          path.userData?.style?.fill !== 'none' &&
          path.userData?.style?.fill !== undefined;
        if (shouldClose) {
          shape.closePath();
        }

        shapes.push({ shape, color: fillColor });
      }
    });
  });

  // Calculate bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach(({ shape }) => {
    shape.curves.forEach((curve) => {
      const points = curve.getPoints(10);
      points.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });
  });

  // If no valid bounds were found, use the SVG dimensions
  if (!isFinite(minX)) minX = 0;
  if (!isFinite(minY)) minY = 0;
  if (!isFinite(maxX)) maxX = width;
  if (!isFinite(maxY)) maxY = height;

  return {
    shapes,
    bounds: {
      width: width || maxX - minX,
      height: height || maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    },
  };
}
