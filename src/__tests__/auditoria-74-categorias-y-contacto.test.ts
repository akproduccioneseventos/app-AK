/**
 * MATAFUEGO — Auditorías 73 y 74 de Codex (órdenes 124 B y 125), 6/10/2026.
 *
 * GAL74-CATEGORY: "Glitter bar" caía en Barra de Tragos por la palabra "bar".
 * CONTACT74: en Privacidad, un correo guardado como contacto se mostraba como número de WhatsApp.
 * GAL74-MEDIA: la foto "glitter-bar-01.jpeg" es un toro mecánico; no hay foto real del glitter bar.
 * GAL73: "Galería HD" abría una tarjeta de contacto externa; el dueño eligió la galería de la portada.
 *
 * Se probó rompiéndolo: sin la regla de Eventos, sin `pareceTelefono`, con la foto en la galería o
 * con el enlace externo, cada bloque se pone en rojo.
 */
const { TextEncoder, TextDecoder } = require('util');
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import fs from 'fs';
import path from 'path';
import PrivacidadPage from '@/app/privacidad/page';
import { getCompanyInfoPublica } from '@/app/actions/settings';
import { classifyGalleryCategories } from '@/components/landing/gallery-media-utils';

const { renderToStaticMarkup } = require('react-dom/server');
jest.mock('@/app/actions/settings', () => ({ getCompanyInfoPublica: jest.fn() }));

const leer = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');

describe('GAL74-CATEGORY: el entretenimiento no es una barra de tragos', () => {
  it('Glitter bar va a Eventos', () => {
    expect(classifyGalleryCategories('Glitter bar', 'Mesa de glitter bar', 'Entretenimiento')).toEqual(['Eventos']);
  });
  it.each([
    ['Barra de tragos', '', '', 'Barra de Tragos'],
    ['Gin tonic', '', '', 'Barra de Tragos'],
    ['Candy bar', '', '', 'Repostería'],
    ['Kebab', '', '', 'Catering'],
    ['Recepción decorada', '', 'Decoración', 'Decoración'],
  ])('control: %s sigue en su lugar', (t, d, c, esperado) => {
    expect(classifyGalleryCategories(t, d, c)).toEqual([esperado]);
  });
});

describe('CONTACT74: el WhatsApp de Privacidad es un teléfono', () => {
  const contacto = async (info: any) => {
    (getCompanyInfoPublica as jest.Mock).mockResolvedValueOnce(info);
    const html: string = renderToStaticMarkup(await PrivacidadPage());
    return html.match(/WhatsApp al <strong>([^<]*)<\/strong>/)?.[1];
  };

  it('un correo en el contacto no se muestra como WhatsApp: va el número de AK', async () => {
    const wa = await contacto({ companyContact: 'synthetic@example.invalid' });
    expect(wa).toBe('098 355 530');
  });
  it('un teléfono explícito válido se usa', async () => {
    expect(await contacto({ telefono: '099 888 777', companyContact: 'x@y.uy' })).toBe('099 888 777');
  });
  it('sin datos, el número de AK', async () => {
    expect(await contacto(null)).toBe('098 355 530');
  });
});

describe('GAL74-MEDIA: la foto del toro no se vende como glitter', () => {
  it('no está en la galería de la portada ni como respaldo de la presentación', () => {
    expect(leer('src/data/galeria-publica.json')).not.toContain('glitter-bar-01.jpeg');
    const led = leer('src/app/presentacion-led/slides/categoria-servicios-slide.tsx');
    expect(led).not.toMatch(/return '\/media\/catalogo-servicios\/glitter-bar-01\.jpeg'/);
    expect(leer('src/app/page.tsx')).toMatch(/FOTOS_RETIRADAS = new Set\(\['\/media\/catalogo-servicios\/glitter-bar-01\.jpeg'\]\)/);
  });
});

describe('GAL73: Galería HD lleva a fotos', () => {
  it('apunta a la galería de la portada, no a la tarjeta externa', () => {
    const nav = leer('src/components/landing/LandingNav.tsx');
    expect(nav).toMatch(/label: 'Galería HD', href: '#landing-gallery'/);
    expect(nav).not.toContain('https://galeria.akproducciones.uy');
  });
});
