import * as THREE from 'three';

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
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const paths = Array.from(doc.querySelectorAll('path'));
  console.log('Found paths:', paths);
  const shapes: Array<{ shape: THREE.Shape; color: THREE.Color }> = [];

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
      const shape = new THREE.Shape();
      let fillColor = path.getAttribute('fill');
      if (!fillColor || fillColor === 'none') {
        const style = path.getAttribute('style');
        if (style) {
          const fillMatch = style.match(/fill:\s*([^;]+)/);
          if (fillMatch) {
            fillColor = fillMatch[1];
          }
        }
      }
      let currentElement: Element | null = path;
      while (!fillColor && (currentElement = currentElement.parentElement)) {
        fillColor = currentElement.getAttribute('fill');
      }

      const color = parseColor(fillColor);

      let firstPoint = true;
      let currentX = 0;
      let currentY = 0;
      let startX = 0;
      let startY = 0;
      let controlX = 0;
      let controlY = 0;

      const commands = d.match(/[a-df-z][^a-df-z]*/gi) || [];
      commands.forEach((cmd) => {
        const type = cmd[0];
        const isRelative = type === type.toLowerCase();
        const args = cmd
          .slice(1)
          .trim()
          .split(/[\s,]+/)
          .map(Number);

        const getX = (index: number): number => {
          const x = args[index];
          return isRelative ? currentX + x : x;
        };

        const getY = (index: number): number => {
          const y = args[index + 1];
          return isRelative ? currentY + y : y;
        };

        switch (type.toUpperCase()) {
          case 'M': // Move to
            currentX = getX(0);
            currentY = getY(0);
            startX = currentX;
            startY = currentY;
            if (firstPoint) {
              shape.moveTo(currentX, currentY);
              firstPoint = false;
            } else {
              shape.lineTo(currentX, currentY);
            }
            // Handle subsequent pairs as line commands
            for (let i = 2; i < args.length; i += 2) {
              currentX = getX(i);
              currentY = getY(i);
              shape.lineTo(currentX, currentY);
            }
            break;

          case 'L': // Line to
            for (let i = 0; i < args.length; i += 2) {
              currentX = getX(i);
              currentY = getY(i);
              shape.lineTo(currentX, currentY);
            }
            break;

          case 'H': // Horizontal line
            for (let i = 0; i < args.length; i++) {
              currentX = isRelative ? currentX + args[i] : args[i];
              shape.lineTo(currentX, currentY);
            }
            break;

          case 'V': // Vertical line
            for (let i = 0; i < args.length; i++) {
              currentY = isRelative ? currentY + args[i] : args[i];
              shape.lineTo(currentX, currentY);
            }
            break;

          case 'C': // Cubic Bezier
            for (let i = 0; i < args.length; i += 6) {
              const c1x = getX(i);
              const c1y = getY(i);
              const c2x = getX(i + 2);
              const c2y = getY(i + 2);
              const ex = getX(i + 4);
              const ey = getY(i + 4);
              shape.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
              currentX = ex;
              currentY = ey;
              controlX = c2x;
              controlY = c2y;
            }
            break;

          case 'S': // Smooth cubic Bezier
            for (let i = 0; i < args.length; i += 4) {
              const c1x = currentX + (currentX - controlX);
              const c1y = currentY + (currentY - controlY);
              const c2x = getX(i);
              const c2y = getY(i);
              const ex = getX(i + 2);
              const ey = getY(i + 2);
              shape.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
              currentX = ex;
              currentY = ey;
              controlX = c2x;
              controlY = c2y;
            }
            break;

          case 'Q': // Quadratic Bezier
            for (let i = 0; i < args.length; i += 4) {
              const cx = getX(i);
              const cy = getY(i);
              const ex = getX(i + 2);
              const ey = getY(i + 2);
              shape.quadraticCurveTo(cx, cy, ex, ey);
              currentX = ex;
              currentY = ey;
              controlX = cx;
              controlY = cy;
            }
            break;

          case 'T': // Smooth quadratic Bezier
            for (let i = 0; i < args.length; i += 2) {
              const cx = currentX + (currentX - controlX);
              const cy = currentY + (currentY - controlY);
              const ex = getX(i);
              const ey = getY(i);
              shape.quadraticCurveTo(cx, cy, ex, ey);
              currentX = ex;
              currentY = ey;
              controlX = cx;
              controlY = cy;
            }
            break;

          case 'A': // Arc (approximated by line)
            for (let i = 0; i < args.length; i += 7) {
              currentX = getX(i + 5);
              currentY = getY(i + 5);
              shape.lineTo(currentX, currentY);
            }
            break;

          case 'Z': // Close path
            if (currentX !== startX || currentY !== startY) {
              shape.lineTo(startX, startY);
            }
            shape.closePath();
            break;
        }

        // Update bounds
        minX = Math.min(minX, currentX);
        minY = Math.min(minY, currentY);
        maxX = Math.max(maxX, currentX);
        maxY = Math.max(maxY, currentY);
      });

      shapes.push({ shape, color });
    } catch (error) {
      console.error('Error parsing path:', error);
    }
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
