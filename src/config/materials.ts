import type { Material } from '../stores/materials';

export const MATERIALS: Material[] = [
  {
    name: 'Cog Patterned',
    folder: 'Cog Patterned',
    maps: {
      diffuse: '/materials/Cog Patterned/cog-patterned-metal_albedo.png',
      normal: '/materials/Cog Patterned/cog-patterned-metal_normal-ogl.png',
      roughness: '/materials/Cog Patterned/cog-patterned-metal_roughness.png',
      metalness: '/materials/Cog Patterned/cog-patterned-metal_albedo.png',
      ao: '/materials/Cog Patterned/cog-patterned-metal_ao.png',
      height: '/materials/Cog Patterned/cog-patterned-metal_height.png',
      preview: '/materials/Cog Patterned/cog-patterned-metal_preview.jpg'
    }
  },
  {
    name: 'Reinforced Metal',
    folder: 'Reinforced Metal',
    maps: {
      diffuse: '/materials/Reinforced Metal/reinforced-metal_albedo.png',
      normal: '/materials/Reinforced Metal/reinforced-metal_normal-ogl.png',
      roughness: '/materials/Reinforced Metal/reinforced-metal_roughness.png',
      metalness: '/materials/Reinforced Metal/reinforced-metal_albedo.png',
      ao: '/materials/Reinforced Metal/reinforced-metal_ao.png',
      height: '/materials/Reinforced Metal/reinforced-metal_height.png',
      preview: '/materials/Reinforced Metal/reinforced-metal_preview.jpg'
    }
  },
  {
    name: 'Textured Aluminium',
    folder: 'Textured Aluminium',
    maps: {
      diffuse: '/materials/Textured Aluminium/textured-aluminum_albedo.png',
      normal: '/materials/Textured Aluminium/textured-aluminum_normal-ogl.png',
      roughness: '/materials/Textured Aluminium/textured-aluminum_roughness.png',
      metalness: '/materials/Textured Aluminium/textured-aluminum_metallic.png',
      ao: '/materials/Textured Aluminium/textured-aluminum_ao.png',
      height: '/materials/Textured Aluminium/textured-aluminum_height.png',
      preview: '/materials/Textured Aluminium/textured-aluminum_preview.jpg'
    }
  }
];
