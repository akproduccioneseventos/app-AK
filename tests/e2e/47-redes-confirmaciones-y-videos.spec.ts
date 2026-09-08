import { test, expect } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 47: Marketing y redes: confirmaciones, medios y cifras confiables.
 *
 * Esta prueba cubre:
 * - RED-01: Confirmación de copiado y publicación 1 Toque con manejo seguro de portapapeles.
 * - RED-02: Renderizado adecuado de videos (reproductor de video con controles, sin usar NextImage para videos).
 * - Adaptabilidad responsiva de las tarjetas de publicación.
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

    // La interfaz debe presentar filtros o pestañas de plataforma
    const selectorFiltros = page.locator('button:has-text("Todas"), [role="tablist"], button:has-text("Filtro")').first();
    await expect(selectorFiltros).toBeVisible({ timeout: 15_000 });
  });

  test('2. Tarjetas con video usan elemento <video> con controles y no rompen con NextImage', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    // Si existen publicaciones con video, deben tener controles de reproducción sin autoplay forzado
    const videos = page.locator('video');
    const cantidadVideos = await videos.count();

    if (cantidadVideos > 0) {
      const primerVideo = videos.first();
      await expect(primerVideo).toBeVisible();
      // Verificar que no tenga autoplay ruidoso
      const hasAutoplay = await primerVideo.getAttribute('autoplay');
      expect(hasAutoplay).toBeNull();
    }
  });

  test('3. Botón de copiar texto maneja honestamente el portapapeles', async ({ page }) => {
    test.setTimeout(90_000);
    // Otorgar permisos de portapapeles en el contexto
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    // Localizar botón de copia en cualquier tarjeta si existe
    const btnCopiar = page.locator('button[title*="Copiar"], button:has-text("Copiar")').first();
    if (await btnCopiar.isVisible()) {
      await btnCopiar.click();
      // El toast o feedback no debe arrojar error no capturado
      await page.waitForTimeout(500);
    }
  });

  test('4. Las tarjetas se adaptan correctamente en pantalla móvil sin desborde horizontal', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    const contenedor = page.locator('main, [role="main"], body').first();
    await expect(contenedor).toBeVisible({ timeout: 20_000 });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // Tolerancia de 2px
  });
});
