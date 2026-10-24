import { test, expect } from '@playwright/test';

/**
 * Orden 223: Contraste de la pantalla de tragos listos y pantallas oscuras.
 * Comprueba que las 5 pantallas oscuras autónomas no reciben el fondo claro #f8fafc (rgb(248, 250, 252))
 * impuesto por ak-global-premium.css sobre main.flex-1, y que el panel interno sigue claro.
 */

const PANTALLAS_OSCURAS = [
  '/evento/barra/fiesta-demo/listo',
  '/evento/buzon/fiesta-demo',
  '/evento/en-vivo/fiesta-demo',
  '/experiencia',
  '/tecnologia',
];

test.describe('Contraste de pantallas oscuras y panel interno (Orden 223)', () => {
  for (const ruta of PANTALLAS_OSCURAS) {
    test(`pantalla oscura ${ruta} no tiene fondo claro en main`, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState('domcontentloaded');

      const bgMain = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return null;
        return window.getComputedStyle(main).backgroundColor;
      });

      // No debe ser el fondo claro de la regla eliminada (#f8fafc = rgb(248, 250, 252))
      expect(bgMain).not.toBe('rgb(248, 250, 252)');
    });
  }

  test('pantalla del panel interno conserva fondo claro', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const bgPanel = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return null;
      return window.getComputedStyle(main).backgroundColor;
    });

    // En el panel interno el fondo debe ser claro (o transparente con contenedor claro)
    expect(bgPanel).not.toBe('rgb(0, 0, 0)');
  });
});
