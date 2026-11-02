import { getCentroDeControlDatos } from '@/app/actions/centro-de-control';

let mockBlogPosts: any[] = [];

jest.mock('@/app/actions/blog', () => ({
  getBlogPosts: jest.fn(async () => mockBlogPosts),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno' } })),
}));

jest.mock('@/lib/ia/reglas-de-la-ia', () => ({
  getReglasDeLaIA: jest.fn(async () => []),
  getRegistroAccionesSolas: jest.fn(async () => []),
  getResumenMensualAprendizaje: jest.fn(async () => ''),
}));

jest.mock('@/lib/asistente/propuestas-service', () => ({
  getPropuestas: jest.fn(async () => []),
}));

jest.mock('@/app/actions/scheduled-messages', () => ({
  getScheduledMessages: jest.fn(async () => []),
}));

jest.mock('@/lib/agentes/motor-agentes', () => ({
  getHistorialEjecuciones: jest.fn(async () => []),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_file: string, def: any) => def),
  writeData: jest.fn(async () => undefined),
}));

describe('Orden 257 — Bloque 3: El Centro de Control no anuncia notas que no se publicaron', () => {
  beforeEach(() => {
    mockBlogPosts = [];
  });

  it('una nota en borrador no aparece en "Lo que hizo sola"', async () => {
    mockBlogPosts = [
      {
        slug: 'nota-en-borrador-ia',
        title: 'Borrador de IA',
        status: 'draft',
        autor: 'ia',
        publishedAt: '2026-10-01',
      },
      {
        slug: 'nota-borrador-espanol',
        title: 'Borrador criollo',
        status: 'borrador',
        autor: 'ia',
        publishedAt: '2026-10-01',
      },
    ];

    const datos = await getCentroDeControlDatos();
    const items = datos.loQueHizoSola.filter((item) => item.tipo === 'blog');

    expect(items).toHaveLength(0);
  });

  it('una nota programada no aparece en "Lo que hizo sola"', async () => {
    mockBlogPosts = [
      {
        slug: 'nota-programada-status',
        title: 'Programada por status',
        status: 'scheduled',
        autor: 'ia',
        publishedAt: '2026-10-01',
      },
      {
        slug: 'nota-programada-futura',
        title: 'Programada a futuro',
        status: 'published',
        autor: 'ia',
        publishedAt: '2099-01-01',
      },
    ];

    const datos = await getCentroDeControlDatos();
    const items = datos.loQueHizoSola.filter((item) => item.tipo === 'blog');

    expect(items).toHaveLength(0);
  });

  it('una nota que escribió una persona no aparece en "Lo que hizo sola"', async () => {
    mockBlogPosts = [
      {
        slug: 'como-empezar-a-organizar-una-fiesta-sin-estres',
        title: 'Cómo empezar a organizar una fiesta sin estrés',
        status: 'published',
        publishedAt: '2026-06-01',
      },
      {
        slug: 'nota-manual-de-persona',
        title: 'Nota escrita por una persona',
        status: 'published',
        autor: 'persona',
        publishedAt: '2026-06-01',
      },
    ];

    const datos = await getCentroDeControlDatos();
    const items = datos.loQueHizoSola.filter((item) => item.tipo === 'blog');

    expect(items).toHaveLength(0);
  });

  it('sólo entran las que publicó la IA de verdad (status === "published" y escritas por IA)', async () => {
    mockBlogPosts = [
      {
        slug: 'nota-publicada-por-ia',
        title: 'Guía de Barra de Tragos con IA',
        status: 'published',
        autor: 'ia',
        publishedAt: '2026-10-15',
      },
    ];

    const datos = await getCentroDeControlDatos();
    const items = datos.loQueHizoSola.filter((item) => item.tipo === 'blog');

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('blog-post-nota-publicada-por-ia');
    expect(items[0].titulo).toContain('Guía de Barra de Tragos con IA');
    expect(items[0].enlace).toBe('/public/blog/nota-publicada-por-ia');
  });
});
