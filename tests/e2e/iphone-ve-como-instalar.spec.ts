import { expect, test } from '@playwright/test';

/**
 * Orden 189 - Bloque 2: La app instalable en iPhone
 * En Safari de iPhone, la PWA no tiene beforeinstallprompt.
 * El botón debe mostrar la guía con el texto 'Agregar a inicio'.
 */

test.describe('iPhone ve cómo instalar la app', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test('muestra la guía con Agregar a inicio en Safari de iPhone', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByText('Agregar a inicio')).toBeVisible();
  });
});
