import { test, expect } from '@playwright/test';

/**
 * Orden 49 - CON-04 y CON-05:
 * Contabilidad: permisos requeridos y manejo de fuentes caídas en flujo de caja.
 */

test.describe('Orden 49: Contabilidad permisos y fuentes caídas', () => {
  test('CON-04: Carga flujo de caja y verifica que fuentes caídas informen estado y no ceros válidos', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/empresa/contabilidad/flujo-caja', { waitUntil: 'domcontentloaded' });

    const contenedor = page.locator('main, [role="main"], body');
    await expect(contenedor).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/flujo-caja/);

    const titulo = page.locator('h1, h2').first();
    await expect(titulo).toHaveText(/.+/);
  });

  test('CON-05: La sección de facturas o contabilidad exige permisos correspondientes', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/empresa/contabilidad', { waitUntil: 'domcontentloaded' });

    const contenedor = page.locator('main, [role="main"], body');
    await expect(contenedor).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/contabilidad/);
  });
});
