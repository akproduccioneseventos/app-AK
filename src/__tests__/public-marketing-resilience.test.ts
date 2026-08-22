import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('public marketing resilience', () => {
  it('uses Instagram as a gallery source without rendering a redundant section', () => {
    const home = read('src/app/page.tsx');
    const gallery = read('src/components/landing/GallerySection.tsx');

    expect(home).toContain('const instagramFotos: GaleriaFoto[] = instagramFeed');
    expect(home).toContain('const instagramVideos: GaleriaVideo[] = instagramFeed');
    expect(home).toContain('<GallerySection galeriaFotos={fotosCombinadas} />');
    expect(home).not.toContain('InstagramSyncStrip');
    expect(gallery).toContain('Galería de eventos');
  });

  it('uses local AK campaign imagery instead of runtime Unsplash dependencies', () => {
    // Las paginas de promocion viven en promo-pages.ts (una sola lista, para que
    // la auditoria de titulos lea la de verdad y no una copia). La pantalla las
    // importa de ahi, asi que las fotos se buscan en los dos archivos.
    const campaigns = read('src/app/landing/[slug]/page.tsx');
    const promos = read('src/lib/marketing/promo-pages.ts');
    const juntos = `${campaigns}\n${promos}`;

    expect(campaigns).not.toContain('images.unsplash.com');
    expect(promos).not.toContain('images.unsplash.com');
    expect(juntos).toContain('/media/catalogo-servicios/boda_persuasiva.png');
    expect(juntos).toContain('/media/catalogo-servicios/quinceanera_hero.png');
  });
});
