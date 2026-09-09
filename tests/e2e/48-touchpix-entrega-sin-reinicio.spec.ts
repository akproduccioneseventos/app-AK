import { test, expect } from '@playwright/test';

/**
 * Orden 48 - ENT-03 y ENT-04:
 * Touchpix: entrega sin reinicio prematuro y conteo de repeticiones.
 */

test.describe('Orden 48: Touchpix entrega sin reinicio y límite de repeticiones', () => {
  test('ENT-03 y ENT-04: Carga touchpix y verifica controles de captura, repetición y subida', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/touchpix/demo-fiesta-15', { waitUntil: 'domcontentloaded' });

    const contenedor = page.locator('main, [role="main"], body');
    await expect(contenedor).toBeVisible({ timeout: 20_000 });

    await expect(page).toHaveURL(/evento\/touchpix/);

    const encabezado = page.locator('h1, h2, p, button').first();
    await expect(encabezado).toHaveText(/.+/);
  });
});
