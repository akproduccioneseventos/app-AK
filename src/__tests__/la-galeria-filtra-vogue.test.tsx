import fs from 'fs';
import path from 'path';
import { filtrarPorEstacion } from '@/lib/entertainment/station-config';
import type { SocialGalleryPost } from '@/types/social-gallery';

const RAIZ = process.cwd();

describe('La galería filtra Vogue y el álbum incluye Touchpix AI (Orden 180)', () => {
  const postsMock: SocialGalleryPost[] = [
    { id: '1', fiestaId: 'f1', mediaUrl: 'http://foto1.jpg', mediaType: 'image', sourceModule: 'fotocabina', createdAt: '2026-10-16T12:00:00Z' },
    { id: '2', fiestaId: 'f1', mediaUrl: 'http://video1.mp4', mediaType: 'video', sourceModule: 'bogue', createdAt: '2026-10-16T12:05:00Z' },
    { id: '3', fiestaId: 'f1', mediaUrl: 'http://video2.mp4', mediaType: 'video', sourceModule: 'plataforma360', createdAt: '2026-10-16T12:10:00Z' },
    { id: '4', fiestaId: 'f1', mediaUrl: 'http://foto2.jpg', mediaType: 'image', sourceModule: 'espejoMagicoFoto', createdAt: '2026-10-16T12:15:00Z' },
    { id: '5', fiestaId: 'f1', mediaUrl: 'http://foto3.jpg', mediaType: 'image', sourceModule: 'touchpix', createdAt: '2026-10-16T12:20:00Z' },
  ];

  it('filtrarPorEstacion con "vogue" o "bogue" devuelve sólo las fotos/videos de cabina Vogue', () => {
    const soloVogue = filtrarPorEstacion(postsMock, 'vogue');
    expect(soloVogue).toHaveLength(1);
    expect(soloVogue[0].sourceModule).toBe('bogue');

    const soloBogue = filtrarPorEstacion(postsMock, 'bogue');
    expect(soloBogue).toHaveLength(1);
    expect(soloBogue[0].id).toBe('2');
  });

  it('filtrarPorEstacion con "todas" devuelve todas las fotos', () => {
    const todas = filtrarPorEstacion(postsMock, 'todas');
    expect(todas).toHaveLength(postsMock.length);
  });

  it('si no hay fotos de Vogue, filtrarPorEstacion devuelve array vacío sin romper', () => {
    const sinVogue = postsMock.filter((p) => p.sourceModule !== 'bogue');
    const res = filtrarPorEstacion(sinVogue, 'vogue');
    expect(res).toEqual([]);
  });

  it('la galería (page.tsx) incluye la pestaña de Cabina Vogue y usa filtrarPorEstacion', () => {
    const galeriaPath = path.join(RAIZ, 'src/app/evento/galeria/[fiestaId]/page.tsx');
    const contenido = fs.readFileSync(galeriaPath, 'utf8');

    expect(contenido).toContain('filtrarPorEstacion');
    expect(contenido).toContain('Cabina Vogue');
    expect(contenido).toMatch(/['"]vogue['"]|['"]bogue['"]/);
  });

  it('el álbum (page.tsx) incluye la pestaña Touchpix AI al lado de 360', () => {
    const albumPath = path.join(RAIZ, 'src/app/evento/album/[fiestaId]/page.tsx');
    const contenido = fs.readFileSync(albumPath, 'utf8');

    expect(contenido).toContain('touchpix');
    expect(contenido).toContain('Touchpix AI');
    expect(contenido).toContain('360');
  });
});
