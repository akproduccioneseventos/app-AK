import { test, expect } from '@playwright/test';

test.describe('Orden 27: La Vidriera de la Tecnología', () => {
  test('La vidriera interactiva está presente en la portada y responde a la interacción', async ({ page }) => {
    await page.goto('/');

    // 1. Comprobar que la sección de tecnología interactiva está en la portada
    const vidriera = page.locator('#vidriera-tecnologica');
    await expect(vidriera).toBeVisible();

    // 2. Comprobar que muestra el título y las estaciones
    await expect(vidriera).toContainText('Tecnología Interactiva');
    await expect(vidriera).toContainText('Fotocabina Digital');

    // 3. Cambiar de estación interactiva
    const boton360 = vidriera.getByRole('button', { name: /Plataforma 360/i });
    if (await boton360.isVisible()) {
      await boton360.click();
      await expect(vidriera).toContainText('Video Dinámico HD');
    }
  });

  test('La vidriera interactiva está presente en las páginas de venta por tipo de evento', async ({ page }) => {
    await page.goto('/public/xv-anos');

    const vidriera = page.locator('#vidriera-tecnologica');
    await expect(vidriera).toBeVisible();
    await expect(vidriera).toContainText('Fotocabina Digital');
  });
});
