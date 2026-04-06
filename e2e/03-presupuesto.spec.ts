import { test, expect } from './fixtures';

/**
 * Test: Budget wizard (presupuesto) creation flow.
 * Tests the 3-step wizard at /presupuestos/nuevo/crear
 */
test.describe('Presupuesto – Wizard de creación', () => {
  test('carga el wizard de presupuesto (Paso 1)', async ({ authPage: page }) => {
    await page.goto('/presupuestos/nuevo/crear');

    // Wizard container should be visible
    await expect(page.locator('[data-testid="presupuesto-wizard"]')).toBeVisible({ timeout: 15_000 });

    // Step 1 title should be visible
    await expect(page.getByText(/Paso 1 de 3/i)).toBeVisible();
  });

  test('completa Paso 1: datos del evento', async ({ authPage: page }) => {
    await page.goto('/presupuestos/nuevo/crear');
    await page.waitForSelector('[data-testid="presupuesto-wizard"]', { timeout: 15_000 });

    // Fill cliente nombre
    await page.fill('#clienteNombre', 'Cliente E2E Test');

    // Fill contact
    await page.fill('#clienteContacto', '099123456');

    // Select tipo evento
    await page.locator('#eventoTipoSelect').click();
    await page.getByRole('option', { name: /cumpleaños/i }).first().click();

    // Fill number of guests
    await page.fill('#invitadosAdultos', '50');

    // Click Next
    await page.click('[data-testid="btn-siguiente-paso"]');

    // Should advance to step 2
    await expect(page.getByText(/Paso 2 de 3/i)).toBeVisible({ timeout: 5_000 });
  });

  test('navega por todos los pasos del wizard', async ({ authPage: page }) => {
    await page.goto('/presupuestos/nuevo/crear');
    await page.waitForSelector('[data-testid="presupuesto-wizard"]', { timeout: 15_000 });

    // Step 1: fill minimum required data
    await page.fill('#clienteNombre', 'Cliente E2E Wizard');
    await page.fill('#invitadosAdultos', '30');

    // Advance to step 2
    await page.click('[data-testid="btn-siguiente-paso"]');
    await expect(page.getByText(/Paso 2 de 3/i)).toBeVisible({ timeout: 5_000 });

    // Advance to step 3 (no services required)
    await page.click('[data-testid="btn-siguiente-paso"]');
    await expect(page.getByText(/Paso 3 de 3/i)).toBeVisible({ timeout: 5_000 });

    // Summary step should show guardar button
    await expect(page.locator('[data-testid="btn-guardar-presupuesto"]')).toBeVisible();
  });
});
