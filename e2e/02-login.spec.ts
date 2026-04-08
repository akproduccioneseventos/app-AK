import { test, expect } from './fixtures';
import { loginAsDemo } from './helpers/auth';

/**
 * Test: Login flow through the UI.
 * Verifies that the login page works and redirects to home.
 *
 * Requires: E2E_DEMO_PASSWORD environment variable to be set.
 * These tests are skipped in CI when E2E_DEMO_PASSWORD is not configured.
 */
test.describe('Login', () => {
  test('muestra la página de login y permite ingresar', async ({ browser }) => {
    if (!process.env.E2E_DEMO_PASSWORD) {
      test.skip(true, 'E2E_DEMO_PASSWORD not set – skipping login UI test');
    }
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
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 15_000 });
    await page.fill('[data-testid="login-email"]', 'akproduccionessalto@gmail.com');
    await page.fill('[data-testid="login-password"]', 'contraseña-incorrecta');
    await page.click('[data-testid="login-submit"]');

    // Should show error message — may be auth error or server/connection error in CI
    const errorMsg = page.locator('p.text-destructive, p[class*="destructive"], [role="alert"], .text-destructive');
    await expect(errorMsg).toBeVisible({ timeout: 15_000 });

    await context.close();
  });
});
