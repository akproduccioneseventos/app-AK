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

import { describe, it, expect } from '@jest/globals';
import { getSeoPosicionamientoData } from '@/app/actions/seo-posicionamiento';
import { SEO_INTERVAL_MS, NOTAS_POR_CORRIDA } from '@/lib/marketing-automation';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';

describe('Bloques 3 y 4 — SEO, Blog y Posicionamiento en Google', () => {
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

  it('la acción getSeoPosicionamientoData audita metadatos y devuelve estado óptimo', async () => {
    const data = await getSeoPosicionamientoData();
    expect(data.paginasDeVentaTotal).toBeGreaterThan(0);
    expect(data.notasDelBlogTotal).toBeGreaterThan(0);
    expect(data.totalUrlsEnSitemap).toBeGreaterThan(0);
    expect(data.auditoriaMetadatos.estadoSalud).toBe('optimo');
    expect(data.auditoriaMetadatos.paginasSinTitulo).toHaveLength(0);
    expect(data.auditoriaMetadatos.paginasSinDescripcion).toHaveLength(0);
    expect(data.googleSearchConsole.terminosBuscados.length).toBeGreaterThan(0);
  });
});
