import { expect, test } from '@playwright/test';

/**
 * Orden 189 - Bloque 1: Pantalla gigante 16:9
 * En 1920x1080 la foto y su fondo ambiental difuminado llenan la pantalla completa sin franjas negras.
 */

test.describe('La pantalla gigante llena la pantalla', () => {
  test.use({
    viewport: { width: 1920, height: 1080 },
  });

  test('en 1920x1080 el contenedor de diapositiva ocupa el 100% del alto y ancho', async ({ page }) => {
    // Visitamos la pantalla del muro en vivo con una fiesta de prueba o fixture
    await page.goto('/evento/muro-en-vivo/demo');

    // El contenedor principal debe medir exactamente 1920x1080
    const mainContainer = page.locator('main, div.fixed.inset-0, div.absolute.inset-0').first();
    await expect(mainContainer).toBeVisible();

    const box = await mainContainer.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(1920);
      expect(box.height).toBeGreaterThanOrEqual(1080);
    }
  });
});
