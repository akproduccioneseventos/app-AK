jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(() => Promise.resolve({
    get: jest.fn().mockReturnValue({ value: 'fake-session' }),
  })),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockImplementation(() => Promise.resolve()),
  hasAppSession: jest.fn().mockImplementation(() => Promise.resolve(true)),
  requirePermiso: jest.fn().mockImplementation(() => Promise.resolve({ ok: true })),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockImplementation((file: string, fallback: any) => {
    if (file === 'social-posts.json') {
      return Promise.resolve([
        {
          id: 'post_1',
          platform: 'Google',
          text: 'Novedades AK Producciones',
          publishDate: new Date().toISOString(),
          status: 'Publicado',
        },
      ]);
    }
    return Promise.resolve(fallback);
  }),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

import { describe, it, expect } from '@jest/globals';
import { getSeoPosicionamientoData } from '@/app/actions/seo-posicionamiento';
import { getMetadataRealDeRuta } from '@/lib/seo/auditoria-metadatos';
import { SEO_INTERVAL_MS, NOTAS_POR_CORRIDA } from '@/lib/marketing-automation';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';

describe('Auditoría real de títulos, SEO y Posicionamiento', () => {
  it('la frecuencia del blog está configurada en 1 nota cada 2 días (48 hs)', () => {
    const dosDiasMs = 2 * 24 * 60 * 60 * 1000;
    expect(SEO_INTERVAL_MS).toBe(dosDiasMs);
    expect(NOTAS_POR_CORRIDA).toBe(1);
  });

  it('el sitemap contiene las páginas públicas de venta y las notas del blog', () => {
    expect(PAGINAS_PARA_GOOGLE.length).toBeGreaterThanOrEqual(15);
    expect(PAGINAS_PARA_GOOGLE).toContain('/');
    expect(PAGINAS_PARA_GOOGLE).toContain('/bodas');
    expect(PAGINAS_PARA_GOOGLE).toContain('/quinceaneras');
    expect(PAGINAS_PARA_GOOGLE).toContain('/cumpleanos');
    expect(PAGINAS_PARA_GOOGLE).toContain('/simulador-de-presupuesto');
    expect(PAGINAS_PARA_GOOGLE).toContain('/public/blog');
  });

  it('getMetadataRealDeRuta lee los metadatos directamente de los archivos de cada página', async () => {
    // Portada
    const portada = await getMetadataRealDeRuta('/');
    expect(portada.title.length).toBeGreaterThan(10);
    expect(portada.description.length).toBeGreaterThan(20);

    // Bodas
    const bodas = await getMetadataRealDeRuta('/bodas');
    expect(bodas.title).toContain('Casamientos');
    expect(bodas.description).toContain('Salto');

    // Quinceañeras
    const quince = await getMetadataRealDeRuta('/quinceaneras');
    expect(quince.title).toContain('15');
    expect(quince.description.length).toBeGreaterThan(20);

    // Catálogo
    const catalogo = await getMetadataRealDeRuta('/catalogo');
    expect(catalogo.title).toContain('Catálogo');
    expect(catalogo.description.length).toBeGreaterThan(20);

    // Simulador
    const simulador = await getMetadataRealDeRuta('/simulador-de-presupuesto');
    expect(simulador.title.length).toBeGreaterThan(10);
    expect(simulador.description.length).toBeGreaterThan(20);
  });

  it('la acción getSeoPosicionamientoData audita todas las páginas públicas contra sus metadatos reales y da óptimo', async () => {
    const data = await getSeoPosicionamientoData();
    expect(data.paginasDeVentaTotal).toBeGreaterThan(0);
    expect(data.notasDelBlogTotal).toBeGreaterThan(0);
    expect(data.totalUrlsEnSitemap).toBeGreaterThan(0);
    expect(data.auditoriaMetadatos.estadoSalud).toBe('optimo');
    expect(data.auditoriaMetadatos.paginasSinTitulo).toHaveLength(0);
    expect(data.auditoriaMetadatos.paginasSinDescripcion).toHaveLength(0);
    expect(data.googleSearchConsole.terminosBuscados.length).toBeGreaterThan(0);
  }, 15000);

  it('detecta correctamente cuando una ruta no tiene metadatos o están vacíos', async () => {
    const vacia = await getMetadataRealDeRuta('/ruta-inexistente-sin-metadatos');
    expect(vacia.title).toBe('');
    expect(vacia.description).toBe('');
  });
});
