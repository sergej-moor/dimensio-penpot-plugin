import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

interface ColorGroup {
  initialColor: string;
  userColor: string;
  color: string;
  paths: {
    id: number;
    data: THREE.ShapePath;
  }[];
}

export function parseSVGPaths(svgContent: string) {
  const loader = new SVGLoader();
  const svgData = loader.parse(svgContent);
  const paths = svgData.paths;

  // Group paths by color
  const colorGroups: Record<string, ColorGroup> = {};

  paths.forEach((path, index) => {
    // Check if the path is inside a <defs> element
    if (isNodeInDefs(path.userData?.node)) return;

    let fillColor = path.userData?.style.fill || '#FFFFFF';
    if (!fillColor || fillColor === 'none') {
      fillColor = '#FFFFFF';
    }

    if (fillColor.startsWith('rgb')) {
      try {
        fillColor = rgbStringToHex(fillColor);
      } catch (e) {
        console.error('Error converting color:', e);
        fillColor = '#FFFFFF';
      }
    }

    fillColor = fillColor.toLowerCase();
    const groupKey = `${fillColor}`;

    if (!colorGroups[groupKey]) {
      colorGroups[groupKey] = {
        initialColor: fillColor,
        userColor: fillColor,
        color: fillColor,
        paths: [],
      };
    }

    colorGroups[groupKey].paths.push({
      id: index,
      data: path,
    });
  });

  // Create merged geometries for each color group
  const shapes: { shape: THREE.Shape; color: THREE.Color }[] = [];
  const bounds = new THREE.Box2();

  Object.entries(colorGroups).forEach(([_, group]) => {
    const { paths, color } = group;

    paths.forEach(({ data: path }) => {
      const shapesFromPath = path.toShapes(true);
      shapesFromPath.forEach((shape) => {
        shapes.push({
          shape,
          color: new THREE.Color(color),
        });

        // Update bounds
        const points = shape.getPoints();
        points.forEach((point) => bounds.expandByPoint(point));
      });
    });
  });

  return {
    shapes,
    bounds: {
      width: bounds.max.x - bounds.min.x,
      height: bounds.max.y - bounds.min.y,
      centerX: (bounds.max.x + bounds.min.x) / 2,
      centerY: (bounds.max.y + bounds.min.y) / 2,
    },
    colorGroups,
  };
}

function isNodeInDefs(node: any): boolean {
  while (node) {
    if (node.nodeName.toLowerCase() === 'defs') {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function rgbStringToHex(rgb: string): string {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) throw new Error('Invalid RGB string');

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
