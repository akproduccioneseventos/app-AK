import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('public marketing resilience', () => {
  it('keeps the official Instagram section visible while the feed is empty', () => {
    const home = read('src/app/page.tsx');
    const instagram = read('src/components/landing/InstagramSyncStrip.tsx');

    expect(home).not.toContain('instagramItems.length > 0 ?');
    expect(home).toContain('<InstagramSyncStrip');
    expect(instagram).toContain('visibleItems.length === 0');
    expect(instagram).toContain('perfil oficial');
  });

  it('uses local AK campaign imagery instead of runtime Unsplash dependencies', () => {
    const campaigns = read('src/app/landing/[slug]/page.tsx');

    expect(campaigns).not.toContain('images.unsplash.com');
    expect(campaigns).toContain('/media/catalogo-servicios/boda_persuasiva.png');
    expect(campaigns).toContain('/media/catalogo-servicios/quinceanera_hero.png');
  });
});
