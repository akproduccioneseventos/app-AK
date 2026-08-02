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
  '/empresa/red-social-eventos', '/fiestas/nueva/decoracion', '/settings/contenido-publico',
  // Pantallas que listan mucha gente o muchos ítems: con la fiesta de prueba de
  // 80 invitados en diez mesas es donde aparecen los desbordes de verdad.
  '/fiestas/nueva/invitados', '/fiestas/nueva/invitados/layout',
  '/fiestas/nueva/personal', '/fiestas/nueva/carga-operativa',
  '/fiestas/nueva/gestion-costos-rentabilidad',
  '/empresa/insumos', '/empresa/activos-fijos'];
// El catálogo se muestra en persona, con el cliente al lado: que se corte el
// botón de avanzar es de lo peor que puede pasar. Va con los cinco tipos.
const RUTAS_PUBLICAS = ['/', '/simulador-de-presupuesto', '/presentacion-led',
  '/catalogo/bodas', '/catalogo/xv-anos', '/catalogo/cumpleanos',
  '/catalogo/corporativos', '/catalogo/aniversarios'];

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
      const response = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${ruta} devolvio una respuesta invalida`).toBeLessThan(400);
      expect(new URL(page.url()).pathname, `${ruta} redirigio inesperadamente`).toBe(ruta);
      // Se mide el estado ya asentado: mientras cargan datos, algunas pantallas
      // muestran anchos provisorios que no reflejan lo que termina viendo el usuario.
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(4000);
      const desborde = await medirDesborde(page);
      expect(desborde, `${ruta} desborda ${desborde}px a lo ancho en celular`).toBeLessThanOrEqual(TOLERANCIA);
    }
  });

  test('rutas publicas', async ({ page }) => {
    test.setTimeout(180_000);
    for (const ruta of RUTAS_PUBLICAS) {
      const response = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${ruta} devolvio una respuesta invalida`).toBeLessThan(400);
      expect(new URL(page.url()).pathname, `${ruta} redirigio inesperadamente`).toBe(ruta);
      // Se mide el estado ya asentado: mientras cargan datos, algunas pantallas
      // muestran anchos provisorios que no reflejan lo que termina viendo el usuario.
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(4000);
      const desborde = await medirDesborde(page);
      expect(desborde, `${ruta} desborda ${desborde}px a lo ancho en celular`).toBeLessThanOrEqual(TOLERANCIA);
    }
  });
});
