import { expect, test } from '@playwright/test';

/**
 * Orden 277 — Bloque 13:
 * La presentación LED no pierde las entradas elegidas.
 * Elegir dos entradas en /presentacion-led, tocar generar,
 * y la dirección de crear trae las dos entradas=.
 */

test.describe('Orden 277 — Presentación LED lleva las entradas seleccionadas', () => {
  test('elegir dos entradas en /presentacion-led y generar presupuesto lleva ambas entradas en la URL', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Cargando presentaci/i)).toBeHidden({ timeout: 45_000 });

    // Esperar a que la presentación esté lista
    await page.waitForTimeout(1000);

    // Navegar hasta la lámina de Entradas
    const btnSiguiente = page.getByRole('button', { name: /Siguiente/i });
    for (let i = 0; i < 10; i++) {
      if (await page.getByText(/Elegí las Entradas/i).isVisible().catch(() => false)) {
        break;
      }
      if (await btnSiguiente.isVisible().catch(() => false)) {
        await btnSiguiente.click();
        await page.waitForTimeout(400);
      }
    }

    await expect(page.getByText(/Elegí las Entradas/i)).toBeVisible({ timeout: 15_000 });

    // Seleccionar dos entradas
    const entradaToggles = page.locator('div.grid button.rounded-full');
    const count = await entradaToggles.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await entradaToggles.nth(0).click();
    await page.waitForTimeout(300);
    await entradaToggles.nth(1).click();
    await page.waitForTimeout(300);

    // Navegar hasta la lámina de Cierre / Presupuesto
    for (let i = 0; i < 20; i++) {
      const btnGenerar = page.getByRole('button', { name: /Generar Presupuesto/i });
      if (await btnGenerar.isVisible().catch(() => false)) {
        break;
      }
      if (await btnSiguiente.isVisible().catch(() => false)) {
        await btnSiguiente.click();
        await page.waitForTimeout(400);
      }
    }

    const btnGenerarPresupuesto = page.getByRole('button', { name: /Generar Presupuesto/i });
    await expect(btnGenerarPresupuesto).toBeVisible({ timeout: 15_000 });
    await btnGenerarPresupuesto.click();

    // Comprobar redirección a /presupuestos/nuevo/crear con las dos entradas
    await page.waitForURL(/\/presupuestos\/nuevo\/crear/, { timeout: 20_000 });
    const currentUrl = page.url();

    expect(currentUrl).toContain('entradas=');
    const parsedUrl = new URL(currentUrl);
    const entradasParams = parsedUrl.searchParams.getAll('entradas');
    expect(entradasParams.length).toBe(2);
  });
});
