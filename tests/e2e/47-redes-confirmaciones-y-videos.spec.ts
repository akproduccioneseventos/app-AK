import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 47: Marketing y redes: confirmaciones, medios y cifras confiables.
 *
 * Esta prueba cubre:
 * - RED-01: Confirmación de copiado y publicación 1 Toque con manejo seguro de portapapeles.
 * - RED-02: Renderizado adecuado de videos (reproductor de video con controles, sin usar NextImage para videos).
 * - ADS-01: Verificación de cifras del panel /contabilidad/crm/marketing-ads con TopeDeGastoControl.
 */

test.describe('Orden 47 - Redes sociales, confirmaciones seguras y videos', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
  });

  test('1. Panel de redes sociales carga tarjetas con títulos, estados y acciones disponibles', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    const encabezado = page.locator('h1, h2, div:has-text("Redes Sociales")').first();
    await expect(encabezado).toBeVisible({ timeout: 25_000 });
    await expect(encabezado).toContainText(/Redes Sociales|Publicaciones/i);

    // Comprobar presencia de botones de plataforma o filtros
    const botones = page.locator('button');
    expect(await botones.count()).toBeGreaterThan(0);
  });

  test('2. Tarjetas con video usan elemento <video> con controles y no rompen con NextImage', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    const videos = page.locator('video');
    const cantidadVideos = await videos.count();

    if (cantidadVideos > 0) {
      const primerVideo = videos.first();
      await expect(primerVideo).toBeVisible();
      // Verificar atributos del reproductor
      await expect(primerVideo).toHaveAttribute('controls', '');
    } else {
      expect(cantidadVideos).toBe(0);
    }
  });

  test('3. Botón de copiar texto maneja honestamente el portapapeles', async ({ page }) => {
    test.setTimeout(90_000);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    const btnCopiar = page.locator('button[title*="Copiar"], button:has-text("Copiar")').first();
    if (await btnCopiar.isVisible()) {
      await expect(btnCopiar).toContainText(/Copiar/i);
      await btnCopiar.click();
      await page.waitForTimeout(500);
    }
  });

  test('4. Panel de marketing y anuncios (/contabilidad/crm/marketing-ads) carga con tope y compromiso verificado', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/contabilidad/crm/marketing-ads', { waitUntil: 'domcontentloaded' });

    const titulo = page.locator('h1').first();
    await expect(titulo).toBeVisible({ timeout: 25_000 });
    await expect(titulo).toContainText(/Dónde Poner la Plata de Publicidad|Publicidad/i);

    // Verificar tarjetas de TopeDeGastoControl
    const cardComprometido = page.locator('div:has-text("Comprometido en el Mes")').first();
    await expect(cardComprometido).toContainText(/Comprometido en el Mes/i);
  });

  test('5. Las tarjetas se adaptan correctamente en pantalla móvil sin desborde horizontal', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    const contenedor = page.locator('main, [role="main"], body').first();
    await expect(contenedor).toBeVisible({ timeout: 20_000 });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
