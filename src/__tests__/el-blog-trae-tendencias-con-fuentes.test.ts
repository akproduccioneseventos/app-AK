jest.mock('server-only', () => ({}), { virtual: true });

let mockFechaUruguay = '2026-11-15'; // 15 = día impar
let mockPostsData: any[] = [];
const mockWriteData = jest.fn(async () => undefined);
const mockMarcarFallo = jest.fn(async () => undefined);
let mockGenerate: any = null;

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    hoyEnUruguay: jest.fn(() => mockFechaUruguay),
  };
});

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'blog-posts.json') return mockPostsData;
    return fallback;
  }),
  writeData: jest.fn(async (...args: any[]) => mockWriteData(...args)),
}));

jest.mock('@/lib/automatico/tareas-automaticas', () => {
  const actual = jest.requireActual('@/lib/automatico/tareas-automaticas');
  return {
    ...actual,
    marcarFallo: jest.fn(async (...args: any[]) => mockMarcarFallo(...args)),
  };
});

jest.mock('@/ai/genkit', () => {
  const actual = jest.requireActual('@/ai/genkit');
  return {
    ...actual,
    getEffectiveGeminiModelForAgent: jest.fn(async () => 'googleai/test-model'),
    generateWithGeminiFallback: jest.fn(async (...args: any[]) => {
      if (mockGenerate) return mockGenerate(...args);
      return actual.generateWithGeminiFallback(...args);
    }),
  };
});

import {
  generarNotaDeTendencias,
  generateBlogPostAndSocialDraft,
} from '@/lib/blog-ai-generator';
import { corregirPromesasDelBlog, textoQuePromete } from '@/lib/blog/sin-promesas';
import type { BlogPost } from '@/types/blog';

describe('Orden 309: El blog trae noticias y tendencias del mundo con fuentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostsData = [];
    mockFechaUruguay = '2026-11-15';
  });

  const sampleOutputTendencia = {
    slug: 'tendencias-bodas-pantallas-salto',
    title: 'Tendencias mundiales en bodas y 15 años',
    excerpt: 'Las novedades que están marcando el ritmo en eventos internacionales.',
    category: 'Bodas',
    readTime: '4 min',
    accent: 'from-amber-600 to-amber-950',
    icon: 'Sparkles',
    takeaway: 'Integrar iluminación moderna y ambientación viva marca la diferencia.',
    ctaLabel: 'Simular mi presupuesto',
    ctaMessage: 'Armá tu fiesta gratis en el simulador.',
    sections: [
      {
        heading: 'Innovación en ambientación',
        body: ['Según Vogue y The Knot, las luces inmersivas son tendencia global.'],
      },
      {
        heading: '¿Cómo se aplica esto en tu fiesta en Salto?',
        body: ['Podés incorporarlo en la pista con tecnología de AK Producciones.'],
      },
    ],
    checklist: ['Definir el estilo de iluminación', 'Consultar opciones con el salón'],
    imagePrompt: 'Foto de fiesta moderna con luces robotizadas',
    imageAlt: 'Fiesta moderna con tecnología en iluminación',
  };

  const sampleOutputConsejo = {
    slug: 'consejos-practicos-fiesta-salto',
    title: 'Consejos prácticos para tu fiesta',
    excerpt: 'Cómo organizar una fiesta sin complicaciones.',
    category: 'Organizacion',
    readTime: '3 min',
    accent: 'from-blue-600 to-slate-950',
    icon: 'CalendarCheck',
    takeaway: 'Planificar con tiempo ahorra costos.',
    ctaLabel: 'Simular mi presupuesto',
    ctaMessage: 'Probá distintas combinaciones en el simulador.',
    sections: [
      {
        heading: 'Tiempos clave',
        body: ['Reservar el salón con tiempo simplifica todo.'],
      },
    ],
    checklist: ['Elegir fecha', 'Calcular lista de invitados'],
    imagePrompt: 'Foto de salón organizado',
    imageAlt: 'Salón listo para un evento',
  };

  it('Día impar con 3 fuentes → se guarda una nota tipoNota: "tendencia" con esas 3 fuentes y el último apartado con la llamada al simulador', async () => {
    mockFechaUruguay = '2026-11-15'; // 15 = día impar
    let callCount = 0;

    mockGenerate = async (params: any) => {
      callCount++;
      if (callCount === 1) {
        // Investigación de tendencias mundiales con 3 fuentes
        return {
          text: 'Tendencias en iluminación y bodas según fuentes internacionales.',
          custom: {
            candidates: [
              {
                groundingMetadata: {
                  groundingChunks: [
                    { web: { uri: 'https://vogue.com/weddings/trends' } },
                    { web: { uri: 'https://brides.com/decor-trends' } },
                    { web: { uri: 'https://theknot.com/party-ideas' } },
                  ],
                },
              },
            ],
          },
        };
      }
      // Redacción de la nota
      return {
        output: sampleOutputTendencia,
      };
    };

    const resultado = await generateBlogPostAndSocialDraft();
    expect(resultado).toBeDefined();

    const blogWrite = mockWriteData.mock.calls.find(([file]) => file === 'blog-posts.json');
    expect(blogWrite).toBeDefined();
    const post: BlogPost = blogWrite[1][0];

    // Verifica tipoNota: 'tendencia'
    expect(post.tipoNota).toBe('tendencia');

    // Verifica las 3 fuentes
    expect(post.fuentes).toEqual([
      'https://vogue.com/weddings/trends',
      'https://brides.com/decor-trends',
      'https://theknot.com/party-ideas',
    ]);

    // Verifica llamada al simulador en el último apartado y en cta
    expect(post.cta?.href).toBe('/simulador-de-presupuesto');
    const lastSection = post.sections[post.sections.length - 1];
    const textoUltimoApartado = lastSection.body.join(' ');
    expect(textoUltimoApartado).toMatch(/simulador/i);
  });

  it('Día impar con 1 fuente → no se guarda nota de tendencia; se guarda una de consejo', async () => {
    mockFechaUruguay = '2026-11-15'; // 15 = día impar
    let callCount = 0;

    mockGenerate = async () => {
      callCount++;
      if (callCount === 1) {
        // Investigación de tendencias con sólo 1 fuente (insuficiente)
        return {
          text: 'Tendencias con una sola fuente.',
          custom: {
            candidates: [
              {
                groundingMetadata: {
                  groundingChunks: [
                    { web: { uri: 'https://vogue.com/weddings/trends' } },
                  ],
                },
              },
            ],
          },
        };
      }
      if (callCount === 2) {
        // Investigación fallback para nota de consejo
        return { text: 'Notas de consejo para fiestas.' };
      }
      // Generación de nota de consejo
      return {
        output: sampleOutputConsejo,
      };
    };

    const resultado = await generateBlogPostAndSocialDraft();
    expect(resultado).toBeDefined();

    // Se debe haber marcado fallo por falta de fuentes
    expect(mockMarcarFallo).toHaveBeenCalledWith(
      'generate-blog-post',
      expect.stringMatching(/menos de 2 fuentes/i),
    );

    const blogWrite = mockWriteData.mock.calls.find(([file]) => file === 'blog-posts.json');
    expect(blogWrite).toBeDefined();
    const post: BlogPost = blogWrite[1][0];

    // Se guarda una de consejo, NO de tendencia
    expect(post.tipoNota).toBe('consejo');
    expect(post.tipoNota).not.toBe('tendencia');
  });

  it('Día par → nota de consejo', async () => {
    mockFechaUruguay = '2026-11-16'; // 16 = día par
    let callCount = 0;

    mockGenerate = async () => {
      callCount++;
      if (callCount === 1) {
        // Investigación de nota de consejo
        return { text: 'Recomendaciones sobre cálculo de bebidas.' };
      }
      return {
        output: sampleOutputConsejo,
      };
    };

    const resultado = await generateBlogPostAndSocialDraft();
    expect(resultado).toBeDefined();

    const blogWrite = mockWriteData.mock.calls.find(([file]) => file === 'blog-posts.json');
    expect(blogWrite).toBeDefined();
    const post: BlogPost = blogWrite[1][0];

    // El día par genera consejo
    expect(post.tipoNota).toBe('consejo');
  });

  it('Una nota de tendencia con "garantizado" en el texto sale corregida por corregirPromesasDelBlog', async () => {
    mockFechaUruguay = '2026-11-15';
    let callCount = 0;

    mockGenerate = async () => {
      callCount++;
      if (callCount === 1) {
        return {
          text: 'Tendencias mundiales con fuentes.',
          sources: [
            'https://vogue.com/weddings/trends',
            'https://theknot.com/party-ideas',
          ],
        };
      }
      return {
        output: {
          ...sampleOutputTendencia,
          sections: [
            {
              heading: 'Iluminación robotizada',
              body: [
                'La iluminación robotizada está garantizada para dar brillo a la pista. Consultá con nosotros para armar la pista.',
              ],
            },
            {
              heading: '¿Cómo se aplica esto en tu fiesta?',
              body: ['Podés incorporarlo en Salto llamando a AK Producciones.'],
            },
          ],
        },
      };
    };

    const resultado = await generarNotaDeTendencias();
    expect(resultado).toBeDefined();

    const blogWrite = mockWriteData.mock.calls.find(([file]) => file === 'blog-posts.json');
    expect(blogWrite).toBeDefined();
    const post: BlogPost = blogWrite[1][0];

    expect(post.tipoNota).toBe('tendencia');

    const serializado = JSON.stringify(post);
    // No debe contener "garantizada" ni promesas
    expect(serializado).not.toMatch(/garantizad[oa]/i);
    expect(textoQuePromete(serializado)).toBeNull();

    // La oración limpia que acompañaba en el párrafo debe conservarse
    expect(post.sections[0].body[0]).toBe('Consultá con nosotros para armar la pista.');
  });
});
