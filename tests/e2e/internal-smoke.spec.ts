import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

function createSessionToken() {
  const version = 'v1';
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const nonce = crypto.randomUUID();
  // The legacy four-part format is still supported and avoids cookie-value
  // encoding differences between Chromium and Next.js during browser tests.
  const payload = `${version}.${expiresAt}.${nonce}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

test.beforeEach(async ({ context, baseURL }) => {
  if (!baseURL) throw new Error('Playwright baseURL no configurada.');
  await context.addCookies([
    {
      name: 'ak_session',
      value: createSessionToken(),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
});

test('core internal modules load with an authenticated session', async ({ context, page }) => {
  test.setTimeout(240_000);
  const routes = [
    '/empresa/dashboard',
    '/empresa/contabilidad',
    '/pagos-rapidos',
    '/presupuestos',
    '/customers',
    '/eventos',
  ];

  for (const route of routes) {
    const response = await context.request.get(route);
    expect(response.status(), `${route} debe responder sin error HTTP`).toBeLessThan(400);

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    expect(page.url(), `${route} no debe expulsar una sesion valida`).not.toContain('/login');

    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/Application error|Internal Server Error|no puede cargar los datos del panel/i);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(2);
});
