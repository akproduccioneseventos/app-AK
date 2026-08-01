import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';

/**
 * Guarda de desborde horizontal en celular.
 *
 * Una pantalla "desborda" cuando su contenido es mas ancho que la ventana y
 * obliga a arrastrar la pagina de costado. Es de los defectos que mas se notan
 * en un celular y de los que menos se ven revisando codigo, porque aparece solo
 * al combinar anchos minimos con contenedores que no pueden encogerse.
 *
 * Estas rutas ya se verificaron sin desborde; la prueba evita que vuelva.
 */

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

function createSessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}

const RUTAS_INTERNAS = ['/admin', '/customers', '/presupuestos', '/eventos', '/pagos-rapidos', '/empresa/menus', '/alertas', '/empresa/contabilidad/reportes',
  '/empresa/menus/tragos', '/fiestas/nueva/reuniones', '/settings/cupones',
  '/settings/notifications', '/settings/whatsapp-business', '/settings/templates/layouts',
  '/empresa/red-social-eventos', '/fiestas/nueva/decoracion', '/settings/contenido-publico'];
const RUTAS_PUBLICAS = ['/', '/simulador-de-presupuesto', '/catalogo/bodas'];

/** Margen de 2px: los navegadores redondean subpixeles al medir. */
const TOLERANCIA = 2;

async function medirDesborde(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
}

test.describe('sin desborde horizontal en celular', () => {
  test('rutas internas del staff', async ({ page, context, baseURL }) => {
    test.setTimeout(300_000);
    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      { name: 'ak_session', value: createSessionToken(), url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    ]);

    for (const ruta of RUTAS_INTERNAS) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      // Se mide el estado ya asentado: mientras cargan datos, algunas pantallas
      // muestran anchos provisorios que no reflejan lo que termina viendo el usuario.
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(4000);
      const desborde = await medirDesborde(page);
      expect(desborde, `${ruta} desborda ${desborde}px a lo ancho en celular`).toBeLessThanOrEqual(TOLERANCIA);
    }
  });

  test('rutas publicas', async ({ page }) => {
    test.setTimeout(180_000);
    for (const ruta of RUTAS_PUBLICAS) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      // Se mide el estado ya asentado: mientras cargan datos, algunas pantallas
      // muestran anchos provisorios que no reflejan lo que termina viendo el usuario.
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(4000);
      const desborde = await medirDesborde(page);
      expect(desborde, `${ruta} desborda ${desborde}px a lo ancho en celular`).toBeLessThanOrEqual(TOLERANCIA);
    }
  });
});
