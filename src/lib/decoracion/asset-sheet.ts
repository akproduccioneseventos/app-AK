import 'server-only';
import path from 'node:path';
import sharp from 'sharp';
import manifest from './ak-assets.json';

let sheet: Promise<string> | undefined;
/** Give vision the actual objects, not just names that could describe different furniture. */
export function decorationAssetSheet(): Promise<string> {
  if (!sheet) sheet = makeSheet().catch(error => { sheet = undefined; throw error; });
  return sheet;
}
async function makeSheet(): Promise<string> {
  const overlays: Array<{ input: Buffer; left: number; top: number }> = [];
  for (const [index, asset] of manifest.assets.entries()) {
    const column = index % 9; const row = Math.floor(index / 9);
    const image = await sharp(path.join(process.cwd(), 'public', asset.url), { limitInputPixels: 40_000_000 })
      .resize(96, 92, { fit: 'contain', background: '#eeeeee' }).png().toBuffer();
    overlays.push({ input: image, left: column * 112 + 8, top: row * 120 + 2 });
    const label = asset.id.replace('ak_deco_v2_', ''); // IDs were validated by the importer.
    overlays.push({ input: Buffer.from(`<svg width="112" height="24"><text x="56" y="17" text-anchor="middle" font-size="14" fill="black">${label}</text></svg>`), left: column * 112, top: row * 120 + 94 });
  }
  const bytes = await sharp({ create: { width: 1008, height: Math.ceil(manifest.assets.length / 9) * 120, channels: 3, background: '#eeeeee' } })
    .composite(overlays).jpeg({ quality: 85 }).toBuffer();
  return `data:image/jpeg;base64,${bytes.toString('base64')}`;
}
