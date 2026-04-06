import { test, expect } from './fixtures';

/**
 * Test: Módulo de Carga Operativa (Personal/Logística).
 * Tests the operational load module at /fiestas/nueva/carga-operativa
 */
test.describe('Módulo – Carga Operativa (Personal)', () => {
  test('muestra la página de carga operativa', async ({ authPage: page }) => {
    await page.goto('/fiestas/nueva/carga-operativa?fiestaId=test-id-e2e');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Should NOT redirect to login (auth check)
    await expect(page).not.toHaveURL('/login');

    // Page title / heading should be visible
    const heading = page.locator('[data-testid="carga-operativa-page"]');
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('muestra el módulo con sus controles principales', async ({ authPage: page }) => {
    await page.goto('/fiestas/nueva/carga-operativa?fiestaId=test-id-e2e');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Should show back navigation
    await expect(page.getByRole('link', { name: /volver/i })).toBeVisible({ timeout: 10_000 });
  });
});
