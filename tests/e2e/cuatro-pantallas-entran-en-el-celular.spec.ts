import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';

/**
 * Orden 288 — Bloque 8: Celular (390 px)
 *
 * Verifica que las cuatro pantallas críticas para el staff se ajusten
 * a una pantalla de celular de 390 px sin provocar scroll horizontal
 * (scrollWidth <= clientWidth).
 */

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

function createSessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}.${encodeURIComponent(
    JSON.stringify({
      email: 'admin@akproducciones.com',
      role: 'admin',
      userId: 'admin',
      perfil: 'dueno',
    }),
  )}`;
  return encodeURIComponent(
    `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`,
  );
}

const CUATRO_PANTALLAS = [
  '/settings/whatsapp',
  '/empresa/landing-editor',
  '/empresa/contabilidad/gastos',
  '/settings/templates',
];

test.describe('Cuatro pantallas entran en el celular a 390px (Orden 288, Bloque 8)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a 390px cada pantalla tiene scrollWidth <= clientWidth', async ({ page, context, baseURL }) => {
    test.setTimeout(120_000);

    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });

    await context.addCookies([
      {
        name: 'ak_session',
        value: createSessionToken(),
        url: baseURL || 'http://localhost:3000',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    for (const ruta of CUATRO_PANTALLAS) {
      await page.setViewportSize({ width: 390, height: 844 });
      const response = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${ruta} respondió con código de error`).toBeLessThan(400);

      await page.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const { scrollWidth, clientWidth } = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        return {
          scrollWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
          clientWidth: doc.clientWidth,
        };
      });

      // Margen de 1px por subpíxeles de renderizado
      expect(
        scrollWidth,
        `La pantalla ${ruta} desborda en celular de 390px: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`,
      ).toBeLessThanOrEqual(clientWidth + 1);
    }
  });
});
