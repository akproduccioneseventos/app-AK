import crypto from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

/**
 * Los papeles que se le entregan al cliente, medidos en la hoja.
 *
 * El contrato, el recibo y el resumen del evento se imprimen y se le dan en mano
 * al cliente. Si el contenido es más ancho que la hoja, el papel sale con las
 * cifras cortadas por el borde.
 *
 * Hasta ahora esto no se podía revisar sin imprimir de verdad. Se resuelve así:
 * se le pide al navegador que se comporte como si estuviera imprimiendo
 * (`emulateMedia print`) y se le da como ventana **el ancho útil de la hoja**.
 * A partir de ahí, cualquier desplazamiento de costado es contenido que la
 * impresora va a cortar.
 *
 * A4 son 210 mm de ancho. Con los márgenes de 12 mm de cada lado que declara la
 * app quedan 186 mm útiles, que a 96 puntos por pulgada son 703 puntos.
 */

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

/** Ancho útil de una hoja A4 con los márgenes de la app, en puntos. */
const A4_UTIL = 703;
/** Alto de la hoja, sólo para que la ventana tenga proporción de papel. */
const A4_ALTO = 1000;
/** Margen de dos puntos: los navegadores redondean. */
const TOLERANCIA = 2;

function crearCookieDeSesion() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}

/** Los papeles que se le entregan al cliente o se usan en el salón. */
const PAPELES = [
  { ruta: '/fiestas/nueva/resumen-imprimible', nombre: 'Resumen del evento' },
  { ruta: '/fiestas/nueva/gestion-documental/contrato-servicio', nombre: 'Contrato de servicios' },
  { ruta: '/fiestas/nueva/gestion-documental/recibo-pago', nombre: 'Recibo de pago' },
  { ruta: '/fiestas/nueva/gestion-documental/cambio-fecha', nombre: 'Aviso de cambio de fecha' },
  { ruta: '/fiestas/nueva/gestion-documental/contrato-salon', nombre: 'Contrato de salón' },
  { ruta: '/fiestas/nueva/gestion-documental/cancelacion-contrato', nombre: 'Cancelación de contrato' },
];

async function prepararSesion(context: import('@playwright/test').BrowserContext, baseURL: string) {
  await context.addInitScript(() => {
    window.localStorage.setItem('ak_session', 'true');
    window.sessionStorage.setItem('ak_session', 'true');
  });
  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);
}

async function abrirComoImpresion(page: Page, ruta: string) {
  await page.goto(ruta, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2500);
  // Acá está la clave: el navegador aplica las reglas de impresión, no las de
  // pantalla. Sin esto se estaría midiendo otra cosa.
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1000);
}

test.describe('los papeles entran en la hoja', () => {
  test('ningún documento se sale del ancho de una hoja A4', async ({ page, context, baseURL }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'La hoja se mide una sola vez, no por navegador.');
    test.setTimeout(600_000);

    await prepararSesion(context, baseURL!);
    await page.setViewportSize({ width: A4_UTIL, height: A4_ALTO });

    const problemas: string[] = [];
    for (const papel of PAPELES) {
      await abrirComoImpresion(page, papel.ruta);

      const medida = await page.evaluate(() => {
        const doc = document.documentElement;
        const sobra = doc.scrollWidth - doc.clientWidth;
        if (sobra <= 2) return { sobra, culpable: '' };

        // Quién empuja: el elemento visible más angosto que llega hasta el
        // final. Los contenedores grandes sólo acompañan.
        let culpable = '';
        let anchoDelCulpable = Infinity;
        document.querySelectorAll('body *').forEach((el) => {
          const caja = el.getBoundingClientRect();
          const estilo = getComputedStyle(el);
          if (estilo.display === 'none' || estilo.visibility === 'hidden') return;
          if (caja.width <= 0 || caja.right < doc.scrollWidth - 2) return;
          if (caja.width < anchoDelCulpable) {
            anchoDelCulpable = caja.width;
            culpable = `${el.tagName.toLowerCase()} de ${Math.round(caja.width)}px: "${(el.textContent || '').trim().slice(0, 40)}"`;
          }
        });
        return { sobra, culpable };
      });

      if (medida.sobra > TOLERANCIA) {
        problemas.push(`${papel.nombre}: se pasa ${medida.sobra}px del borde — ${medida.culpable || 'sin culpable claro'}`);
      }
    }

    expect(problemas, `Papeles que salen cortados de la impresora:\n  ${problemas.join('\n  ')}`).toEqual([]);
  });

  test('el menú de la app no se imprime en los papeles del cliente', async ({ page, context, baseURL }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'Se comprueba una sola vez.');
    test.setTimeout(300_000);

    await prepararSesion(context, baseURL!);
    await page.setViewportSize({ width: A4_UTIL, height: A4_ALTO });

    // Un contrato con el menú de la app impreso al costado no se le puede
    // entregar a nadie.
    const conMenu: string[] = [];
    for (const papel of PAPELES.slice(0, 3)) {
      await abrirComoImpresion(page, papel.ruta);
      const seVe = await page.evaluate(() => {
        const menu = document.querySelector('[data-sidebar="sidebar"]');
        if (!menu) return false;
        return getComputedStyle(menu).display !== 'none' && menu.getBoundingClientRect().width > 0;
      });
      if (seVe) conMenu.push(papel.nombre);
    }

    expect(conMenu, `Papeles que salen con el menú de la app impreso:\n  ${conMenu.join('\n  ')}`).toEqual([]);
  });
});
