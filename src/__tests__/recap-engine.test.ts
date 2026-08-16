import { buildMorningRecap, isRecapAvailable } from '@/lib/recap/recap-engine';
import type { SocialGalleryPost } from '@/types/social-gallery';

describe('Bloque B — Morning Recap ordenado por likes', () => {
  it('ordena las fotos aprobadas por likes/corazones descendente y excluye videos', () => {
    const posts: Partial<SocialGalleryPost>[] = [
      { id: '1', mediaType: 'image', likes: 2, moderationStatus: 'approved' },
      { id: '2', mediaType: 'video', likes: 50, moderationStatus: 'approved' }, // Video excluido
      { id: '3', mediaType: 'image', likes: 15, moderationStatus: 'approved' },
      { id: '4', mediaType: 'image', likes: 8, moderationStatus: 'approved' },
      { id: '5', mediaType: 'image', likes: 30, moderationStatus: 'approved' },
      { id: '6', mediaType: 'image', likes: 100, moderationStatus: 'rejected' }, // Rechazada excluida
    ];

    const recap = buildMorningRecap(
      { configuracion: { nombreEvento: 'XV de Sofía', fechaEvento: '2026-10-10' } },
      posts as SocialGalleryPost[]
    );

    expect(recap.photos).toHaveLength(4);
    expect(recap.photos[0].id).toBe('5'); // 30 likes
    expect(recap.photos[1].id).toBe('3'); // 15 likes
    expect(recap.photos[2].id).toBe('4'); // 8 likes
    expect(recap.photos[3].id).toBe('1'); // 2 likes
  });

  it('devuelve false en isRecapAvailable si recapEnabled no esta activo o no es el dia siguiente', () => {
    const available = isRecapAvailable(
      { zonaDigitalAdolescentes: { enabled: true, recapEnabled: false }, configuracion: { fechaEvento: '2026-08-10' } },
      new Date('2026-08-12')
    );
    expect(available).toBe(false);
  });
});
