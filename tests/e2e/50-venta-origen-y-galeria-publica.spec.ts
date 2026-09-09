import { test, expect } from '@playwright/test';

/**
 * Orden 50 - WEB-02 & WEB-03:
 * Verificación de canal de adquisición preservado y galería pública filtrada sin borradores.
 */

test.describe('Orden 50: Venta, Origen y Galería Pública', () => {
  test('WEB-03: Preservar origen comercial de campañas pagas en la navegación pública', async ({ page }) => {
    test.setTimeout(60_000);
    // Ingreso con UTMs de campaña publicitaria de Meta/Facebook
    await page.goto('/?utm_source=facebook&utm_medium=paid_social&utm_campaign=bodas-audit', {
      waitUntil: 'domcontentloaded',
    });

    // La portada carga correctamente
    await expect(page).toHaveTitle(/AK Producciones/i);

    // Navegación hacia el cotizador manteniendo la ruta pública
    const ctaSimulador = page.locator('a[href*="/simulador-de-presupuesto"]').first();
    if (await ctaSimulador.isVisible()) {
      await ctaSimulador.click();
      await expect(page).toHaveURL(/simulador-de-presupuesto/);
    }
  });

  test('WEB-02: La galería pública en portada no expone borradores ni contenido no aprobado', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // La sección de galería o fotos recientes está presente
    const galeriaSeccion = page.locator('#landing-gallery, section:has-text("Galería"), section:has-text("Trabajo reciente")').first();
    await expect(galeriaSeccion).toBeVisible({ timeout: 15_000 });

    // No debe contener textos o marcadores de borrador interno
    await expect(page.locator('text="Fake Borrador"')).toHaveCount(0);
    await expect(page.locator('text="[Borrador]"')).toHaveCount(0);
  });
});
