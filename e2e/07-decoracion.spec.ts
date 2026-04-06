import { test, expect } from './fixtures';

/**
 * Test: Módulo de Decoración.
 * Tests the decoration module at /fiestas/nueva/decoracion
 */
test.describe('Módulo – Decoración', () => {
  test('muestra la página de decoración', async ({ authPage: page }) => {
    await page.goto('/fiestas/nueva/decoracion?fiestaId=test-id-e2e');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Should NOT redirect to login
    await expect(page).not.toHaveURL('/login');

    // Page should render with testid
    const pageContainer = page.locator('[data-testid="decoracion-page"]');
    await expect(pageContainer).toBeVisible({ timeout: 10_000 });
  });

  test('muestra estilos de decoración disponibles', async ({ authPage: page }) => {
    await page.goto('/fiestas/nueva/decoracion?fiestaId=test-id-e2e');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Style selector section should appear
    const stylesSection = page.locator('[data-testid="decoracion-estilos"]');
    await expect(stylesSection).toBeVisible({ timeout: 10_000 });
  });

  test('permite seleccionar un estilo de decoración', async ({ authPage: page }) => {
    await page.goto('/fiestas/nueva/decoracion?fiestaId=test-id-e2e');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Click on an estilo card
    const estiloCards = page.locator('[data-testid^="estilo-card-"]');
    const firstCard = estiloCards.first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    await firstCard.click();

    // Verify something changed (e.g. selected class or aria state)
    // The card should now be selected
    await expect(firstCard).toHaveAttribute('data-selected', 'true');
  });
});
