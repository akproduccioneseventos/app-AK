/**
 * Volver a publicar lo que mejor anduvo.
 * Comprueba:
 * - la copia queda programada con el texto y la imagen de la original
 * - la original no vuelve a aparecer como sugerida (hasta 90 días después)
 */

import {
  obtenerSugerenciasReciclado,
  reciclarPublicacion,
} from '@/lib/presencia-digital/publicador';
import type { SocialPost } from '@/types/social-media';

let archivos: Record<string, unknown> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) =>
    archivo in archivos ? archivos[archivo] : porDefecto,
  ),
  writeData: jest.fn(async (archivo: string, datos: unknown) => {
    archivos[archivo] = datos;
  }),
  createDataItem: jest.fn(async (archivo: string, _col: string, _id: string, item: any) => {
    if (!archivos[archivo]) archivos[archivo] = [];
    (archivos[archivo] as any[]).push(item);
  }),
}));

const AHORA = new Date('2026-08-20T15:00:00.000Z');
const haceDias = (dias: number) =>
  new Date(AHORA.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();

describe('volver a publicar lo que mejor anduvo', () => {
  beforeEach(() => {
    archivos = {};
  });

  const postExitoso: SocialPost = {
    id: 'post-original-1',
    platform: 'Instagram',
    isGeneralCampaign: true,
    publishDate: haceDias(70), // más de 60 días
    text: '¡Momentos únicos en Casamiento!',
    mediaUrl: 'https://ejemplo.uy/foto1.jpg',
    mediaType: 'image',
    status: 'Publicado',
    performance: { interactions: 350 },
    createdAt: haceDias(70),
    updatedAt: haceDias(70),
  };

  it('sugiere la publicación exitosa de más de 60 días', () => {
    const sugeridas = obtenerSugerenciasReciclado([postExitoso], AHORA);
    expect(sugeridas).toHaveLength(1);
    expect(sugeridas[0].id).toBe('post-original-1');
  });

  it('al reciclar, la copia queda programada con el texto e imagen de la original y recicladoDe', async () => {
    archivos['social-posts.json'] = [postExitoso];

    const nueva = await reciclarPublicacion(postExitoso.id, AHORA);

    expect(nueva.status).toBe('Programado');
    expect(nueva.text).toBe(postExitoso.text);
    expect(nueva.mediaUrl).toBe(postExitoso.mediaUrl);
    expect(nueva.mediaType).toBe(postExitoso.mediaType);
    expect(nueva.platform).toBe(postExitoso.platform);
    expect(nueva.recicladoDe).toBe(postExitoso.id);

    // Verificamos que se guardó en el archivo
    const guardados = archivos['social-posts.json'] as SocialPost[];
    expect(guardados).toHaveLength(2);
    expect(guardados[1].id).toBe(nueva.id);
  });

  it('la original no vuelve a aparecer como sugerida una vez reciclada', async () => {
    archivos['social-posts.json'] = [postExitoso];
    const nueva = await reciclarPublicacion(postExitoso.id, AHORA);

    const postsActualizados = archivos['social-posts.json'] as SocialPost[];
    const sugeridas = obtenerSugerenciasReciclado(postsActualizados, AHORA);

    // No debe sugerir post-original-1 porque ya fue reciclado hace menos de 90 días
    expect(sugeridas.find((p) => p.id === postExitoso.id)).toBeUndefined();
  });
});
