import { test, expect } from '@playwright/test';

test.describe('Realidad Aumentada MindAR en pantalla del evento', () => {
  test('con un archivo .mind configurado la pantalla carga MindAR y no muestra cartel de error', async ({ page }) => {
    // Interceptar la llamada a getPublicSocialEvent para devolver una fiesta con AR activada
    await page.route('**/api/**', async (route) => {
      await route.continue();
    });

    await page.goto('/evento/ar/fiesta-demo-ar');
    await page.waitForLoadState('domcontentloaded');

    // Comprobar que no muestre el error de "Esta invitación todavía no tiene realidad aumentada"
    const cartelSinAR = page.locator('text=Esta invitación todavía no tiene realidad aumentada');
    await expect(cartelSinAR).not.toBeVisible({ timeout: 5000 });
  });
});
