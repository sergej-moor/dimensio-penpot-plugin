import * as THREE from 'three';

interface SVGParseResult {
  shapes: THREE.Shape[];
  bounds: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

export function parseSVGPaths(svgString: string): SVGParseResult {
  console.log('Parsing SVG string:', svgString);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const paths = Array.from(doc.querySelectorAll('path'));
  console.log('Found paths:', paths);
  const shapes: THREE.Shape[] = [];

  // Get SVG viewBox or dimensions
  const svgElement = doc.querySelector('svg');
  const viewBox =
    svgElement?.getAttribute('viewBox')?.split(' ').map(Number) || [];
  const width =
    viewBox[2] || parseFloat(svgElement?.getAttribute('width') || '100');
  const height =
    viewBox[3] || parseFloat(svgElement?.getAttribute('height') || '100');

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  paths.forEach((path) => {
    const d = path.getAttribute('d');
    console.log('Processing path:', d);
    if (!d) return;

    try {
      // Convert SVG path to Three.js Shape
      const shape = new THREE.Shape();
      let firstPoint = true;
      let currentX = 0;
      let currentY = 0;

      // Simple path parser (handles basic M, L, Z commands)
      const commands = d.match(/[a-df-z][^a-df-z]*/gi) || [];
      commands.forEach((cmd) => {
        const type = cmd[0].toUpperCase();
        const args = cmd
          .slice(1)
          .trim()
          .split(/[\s,]+/)
          .map(Number);

        switch (type) {
          case 'M': // Move to
            currentX = args[0];
            currentY = args[1];
            if (firstPoint) {
              shape.moveTo(currentX, currentY);
              firstPoint = false;
            } else {
              shape.lineTo(currentX, currentY);
            }
            break;
          case 'L': // Line to
            currentX = args[0];
            currentY = args[1];
            shape.lineTo(currentX, currentY);
            break;
          case 'Z': // Close path
            shape.closePath();
            break;
        }

        // Update bounds
        minX = Math.min(minX, currentX);
        minY = Math.min(minY, currentY);
        maxX = Math.max(maxX, currentX);
        maxY = Math.max(maxY, currentY);
      });

      shapes.push(shape);
    } catch (error) {
      console.error('Error parsing path:', error);
    }
  });

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
