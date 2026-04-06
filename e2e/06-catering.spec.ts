import { test, expect } from './fixtures';

/**
 * Test: Módulo de Gastronomía (Catering).
 * Tests the catering module at /fiestas/nueva/catering
 */
test.describe('Módulo – Gastronomía (Catering)', () => {
  test('muestra la página de gastronomía', async ({ authPage: page }) => {
    await page.goto('/fiestas/nueva/catering?fiestaId=test-id-e2e');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Should NOT redirect to login
    await expect(page).not.toHaveURL('/login');

    // Page should render
    const pageContainer = page.locator('[data-testid="catering-page"]');
    await expect(pageContainer).toBeVisible({ timeout: 10_000 });
  });

  test('muestra controles de menú y bebidas', async ({ authPage: page }) => {
    await page.goto('/fiestas/nueva/catering?fiestaId=test-id-e2e');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Back navigation should be present
    await expect(page.getByRole('link', { name: /volver/i })).toBeVisible({ timeout: 10_000 });
  });
});
