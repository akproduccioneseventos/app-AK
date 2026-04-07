import { test, expect } from './fixtures';
import { loginAsDemo } from './helpers/auth';

/**
 * Test: Login flow through the UI.
 * Verifies that the login page works and redirects to home.
 *
 * Requires: E2E_DEMO_PASSWORD environment variable to be set.
 */
test.describe('Login', () => {
  test('muestra la página de login y permite ingresar', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');

    // Login form should be visible (email + password fields)
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();

    // Use the shared helper which reads E2E_DEMO_PASSWORD from env
    await loginAsDemo(page);

    // Should have navigated to home
    await expect(page).toHaveURL('/');

    await context.close();
  });

  test('muestra error con contraseña incorrecta', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.waitForSelector('[data-testid="login-email"]');
    await page.fill('[data-testid="login-email"]', 'akproduccionessalto@gmail.com');
    await page.fill('[data-testid="login-password"]', 'contraseña-incorrecta');
    await page.click('[data-testid="login-submit"]');

    // Should show error message
    const errorMsg = page.locator('p.text-destructive, p[class*="destructive"]');
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });

    await context.close();
  });
});
