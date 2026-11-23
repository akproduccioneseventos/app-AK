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
  // La sesion de 4 partes (sin usuario) dejo de valer el 28/10/2026 (orden 247): va el usuario adentro.
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify({ email: 'admin@akproducciones.com', role: 'admin', userId: 'admin', perfil: 'dueno' }))}`;
  return encodeURIComponent(`${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`); // Next decodifica el valor de la cookie: va codificado una vez más.
}

const RUTAS_INTERNAS = ['/mi-dia', '/settings', '/asistente', '/customers', '/presupuestos/nuevo', '/eventos', '/pagos-rapidos',
  '/empresa/menus', '/empresa/contabilidad/reportes', '/contabilidad/crm',
  '/fiestas/nueva/operacion?tab=reuniones', '/empresa/presencia-digital', '/fiestas/nueva/show?tab=decoracion',
  // Pantallas que listan mucha gente o muchos ítems: con la fiesta de prueba de
  // 80 invitados en diez mesas es donde aparecen los desbordes de verdad.
  '/fiestas/nueva/datos?tab=invitados',
  '/fiestas/nueva/operacion?tab=personal', '/fiestas/nueva/operacion?tab=carga-operativa',
  '/fiestas/nueva/plata-y-papeles?tab=gestion-costos-rentabilidad',
  '/empresa/insumos', '/empresa/activos-fijos'];
const RUTAS_PUBLICAS = ['/', '/simulador-de-presupuesto', '/presentacion-led', '/enlaces'];

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
      const urlActual = new URL(page.url());
      const comparada = ruta.includes('?') ? `${urlActual.pathname}${urlActual.search}` : urlActual.pathname;
      expect(comparada, `${ruta} redirigio inesperadamente`).toBe(ruta);
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
      const urlActual = new URL(page.url());
      const comparada = ruta.includes('?') ? `${urlActual.pathname}${urlActual.search}` : urlActual.pathname;
      expect(comparada, `${ruta} redirigio inesperadamente`).toBe(ruta);
      // Se mide el estado ya asentado: mientras cargan datos, algunas pantallas
      // muestran anchos provisorios que no reflejan lo que termina viendo el usuario.
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(4000);
      const desborde = await medirDesborde(page);
      expect(desborde, `${ruta} desborda ${desborde}px a lo ancho en celular`).toBeLessThanOrEqual(TOLERANCIA);
    }
  });
});
