jest.mock('server-only', () => ({}), { virtual: true });

let mockGuestsPerStaff = 25;
let mockGenerate: any = null;
let mockPostsData: any[] = [];
const mockWriteData = jest.fn(async () => undefined);

jest.mock('@/lib/commercial/live-budget-editor', () => {
  const actual = jest.requireActual('@/lib/commercial/live-budget-editor');
  return {
    ...actual,
    applyAutomaticStaffByGuests: jest.fn((state: any, options: any) => {
      return actual.applyAutomaticStaffByGuests(state, {
        ...options,
        guestsPerStaff: mockGuestsPerStaff,
      });
    }),
  };
});

jest.mock('@/ai/genkit', () => {
  const actual = jest.requireActual('@/ai/genkit');
  return {
    ...actual,
    generateWithGeminiFallback: jest.fn(async (...args: any[]) => {
      if (mockGenerate) return mockGenerate(...args);
      return actual.generateWithGeminiFallback(...args);
    }),
  };
});

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => mockPostsData),
  writeData: jest.fn(async (...args: any[]) => mockWriteData(...args)),
}));

import {
  corregirPromesasDelBlog,
  textoQuePromete,
  getDatosDeAkParaElBlog,
} from '@/lib/blog/sin-promesas';
import * as sinPromesasModule from '@/lib/blog/sin-promesas';
import { generateBlogPostAndSocialDraft } from '@/lib/blog-ai-generator';
import type { BlogPost } from '@/types/blog';

// Copia fiel de los posts anteriores al cambio de la Orden 96
const POSTS_ANTERIORES: BlogPost[] = [
  {
    slug: 'como-calcular-bebida-evento-salto',
    title: 'Cómo calcular la bebida para tu fiesta sin que sobre ni falte',
    excerpt: 'Guía práctica para calcular cerveza, vino, refrescos y barra de tragos en Salto.',
    category: 'Presupuesto',
    readTime: '4 min',
    publishedAt: '2026-06-25',
    accent: 'from-amber-600 to-amber-955',
    icon: 'CupSoda',
    takeaway: 'El promedio ideal es 1.5 litros de bebida sin alcohol por persona, y para la barra, calcular de 3 a 4 tragos promedio por adulto.',
    cta: {
      label: 'Calcular con la barra incluida',
      href: '/simulador-de-presupuesto',
      message: 'Probá distintas combinaciones en el simulador.',
    },
    sections: [
      {
        heading: 'La barra de tragos: Cuánto rinde cada botella',
        body: [
          'Si contratás una barra tecnológica de AK Producciones, el cálculo del stock ya está cubierto, pero si la armás por tu cuenta, tené en cuenta los rendimientos: una botella de Fernet rinde de 8 a 10 vasos, una de Gin rinde unos 12 tragos con tónica, y el Vodka rinde 10 tragos frutales.',
          'Siempre es aconsejable tener un 15% de margen extra en bebidas blancas y hielo por las dudas. En una noche calurosa salteña, el hielo vuela.',
        ],
      },
    ],
    checklist: [
      'Contar con 1 kg de hielo por persona para enfriar y servir.',
      'Definir si habrá cerveza artesanal en canilla o botella de litro.',
    ],
  },
  {
    slug: 'catering-tradicional-vs-islas-quinceanos',
    title: 'Catering tradicional vs. islas temáticas para 15 años',
    excerpt: 'Ventajas de cada formato de cena para fiestas de quince.',
    category: 'Catering',
    readTime: '5 min',
    publishedAt: '2026-06-20',
    accent: 'from-rose-600 to-pink-900',
    icon: 'Utensils',
    takeaway: 'Las islas temáticas reducen vajilla y dan dinamismo.',
    cta: {
      label: 'Diseñar el menú de mis 15',
      href: '/simulador-de-presupuesto',
      message: 'Elegí entre islas o menú formal en el simulador.',
    },
    sections: [
      {
        heading: 'Islas temáticas: Comida interactiva y sin pausas',
        body: [
          'Las islas de comida proponen una fiesta mucho más relajada.',
          'Es la opción preferida para las quinceañeras en Salto porque los chicos no quieren estar sentados dos horas esperando un plato.',
        ],
      },
      {
        heading: 'La opción mixta: Lo mejor de los dos mundos',
        body: [
          'Si tenés dudas, la mayoría de los clientes de AK Producciones eligen la propuesta mixta: una recepción muy abundante con islas de comida para descontracturar el inicio, y luego un plato principal servido en mesa para formalizar la cena antes de abrir la pista de baile.',
        ],
      },
    ],
  },
  {
    slug: 'tecnologias-iluminacion-pantallas-quince',
    title: 'Tecnología en iluminación y pantallas para fiestas de quince',
    excerpt: 'Cómo transformar el salón con efectos visuales y pista LED.',
    category: 'XV anos',
    readTime: '5 min',
    publishedAt: '2026-06-15',
    accent: 'from-indigo-600 to-purple-950',
    icon: 'Sparkles',
    takeaway: 'La iluminación robotizada marca los momentos clave del evento.',
    cta: {
      label: 'Ver paquetes con pantalla',
      href: '/simulador-de-presupuesto',
      message: 'Cotizá cabezales móviles y pista LED.',
    },
    sections: [
      {
        heading: 'Efectos especiales y seguridad',
        body: [
          'Asegurar chispas frías homologadas y seguras para interiores.',
        ],
      },
    ],
    checklist: [
      'Pedir que el DJ e iluminación estén coordinados bajo un mismo sistema de control.',
      'Asegurar chispas frías homologadas y seguras para interiores.',
      'Probar los videos en la pantalla LED del salón horas antes del evento.',
      'Consultar por la potencia eléctrica contratada en el salón para no tener cortes.',
    ],
  },
];

describe('Bloque 6 (Orden 96) — El blog tampoco promete', () => {
  beforeEach(() => {
    mockGuestsPerStaff = 25;
    mockGenerate = null;
    mockPostsData = [];
    mockWriteData.mockClear();
  });

  test('textoQuePromete encuentra "garantía absoluta" y "la mayoría de los clientes"', () => {
    expect(textoQuePromete('Ofrecemos garantía absoluta en el salón')).toBeTruthy();
    expect(textoQuePromete('la mayoría de los clientes eligen nuestro menú')).toBeTruthy();
    expect(textoQuePromete('servicio de DJ profesional')).toBeNull();
  });

  test('corregirPromesasDelBlog sobre los posts anteriores devuelve artículos donde textoQuePromete da null', () => {
    const corregidos = corregirPromesasDelBlog(POSTS_ANTERIORES);

    for (const post of corregidos) {
      const serializado = JSON.stringify(post);
      const promesa = textoQuePromete(serializado);
      expect(promesa).toBeNull();
    }
  });

  test('un artículo con "Revisar la potencia te garantiza que todo funcione sin riesgos ni cortes. Pedí la ficha." queda sólo con "Pedí la ficha."', () => {
    const postPrueba: BlogPost = {
      slug: 'prueba-potencia-electrica',
      title: 'Potencia eléctrica del salón',
      excerpt: 'Guía técnica para no cortar la luz.',
      category: 'Organizacion',
      readTime: '3 min',
      publishedAt: '2026-07-01',
      accent: 'from-blue-600 to-indigo-900',
      icon: 'Zap',
      takeaway: 'Revisar la ficha técnica es esencial.',
      cta: { label: 'Consultar', href: '/simulador', message: 'Calculá' },
      sections: [
        {
          heading: 'Requisitos de energía',
          body: [
            'Revisar la potencia te garantiza que todo funcione sin riesgos ni cortes. Pedí la ficha.',
          ],
        },
      ],
      checklist: [],
    };

    const [corregido] = corregirPromesasDelBlog([postPrueba]);
    expect(corregido.sections[0].body[0]).toBe('Pedí la ficha.');
  });

  test('DATOS_DE_AK_PARA_EL_BLOG dice "cada 25 invitados" leyendo applyAutomaticStaffByGuests, y cambia si cambia ese cálculo', () => {
    // Por defecto es 25
    expect(sinPromesasModule.DATOS_DE_AK_PARA_EL_BLOG).toContain('cada 25 invitados');

    // Cambiamos el valor mockeado
    mockGuestsPerStaff = 30;

    expect(sinPromesasModule.DATOS_DE_AK_PARA_EL_BLOG).toContain('cada 30 invitados');
    expect(getDatosDeAkParaElBlog()).toContain('cada 30 invitados');
  });

  test('con la investigación simulada fallando, el artículo se escribe igual y fuentes queda vacío', async () => {
    let callCount = 0;
    mockGenerate = async () => {
      callCount++;
      if (callCount === 1) {
        // Llamada de investigación con búsqueda web falla
        throw new Error('Fallo de red en Google Search Retrieval');
      }

      // Llamada de generación del artículo
      return {
        output: {
          slug: 'fiestas-en-salto-sin-estres',
          title: 'Fiestas en Salto sin estrés y con criterio',
          excerpt: 'Consejos para planificar tu evento sin complicaciones.',
          category: 'Organizacion',
          readTime: '4 min',
          accent: 'from-purple-700 to-slate-950',
          icon: 'CalendarCheck',
          takeaway: 'Planificar con anticipación y coordinar con un solo equipo.',
          ctaLabel: 'Simular mi presupuesto',
          ctaMessage: 'Armá tu fiesta gratis en el simulador.',
          sections: [
            {
              heading: 'Planificación ordenada',
              body: ['Tener un cronograma claro ayuda a disfrutar la noche.'],
            },
          ],
          checklist: ['Confirmar la fecha con el salón', 'Definir el menú con tiempo'],
          imagePrompt: 'Foto de salón elegante decorado',
          imageAlt: 'Salón de eventos decorado para fiesta en Salto',
        },
      };
    };

    const resultado = await generateBlogPostAndSocialDraft();
    expect(resultado).toBeDefined();
    expect(resultado.post.fuentes).toBeUndefined();
    expect(mockWriteData).toHaveBeenCalled();
  });

  test('con el generador simulado devolviendo un artículo con "seguras para interiores", no se llama a writeData', async () => {
    let callCount = 0;
    mockGenerate = async () => {
      callCount++;
      if (callCount === 1) {
        return { text: 'Notas de investigación' };
      }

      return {
        output: {
          slug: 'efectos-visuales-y-chispas',
          title: 'Efectos visuales para tu fiesta',
          excerpt: 'Cómo usar iluminación y efectos.',
          category: 'XV anos',
          readTime: '3 min',
          accent: 'from-purple-700 to-slate-950',
          icon: 'Sparkles',
          takeaway: 'Efectos destacados para la entrada.',
          ctaLabel: 'Ver servicios',
          ctaMessage: 'Consultá en el simulador.',
          sections: [
            {
              heading: 'Chispas frías',
              body: ['Utilizamos chispas seguras para interiores para la entrada.'],
            },
          ],
          checklist: ['Elegir el momento de las chispas'],
          imagePrompt: 'Chispas frías en fiesta',
          imageAlt: 'Efecto de chispas en fiesta',
        },
      };
    };

    await expect(generateBlogPostAndSocialDraft()).rejects.toThrow(/seguras para interiores/i);
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});
