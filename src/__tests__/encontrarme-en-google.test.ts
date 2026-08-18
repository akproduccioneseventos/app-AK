import {
  etiquetarRutaEnCriollo,
  getGoogleAnalyticsMetrics,
} from '@/lib/presencia-digital/google-analytics';
import { AK_SOCIAL_LINKS, AK_SAME_AS_URLS } from '@/lib/public-contact';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import { publishPostInternal } from '@/lib/presencia-digital/publicador';

// Mock de data-service para controlar social-posts.json y social-connections.json
jest.mock('@/lib/data-service', () => {
  let mockPosts: any[] = [];
  let mockConnections: any[] = [];

  return {
    readData: jest.fn(async (file: string, fallback: any) => {
      if (file === 'social-posts.json') return mockPosts;
      if (file === 'social-connections.json') return mockConnections;
      return fallback;
    }),
    writeData: jest.fn(async (file: string, data: any) => {
      if (file === 'social-posts.json') mockPosts = data;
      if (file === 'social-connections.json') mockConnections = data;
      return data;
    }),
    __setMockData: (posts: any[], conns: any[]) => {
      mockPosts = posts;
      mockConnections = conns;
    },
    __getMockPosts: () => mockPosts,
  };
});

describe('Encontrarme en Google — Posicionamiento, Pinterest, Analytics y Cuentas Oficiales (Orden Agosto 2026)', () => {
  const { __setMockData } = require('@/lib/data-service');

  describe('Bloque 1 — La web, adentro del panel (Google Analytics 4)', () => {
    it('1. Traduce rutas técnicas a nombres en criollo comprensibles para el dueño', () => {
      expect(etiquetarRutaEnCriollo('/')).toBe('Portada / Inicio');
      expect(etiquetarRutaEnCriollo('/quinceaneras')).toBe('15 Años y Quinceañeras');
      expect(etiquetarRutaEnCriollo('/bodas')).toBe('Bodas y Casamientos');
      expect(etiquetarRutaEnCriollo('/simulador-de-presupuesto')).toBe('Simulador de Presupuesto');
      expect(etiquetarRutaEnCriollo('/club-uruguay')).toBe('Salón Club Uruguay');
      expect(etiquetarRutaEnCriollo('/catalogo')).toBe('Catálogo de Servicios');
      expect(etiquetarRutaEnCriollo('/public/blog')).toBe('Blog y Guías');
    });

    it('2. Si no hay variables de entorno en el servidor, devuelve "hasCredentials: false" y mensaje claro sin números inventados', async () => {
      const originalEnv = { ...process.env };
      delete process.env.GA4_PROPERTY_ID;
      delete process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

      const resultado = await getGoogleAnalyticsMetrics(30);

      expect(resultado.hasCredentials).toBe(false);
      expect(resultado.totalVisitors).toBeNull();
      expect(resultado.missingCredentialsNote).toContain('GA4_PROPERTY_ID');

      process.env = originalEnv;
    });
  });

  describe('Bloque 2 — Pinterest, Threads y X en modo Listo para copiar', () => {
    it('3. Pinterest, Threads y X se tratan en modo manual "Listo para copiar" sin fallar', async () => {
      const posts = [
        {
          id: 'post_pin_1',
          platform: 'Pinterest' as const,
          isGeneralCampaign: false,
          publishDate: new Date().toISOString(),
          text: 'Ideas de centros de mesa para 15 años',
          status: 'Borrador' as const,
        },
      ];

      __setMockData(posts, []);

      const res = await publishPostInternal('post_pin_1');

      expect(res.readyForManualCopy).toBe(true);
      expect(res.failedPlatforms?.[0]?.platform).toBe('Pinterest');
      expect(res.failedPlatforms?.[0]?.reason).toContain('Pinterest requiere aprobación');
    });
  });

  describe('Bloque 4 — Cobertura completa del Sitemap para Google', () => {
    it('4. PAGINAS_PARA_GOOGLE incluye todas las notas del blog y landings públicas', () => {
      expect(PAGINAS_PARA_GOOGLE).toContain('/');
      expect(PAGINAS_PARA_GOOGLE).toContain('/bodas');
      expect(PAGINAS_PARA_GOOGLE).toContain('/quinceaneras');
      expect(PAGINAS_PARA_GOOGLE).toContain('/simulador-de-presupuesto');
      expect(PAGINAS_PARA_GOOGLE).toContain('/public/blog');
      expect(PAGINAS_PARA_GOOGLE).toContain('/public/blog/como-empezar-a-organizar-una-fiesta-sin-estres');
      expect(PAGINAS_PARA_GOOGLE).toContain('/public/blog/presupuesto-de-fiesta-que-debe-incluir');
      expect(PAGINAS_PARA_GOOGLE).toContain('/public/blog/como-elegir-el-menu-para-un-evento');
    });
  });

  describe('Bloque 5 — Cuentas oficiales declaradas una sola vez', () => {
    it('5. AK_SOCIAL_LINKS y AK_SAME_AS_URLS contienen la URL oficial de Pinterest y las demás 6 redes', () => {
      expect(AK_SOCIAL_LINKS.pinterest).toBe('https://es.pinterest.com/akproduccionessalto/');
      expect(AK_SOCIAL_LINKS.instagram).toBe('https://www.instagram.com/akproduccionesfiestasyeventos/');
      expect(AK_SOCIAL_LINKS.facebook).toBe('https://www.facebook.com/akproduccionessalto/');

      expect(AK_SAME_AS_URLS).toHaveLength(7);
      expect(AK_SAME_AS_URLS.some((u) => u.includes('pinterest.com'))).toBe(true);
      expect(AK_SAME_AS_URLS.some((u) => u.includes('instagram.com/akproduccionesfiestasyeventos'))).toBe(true);
    });
  });
});
