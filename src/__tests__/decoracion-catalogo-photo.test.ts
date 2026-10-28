/** @jest-environment node */
import sharp from 'sharp';
import { loadDecorationPhoto } from '@/lib/decoracion/catalog-photo';
import { decorationAssetSheet } from '@/lib/decoracion/asset-sheet';
jest.mock('server-only', () => ({}));

test('real transparent asset decodes into a bounded visual reference; asset sheet contains all 86 slots', async () => {
  const photo = await loadDecorationPhoto('/media/decoracion-ak/ak-001.png');
  expect((await sharp(photo).metadata()).format).toBe('jpeg');
  const sheet = await decorationAssetSheet();
  const meta = await sharp(Buffer.from(sheet.split(',')[1], 'base64')).metadata();
  expect(meta.width).toBe(1008); expect(meta.height).toBe(1200);
});

test.each(['http://127.0.0.1/secret', 'https://storage.googleapis.com.evil.test/photo.jpg', '/media/%2e%2e/secret', 'https://akproducciones.uy/%2e%2e/.env'])('rejects untrusted or escaping image reference %s without fetching', async url => {
  const original = global.fetch; const spy = jest.fn(); global.fetch = spy;
  try { await expect(loadDecorationPhoto(url)).rejects.toThrow(); expect(spy).not.toHaveBeenCalled(); }
  finally { global.fetch = original; }
});
