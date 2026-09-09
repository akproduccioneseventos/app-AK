import { test, expect } from '@playwright/test';

/**
 * Orden 49 - CON-01, CON-02, CON-03:
 * Contabilidad: cobros conciliados entre facturas y presupuestos, sin duplicados ni pérdidas por concurrencia.
 */

test.describe('Orden 49: Contabilidad cobros conciliados', () => {
  test('CON-01 y CON-03: Carga pagos rápidos y plan de pagos', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/pagos-rapidos', { waitUntil: 'domcontentloaded' });

    const contenedor = page.locator('main, [role="main"], body');
    await expect(contenedor).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/pagos-rapidos/);

    const encabezado = page.locator('h1, h2').first();
    await expect(encabezado).toHaveText(/.+/);

    await page.goto('/fiestas/nueva/plan-pagos', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/plan-pagos/);
    await expect(page.locator('main, [role="main"], body')).toBeVisible({ timeout: 20_000 });
  });

  test('CON-02: Carga la vista de facturas para conciliación con presupuestos', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/invoices/test-inv-01', { waitUntil: 'domcontentloaded' });

    const contenedor = page.locator('main, [role="main"], body');
    await expect(contenedor).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/invoices/);
  });
});
