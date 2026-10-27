import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, borrarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Celular y tablet sin cortes (pedido del dueño: "se cortaban palabras, botones chicos").
 *
 * Mide el resultado en pantalla, en 390x844 (celular) y 820x1180 (tablet), sobre las
 * pantallas que ven prospectos, clientes e invitados:
 *  1. la página no se corre para el costado;
 *  2. ningún botón visible mide menos de 40 px de alto;
 *  3. ningún botón ni título queda con el texto cortado (scrollWidth <= clientWidth + 1).
 *
 * Los resúmenes de varias líneas con `line-clamp` son a propósito y no cuentan.
 * No usa el servidor de desarrollo ni guarda nada: sólo abre y mide.
 */

const TAMANOS = [
  { nombre: 'celular', width: 390, height: 844 },
  { nombre: 'tablet', width: 820, height: 1180 },
];

const FIJAS = [
  '/', '/landing', '/landing/bodas', '/landing/eventos', '/landing/xv-anos', '/bodas',
  '/quinceaneras', '/cumpleanos', '/simulador-de-presupuesto', '/blog', '/tecnologia',
  '/club-uruguay', '/catalogo', '/privacidad', '/login', '/experiencia',
];

const MODULOS_EVENTO = [
  'galeria', 'muro-en-vivo', 'buzon', 'fotocabina', 'espejo-magico', 'touchpix',
  'bienvenida', 'bogue', 'hub', 'mi-mesa', 'social', 'zona-digital',
];

const MODULOS_PORTAL = ['confirmar-invitados', 'faq', 'fotos-video', 'menu', 'muro-social', 'musica'];

test.describe('celular y tablet sin cortes', () => {
  let fiestaId = '';

  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: `e2e_cel_${Date.now()}`, clavePortal: 'clave-cel-e2e' });
    fiestaId = fiesta.id;
  });

  test.afterAll(() => {
    if (fiestaId) borrarFiesta(fiestaId);
  });

  for (const tam of TAMANOS) {
    test(`${tam.nombre}: sin desborde, botones tocables y textos enteros`, async ({ browser }) => {
      test.setTimeout(300_000);
      const contexto = await browser.newContext({
        viewport: { width: tam.width, height: tam.height },
        hasTouch: true,
        isMobile: tam.nombre === 'celular',
      });
      const page = await contexto.newPage();
      const rutas = [
        ...FIJAS,
        `/portal-cliente/${fiestaId}`,
        ...MODULOS_PORTAL.map((m) => `/portal-cliente/${fiestaId}/${m}`),
        `/invitacion/${fiestaId}`,
        `/invitacion/${fiestaId}/rsvp`,
        `/album/${fiestaId}`,
        ...MODULOS_EVENTO.map((m) => `/evento/${m}/${fiestaId}`),
      ];

      const fallas: string[] = [];
      let medidas = 0;
      try {
        for (const ruta of rutas) {
          await page.goto(ruta, { waitUntil: 'domcontentloaded', timeout: 45_000 });
          await page.waitForTimeout(1200);
          // Recorre la página hacia abajo: las secciones se arman al llegar a ellas.
          await page.evaluate(async () => {
            const alto = document.documentElement.scrollHeight;
            for (let y = 0; y < alto; y += 600) {
              window.scrollTo(0, y);
              await new Promise((ok) => setTimeout(ok, 60));
            }
            window.scrollTo(0, 0);
          });
          await page.waitForTimeout(500);
          const r = await page.evaluate(() => {
            const visible = (e: Element) => {
              const b = e.getBoundingClientRect();
              const cs = getComputedStyle(e);
              return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
            };
            const nombre = (e: Element) =>
              `${e.tagName.toLowerCase()} "${(e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`;
            const d = document.documentElement;
            const out = { desborde: d.scrollWidth > d.clientWidth + 1, chicos: [] as string[], cortados: [] as string[], botones: 0 };
            for (const e of Array.from(document.body.querySelectorAll('button, [role="button"], button *, h1, h2, h3'))) {
              if (!visible(e)) continue;
              const cs = getComputedStyle(e);
              const b = e.getBoundingClientRect();
              const esBoton = e.tagName === 'BUTTON' || e.getAttribute('role') === 'button';
              if (esBoton && b.bottom > 0 && b.right > 0 && b.left < innerWidth && b.width > 4) {
                out.botones += 1;
                if (b.height < 39.5) out.chicos.push(`${nombre(e)} alto=${Math.round(b.height)}`);
              }
              const recorta = cs.textOverflow === 'ellipsis' || cs.overflowX === 'hidden';
              const clamp = (cs as any).webkitLineClamp && (cs as any).webkitLineClamp !== 'none';
              if (recorta && !clamp && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && (e.textContent || '').trim()) {
                out.cortados.push(`${nombre(e)} ${e.scrollWidth}>${e.clientWidth}`);
              }
            }
            return out;
          });
          medidas += 1;
          if (r.desborde) fallas.push(`${ruta}: la página se corre para el costado`);
          for (const c of r.chicos) fallas.push(`${ruta}: botón chico ${c}`);
          for (const c of r.cortados) fallas.push(`${ruta}: texto cortado ${c}`);
        }
      } finally {
        await contexto.close();
      }
      // Que midió de verdad: abrió todas las pantallas.
      expect(medidas).toBe(rutas.length);
      expect(fallas, fallas.join('\n')).toEqual([]);
    });
  }
});
