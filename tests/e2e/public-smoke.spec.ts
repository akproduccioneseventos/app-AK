import { expect, test } from '@playwright/test';

test('health endpoint responds without exposing internal failures', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({
    status: 'ok',
    services: {
      firebase: expect.any(Boolean),
      gemini: expect.any(Boolean),
    },
  });
});

test('protected access screen remains usable', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Acceso Protegido', { exact: true })).toBeVisible();
  await expect(page.getByTestId('login-password')).toBeVisible();
  await expect(page.getByTestId('login-submit')).toBeEnabled();
  await expect(page.getByRole('button', { name: /Olvide mi contrase/i })).toBeVisible();
});

test('manual budget simulator remains publicly reachable', async ({ page }) => {
  const response = await page.goto('/simulador-de-presupuesto', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  expect(page.url()).toContain('/simulador-de-presupuesto');
  await expect(page.locator('body')).toBeVisible();
});
