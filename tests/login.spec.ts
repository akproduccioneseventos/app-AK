import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('shows the login form', async ({ page }) => {
    await page.goto('/login');

    // Verify that the login form elements are visible
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-email').fill('fake@example.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();

    // The page should display an error message (not redirect)
    await expect(page.locator('text=Correo o contraseña incorrectos')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('redirects unauthenticated users to /login', async ({ page }) => {
    // Trying to access a protected route without a session should redirect to /login
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
