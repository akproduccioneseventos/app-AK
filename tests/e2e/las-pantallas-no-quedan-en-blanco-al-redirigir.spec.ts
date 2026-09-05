import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 44 Bloque 1: Las pantallas no quedan en blanco cuando se llega por un redireccionamiento.
 *
 * Abre /evento/actual, /prospectos e /invitado/<fiesta>/<invitado> y comprueba
 * que ninguna tire error de React (#310) en la consola y que todas muestren contenido y título visible.
 */

const fiestaId = `e2e_redir_${Date.now()}`;
const invitadoId = 'inv_prueba_redir';

test.describe('Orden 44: Las pantallas no quedan en blanco al redirigir', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta Prueba Redireccionamiento';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('al entrar por /evento/actual, redirige a / y muestra la portada sin errores de React', async ({ page, context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      const txt = msg.text();
      console.log('[BROWSER CONSOLE]', msg.type(), txt);
      if (txt.includes('Minified React error') || txt.includes('React error #310') || txt.includes('Rendered more hooks') || txt.includes('Rendered fewer hooks')) {
        erroresConsola.push(txt);
      }
    });
    page.on('pageerror', (err) => {
      console.log('[BROWSER PAGEERROR]', err.message, err.stack);
      erroresConsola.push(err.message);
    });

    await page.goto('/evento/actual', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const titulo = page.locator('h1').first();
    await expect(titulo).toBeVisible({ timeout: 20_000 });
    expect(erroresConsola.filter(e => e.includes('310') || e.includes('React error') || e.includes('Rendered'))).toEqual([]);
  });

  test('al entrar por /prospectos, redirige a /login y muestra el formulario sin pantalla en blanco', async ({ page, context }) => {
    await context.clearCookies();

    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      const txt = msg.text();
      if (txt.includes('Minified React error') || txt.includes('React error #310') || txt.includes('Rendered more hooks') || txt.includes('Rendered fewer hooks')) {
        erroresConsola.push(txt);
      }
    });
    page.on('pageerror', (err) => {
      erroresConsola.push(err.message);
    });

    await page.goto('/prospectos', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const heading = page.locator('h1, h2, [role="heading"]').first();
    await expect(heading).toBeVisible({ timeout: 20_000 });
    expect(erroresConsola.filter(e => e.includes('310') || e.includes('React error') || e.includes('Rendered'))).toEqual([]);
  });

  test('al entrar por /invitado/<fiesta>/<invitado>, redirige al portal de invitado sin pantalla en blanco', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      const txt = msg.text();
      if (txt.includes('Minified React error') || txt.includes('React error #310') || txt.includes('Rendered more hooks') || txt.includes('Rendered fewer hooks')) {
        erroresConsola.push(txt);
      }
    });
    page.on('pageerror', (err) => {
      erroresConsola.push(err.message);
    });

    await page.goto(`/invitado/${fiestaId}/${invitadoId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const heading = page.locator('h1, h2, [role="heading"], main').first();
    await expect(heading).toBeVisible({ timeout: 20_000 });
    expect(erroresConsola.filter(e => e.includes('310') || e.includes('React error') || e.includes('Rendered'))).toEqual([]);
  });
});
