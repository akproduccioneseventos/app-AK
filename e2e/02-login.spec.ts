import { test, expect } from './fixtures';

/**
 * Test: Login flow through the UI.
 * Verifies that the login page works and redirects to home.
 */
test.describe('Login', () => {
  test('muestra la página de login y permite ingresar', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');

    // Login form should be visible
    await expect(page.locator('#app-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();

    // Fill password and submit
    const password = process.env.E2E_DEMO_PASSWORD || 'SOydocenTE2124';
    await page.fill('#app-password', password);
    await page.click('button[type="submit"]');

    // Should redirect to home
    await page.waitForURL('/', { timeout: 10_000 });
    await expect(page).toHaveURL('/');

    await context.close();
  });

  test('muestra error con contraseña incorrecta', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.fill('#app-password', 'contraseña-incorrecta');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMsg = page.locator('p.text-destructive, p[class*="destructive"]');
    await expect(errorMsg).toBeVisible({ timeout: 3_000 });

    await context.close();
  });
});
