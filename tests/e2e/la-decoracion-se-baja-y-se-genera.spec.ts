import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 55: La decoración entrega lo que promete
 *
 * Bloque 1: Al tocar Exportar PNG, se dispara la descarga de un archivo con extensión .png.
 *
 * Los bloques 2 y 3 (contador de fotos de IA, tope de 3 sin gastar, y cuadros de
 * notas equipo/cliente) se comprueban sin abrir el navegador en Jest:
 *   - src/__tests__/decoracion-no-gasta-de-mas.test.ts
 *   - src/__tests__/la-decoracion-llega-al-cliente-como-es.test.ts
 * según la regla del proyecto para pantallas internas del equipo.
 */

test.describe('Orden 55: La decoración entrega lo que promete', () => {
  test('Bloque 1: Exportar PNG dispara la descarga de un archivo con nombre .png', async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/fiestas/nueva/decoracion', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const botonExportar = page.locator('[data-testid="btn-exportar-png"]');
    await expect(botonExportar).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await botonExportar.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);
  });
});
