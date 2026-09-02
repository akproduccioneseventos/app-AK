import { test, expect } from '@playwright/test';

test.describe('Orden 27: La Vidriera de la Tecnología', () => {
  test('La vidriera interactiva está presente en la portada y responde a la interacción', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});

    // 1. Comprobar que la sección de tecnología interactiva está en la portada.
    //
    // OJO: hay que BAJAR primero. La portada dibuja cada sección cuando llega a
    // la pantalla —son las animaciones al bajar de la orden 30—, así que
    // buscarla sin bajar da "no está" aunque esté.
    const vidriera = page.locator('#vidriera-tecnologica');
    await vidriera.scrollIntoViewIfNeeded({ timeout: 60_000 });
    await expect(vidriera).toBeVisible({ timeout: 30_000 });

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
    test.setTimeout(180_000);
    await page.goto('/public/xv-anos', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});

    const vidriera = page.locator('#vidriera-tecnologica');
    await vidriera.scrollIntoViewIfNeeded({ timeout: 60_000 });
    await expect(vidriera).toBeVisible({ timeout: 30_000 });
    await expect(vidriera).toContainText('Fotocabina Digital');
  });
});
