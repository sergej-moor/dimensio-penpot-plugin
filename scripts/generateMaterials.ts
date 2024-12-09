import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the suffixes we're interested in with their corresponding keys
const SUFFIXES = {
  diffuse: ['diffuse', 'albedo', 'color', 'basecolor', 'base-color'],
  normal: ['normal', 'normal-ogl', 'nrm'],
  roughness: ['roughness', 'rough'],
  metalness: ['metallic', 'metalness', 'metal'],
  ao: ['ao', 'ambient', 'occlusion'],
  height: ['height', 'displacement', 'disp'],
  preview: ['preview'],
};

function generateMaterialsFile(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const materialsDirectory = path.join(__dirname, '..', 'public', 'materials');
  const outputFilePath = path.join(
    __dirname,
    '..',
    'src',
    'config',
    'materials.ts'
  );

  if (!fs.existsSync(materialsDirectory)) {
    console.error(
      `Materials directory does not exist at path: ${materialsDirectory}`
    );
    process.exit(1);
  }

  const materialFolders = fs.readdirSync(materialsDirectory).filter((file) => {
    return fs.statSync(path.join(materialsDirectory, file)).isDirectory();
  });

  console.log('Found material folders:', materialFolders);

  const materials = materialFolders.map((folder) => {
    const folderPath = path.join(materialsDirectory, folder);
    const files = fs.readdirSync(folderPath);

    console.log(`\nProcessing folder: ${folder}`);
    console.log('Found files:', files);

    const maps: Record<string, string | undefined> = {};

    // Find matching files for each map type
    Object.entries(SUFFIXES).forEach(([mapType, keywords]) => {
      for (const file of files) {
        const lowerFile = file.toLowerCase();
        // Check if file is an image
        if (!['.jpg', '.jpeg', '.png'].some((ext) => lowerFile.endsWith(ext))) {
          continue;
        }
        // Check if file name contains any of the keywords
        if (
          keywords.some(
            (keyword) =>
              lowerFile.includes(keyword.toLowerCase()) ||
              lowerFile.includes(`_${keyword.toLowerCase()}`) ||
              lowerFile.includes(`-${keyword.toLowerCase()}`)
          )
        ) {
          maps[mapType] = `/materials/${folder}/${file}`;
          console.log(`Found ${mapType} map:`, file);
          break;
        }
      }
    });

    console.log('Generated maps:', maps);

    return {
      name: folder,
      folder,
      maps,
    };
  });

  const fileContent = `import type { Material } from '../stores/materials';

export const MATERIALS: Material[] = ${JSON.stringify(materials, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")};
`;

  fs.writeFileSync(outputFilePath, fileContent);
  console.log(`\nMaterials file generated successfully at ${outputFilePath}`);
}

generateMaterialsFile();
