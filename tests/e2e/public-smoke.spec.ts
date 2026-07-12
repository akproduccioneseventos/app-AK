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
  test.setTimeout(180_000);

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

test('public homepage fits the viewport without horizontal overflow', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  const mainHeading = page.getByRole('heading', { level: 1 });
  await expect(mainHeading).toHaveCount(1);
  await expect(mainHeading).toBeVisible();
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test('simulator input keeps typed text visible and the flow fits the viewport', async ({ page }) => {
  await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
  const startButton = page.getByRole('button', { name: 'Comenzar mi presupuesto' });
  await expect(startButton).toBeVisible();
  await startButton.click();

  const continueButton = page.getByRole('button', { name: 'Continuar' });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  const nameInput = page.locator('#simulator-name');
  await expect(nameInput).toBeVisible();
  await nameInput.fill('Ana García');
  await expect(nameInput).toHaveValue('Ana García');

  const inputInk = await nameInput.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, opacity: style.opacity, caretColor: style.caretColor };
  });
  expect(inputInk.color).not.toBe('transparent');
  expect(inputInk.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(Number(inputInk.opacity)).toBeGreaterThan(0);
  expect(inputInk.caretColor).not.toBe('transparent');

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});
