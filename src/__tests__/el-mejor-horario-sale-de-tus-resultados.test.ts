import { mejorHorario } from '@/lib/presencia-digital/mejor-horario';
import type { SocialPost } from '@/types/social-media';

describe('el mejor horario sale de tus resultados', () => {
  it('con menos de 8 publicaciones devuelve null y no inventa nada', () => {
    const posts: SocialPost[] = [
      {
        id: '1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: '2026-08-06T20:00:00.000Z',
        text: 'Post 1',
        status: 'Publicado',
        performance: { interactions: 100 },
        createdAt: '2026-08-06T20:00:00.000Z',
        updatedAt: '2026-08-06T20:00:00.000Z',
      },
      {
        id: '2',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: '2026-08-07T14:00:00.000Z',
        text: 'Post 2',
        status: 'Publicado',
        performance: { interactions: 80 },
        createdAt: '2026-08-07T14:00:00.000Z',
        updatedAt: '2026-08-07T14:00:00.000Z',
      },
      {
        id: '3',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: '2026-08-08T10:00:00.000Z',
        text: 'Post 3',
        status: 'Publicado',
        performance: { interactions: 50 },
        createdAt: '2026-08-08T10:00:00.000Z',
        updatedAt: '2026-08-08T10:00:00.000Z',
      },
      {
        id: '4',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: '2026-08-09T18:00:00.000Z',
        text: 'Post 4',
        status: 'Publicado',
        performance: { interactions: 60 },
        createdAt: '2026-08-09T18:00:00.000Z',
        updatedAt: '2026-08-09T18:00:00.000Z',
      },
      {
        id: '5',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: '2026-08-10T21:00:00.000Z',
        text: 'Post 5',
        status: 'Publicado',
        performance: { interactions: 70 },
        createdAt: '2026-08-10T21:00:00.000Z',
        updatedAt: '2026-08-10T21:00:00.000Z',
      },
    ];

    const resultado = mejorHorario(posts, 'Instagram');
    expect(resultado).toBeNull();
  });

  it('con publicaciones sembradas donde los jueves a la noche tienen el doble de interacciones, elige jueves a la noche', () => {
    // 2026-08-06 es un JUEVES. 20:30 UYT -> en UTC es 23:30Z (Uruguay es UTC-3)
    // 2026-08-13 es otro JUEVES.
    // 2026-08-20 es otro JUEVES.
    // UYT = UTC - 3. Entonces 20:30 UYT = 23:30Z.
    const armarFechaUyt = (ano: number, mes: number, dia: number, hora: number) => {
      // Uruguay está en UTC-3
      const utcHora = hora + 3;
      return new Date(Date.UTC(ano, mes - 1, dia, utcHora, 0, 0)).toISOString();
    };

    const posts: SocialPost[] = [
      // 3 jueves a las 20hs en Uruguay con 200 interacciones cada uno
      {
        id: 'j1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 6, 20),
        text: 'Jueves noche 1',
        status: 'Publicado',
        performance: { interactions: 200 },
        createdAt: armarFechaUyt(2026, 8, 6, 20),
        updatedAt: armarFechaUyt(2026, 8, 6, 20),
      },
      {
        id: 'j2',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 13, 21),
        text: 'Jueves noche 2',
        status: 'Publicado',
        performance: { interactions: 220 },
        createdAt: armarFechaUyt(2026, 8, 13, 21),
        updatedAt: armarFechaUyt(2026, 8, 13, 21),
      },
      {
        id: 'j3',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 20, 20),
        text: 'Jueves noche 3',
        status: 'Publicado',
        performance: { interactions: 210 },
        createdAt: armarFechaUyt(2026, 8, 20, 20),
        updatedAt: armarFechaUyt(2026, 8, 20, 20),
      },
      // Otros días con la mitad de interacciones
      {
        id: 'l1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 10, 14), // Lunes
        text: 'Lunes tarde',
        status: 'Publicado',
        performance: { interactions: 90 },
        createdAt: armarFechaUyt(2026, 8, 10, 14),
        updatedAt: armarFechaUyt(2026, 8, 10, 14),
      },
      {
        id: 'm1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 11, 10), // Martes
        text: 'Martes mañana',
        status: 'Publicado',
        performance: { interactions: 100 },
        createdAt: armarFechaUyt(2026, 8, 11, 10),
        updatedAt: armarFechaUyt(2026, 8, 11, 10),
      },
      {
        id: 'mi1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 12, 16), // Miércoles
        text: 'Miércoles tarde',
        status: 'Publicado',
        performance: { interactions: 80 },
        createdAt: armarFechaUyt(2026, 8, 12, 16),
        updatedAt: armarFechaUyt(2026, 8, 12, 16),
      },
      {
        id: 'v1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 14, 18), // Viernes
        text: 'Viernes tarde',
        status: 'Publicado',
        performance: { interactions: 110 },
        createdAt: armarFechaUyt(2026, 8, 14, 18),
        updatedAt: armarFechaUyt(2026, 8, 14, 18),
      },
      {
        id: 's1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: armarFechaUyt(2026, 8, 15, 12), // Sábado
        text: 'Sábado mediodía',
        status: 'Publicado',
        performance: { interactions: 105 },
        createdAt: armarFechaUyt(2026, 8, 15, 12),
        updatedAt: armarFechaUyt(2026, 8, 15, 12),
      },
    ];

    const res = mejorHorario(posts, 'Instagram');
    expect(res).not.toBeNull();
    expect(res?.dia.toLowerCase()).toBe('jueves');
    expect(res?.hora).toBe(20);
    expect(res?.basadoEn).toBe(8);
  });
});
