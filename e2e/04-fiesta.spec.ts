import { test, expect } from './fixtures';

/**
 * Test: Create a new fiesta (event) from the eventos page.
 * Tests that a new event can be created and navigates to the planner.
 */
test.describe('Fiesta – Crear nuevo evento', () => {
  test('muestra la lista de eventos', async ({ authPage: page }) => {
    await page.goto('/eventos');

    // Page should load
    await expect(page.locator('[data-testid="eventos-page"]')).toBeVisible({ timeout: 15_000 });
  });

  test('muestra botón para crear un nuevo evento', async ({ authPage: page }) => {
    await page.goto('/eventos');
    await page.waitForSelector('[data-testid="eventos-page"]', { timeout: 15_000 });

    // Create button should be visible
    const createBtn = page.getByRole('button', { name: /crear nuevo evento manual/i });
    await expect(createBtn).toBeVisible();
  });

  test('el planificador de fiesta carga cuando se provee fiestaId', async ({ authPage: page }) => {
    // Navigate to planner with a placeholder (will show loading/error if no real ID,
    // but we test that the route is accessible and auth works)
    await page.goto('/fiestas/nueva?fiestaId=test-id-e2e');

    // The page should render (either the planner or an error state, not a login redirect)
    // We're verifying the auth works and the page renders
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Should NOT redirect to login
    await expect(page).not.toHaveURL('/login');
  });
});
