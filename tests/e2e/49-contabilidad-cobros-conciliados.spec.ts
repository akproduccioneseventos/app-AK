import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 49 - CON-01, CON-02 y CON-03.
 *
 * **Lo de fondo -que dos cobros al mismo tiempo no se pisen, que una cuota no se
 * anuncie cobrada sin guardarse y que la conciliacion con la factura no falle en
 * silencio- NO se puede comprobar abriendo una pantalla.** Se comprueba sin
 * navegador, y ahi si de verdad:
 *
 *   - `src/__tests__/dos-cobros-a-la-vez-no-se-pisan.test.ts`
 *   - `src/__tests__/la-contabilidad-no-miente.test.ts`
 *
 * Lo que si aporta el navegador es que la pantalla de cobros **abra y muestre lo
 * suyo**, porque una pantalla de plata en blanco no se puede publicar. Eso, y nada
 * mas, es lo que hace esta prueba: no finge comprobar lo otro.
 */
test.describe('Orden 49: la pantalla de cobros abre y muestra lo suyo', () => {
  test('pagos rapidos muestra su encabezado y su contenido, no una pantalla en blanco', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/pagos-rapidos', { waitUntil: 'domcontentloaded' });

    const titulo = page.getByRole('heading').first();
    await expect(titulo).toBeVisible({ timeout: 30_000 });

    // En el celular la pantalla tarda mas en traer los cobros: se espera a que
    // aparezcan en vez de mirar una sola vez, que daba una falla inventada.
    await expect
      .poll(async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim().length, {
        timeout: 30_000,
      })
      .toBeGreaterThan(120);

    const texto = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
    expect(texto).not.toMatch(/Application error|undefined|\[object Object\]/);
  });
});
