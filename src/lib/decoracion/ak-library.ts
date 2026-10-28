import manifest from './ak-assets.json';
import type { LibraryElement } from '@/components/decoracion/DecoElementLibrary';

// Pixel dimensions preserve aspect ratio; they are not physical measurements or stock.
export const AK_DECORATION_ELEMENTS: LibraryElement[] = manifest.assets.map(asset => ({
  id: asset.id, tipo: asset.id, label: asset.name, categoria: asset.category,
  emoji: '', maxColores: 1, isCustom: true, imageDataUri: asset.url,
  width: Math.round(160 * asset.pixelWidth / Math.max(asset.pixelWidth, asset.pixelHeight)),
  height: Math.round(160 * asset.pixelHeight / Math.max(asset.pixelWidth, asset.pixelHeight)),
}));
