const { TextEncoder, TextDecoder } = require('util');
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/app/actions/feedback', () => ({
  getTestimonials: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/galeria', () => ({
  getGaleriaFotosByTipoFiesta: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/salones', () => ({
  getSalonesPublicos: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/cifras-ak', () => ({
  getCifrasPublicasAK: jest.fn().mockResolvedValue({ anios: 8, fiestasRealizadas: 200 }),
}));

jest.mock('@/app/actions/social-connections', () => ({
  getSocialConnectionsPublicas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/crm', () => ({
  saveLead: jest.fn().mockResolvedValue({ success: true }),
}));

import BodasLanding from '@/app/bodas/page';
import QuinceanerasLanding from '@/app/quinceaneras/page';
import CumpleanosLanding from '@/app/cumpleanos/page';
import FiestasEmpresarialesLanding from '@/app/fiestas-empresariales/page';
import FiestasInfantilesLanding from '@/app/fiestas-infantiles/page';
import FiestasIndexPage from '@/app/fiestas/page';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import { commercialAttributionFromSearchParams } from '@/lib/commercial/acquisition';

function extraerJsonLdFaqPages(html: string) {
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const faqs: any[] = [];
  for (const [, raw] of scripts) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.['@type'] === 'FAQPage') {
        faqs.push(parsed);
      }
    } catch {
      // ignorar scripts no válidos
    }
  }
  return faqs;
}

function textoVisible(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Orden 347 — Las páginas por tipo de fiesta', () => {
  const paginas = [
    { ruta: '/bodas', component: BodasLanding, minFaqs: 4, tipoTexto: /boda|casamiento/i },
    { ruta: '/quinceaneras', component: QuinceanerasLanding, minFaqs: 4, tipoTexto: /15/i },
    { ruta: '/cumpleanos', component: CumpleanosLanding, minFaqs: 2, tipoTexto: /cumplea[ñn]os/i },
    { ruta: '/fiestas-empresariales', component: FiestasEmpresarialesLanding, minFaqs: 4, tipoTexto: /empresa/i },
    { ruta: '/fiestas-infantiles', component: FiestasInfantilesLanding, minFaqs: 4, tipoTexto: /infantil/i },
    { ruta: '/fiestas', component: FiestasIndexPage, minFaqs: 4, tipoTexto: /fiesta/i },
  ] as const;

  it.each(paginas)('$ruta tiene FAQPage JSON-LD, está en PAGINAS_PARA_GOOGLE, tiene un solo h1 con Salto y cumple reglas de copy', ({ ruta, component: Page, minFaqs, tipoTexto }) => {
    expect(PAGINAS_PARA_GOOGLE).toContain(ruta);

    const html: string = renderToStaticMarkup(React.createElement(Page));
    const faqPages = extraerJsonLdFaqPages(html);
    expect(faqPages.length).toBe(1);
    expect(Array.isArray(faqPages[0].mainEntity)).toBe(true);
    expect(faqPages[0].mainEntity.length).toBeGreaterThanOrEqual(minFaqs);

    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    expect(h1Matches).toHaveLength(1);
    const h1Text = textoVisible(h1Matches[0][1]);
    expect(h1Text).toMatch(/Salto/i);
    expect(h1Text).toMatch(tipoTexto);

    const text = textoVisible(html);
    expect(text.split(/\s+/).length).toBeGreaterThanOrEqual(300);
    expect(text).not.toMatch(/garant[ií]a/i);
    expect(text).not.toContain('24/7');
    expect(text).not.toMatch(/guarder[ií]a/i);
    expect(text).not.toMatch(/\$\s*\d+/);
  });

  it('/bodas no afirma producción propia en foto ilustrativa, no muestra reseñas de 15 años y marca Imagen ilustrativa', () => {
    const html: string = renderToStaticMarkup(React.createElement(BodasLanding));
    expect(html).not.toContain('Boda producida por AK');
    expect(html).toContain('Imagen ilustrativa');
    expect(html).not.toMatch(/fiesta de 15.*reseña|15 años.*muy recomendable/i);
  });

  it('commercialAttributionFromSearchParams lee ?o= sin romper parámetros existentes', () => {
    const mockParams = (obj: Record<string, string>) => ({
      get: (k: string) => obj[k] ?? null,
    });

    expect(commercialAttributionFromSearchParams(mockParams({ o: 'google' })).source).toBe('google');
    expect(commercialAttributionFromSearchParams(mockParams({ o: 'pinterest' })).source).toBe('pinterest');
    expect(commercialAttributionFromSearchParams(mockParams({ o: 'tufiesta' })).source).toBe('tufiesta');
    expect(commercialAttributionFromSearchParams(mockParams({ o: 'ig' })).source).toBe('instagram');
    expect(commercialAttributionFromSearchParams(mockParams({ utm_source: 'facebook' })).source).toBe('facebook');
    expect(commercialAttributionFromSearchParams(mockParams({ source: 'instagram' })).source).toBe('instagram');
  });

  it('EventLandingPage usa getGaleriaFotosByTipoFiesta, FAQPage y el texto actualizado de WhatsApp', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/landing/EventLandingPage.tsx'), 'utf8');
    expect(src).toContain('getGaleriaFotosByTipoFiesta');
    expect(src).toContain('FAQPage');
    expect(src).toContain('Te contestamos por WhatsApp');
    expect(src).not.toContain('Respuesta rápida por WhatsApp o llamada');
  });
});
