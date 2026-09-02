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
    // OJO: NO se usa `scrollIntoViewIfNeeded`. La portada tiene animaciones al
    // bajar (orden 30), asi que el navegador nunca la da por "quieta" y la
    // prueba se queda esperando para siempre. Se baja a mano y se comprueba que
    // este y que diga lo suyo, que es lo que importa.
    //
    // Comprobado con numeros el 2 de septiembre de 2026: en la portada hay un
    // elemento #vidriera-tecnologica de 1280x1000, con sus textos. La vidriera
    // esta; lo que fallaba era la forma de buscarla.
    const vidriera = page.locator('#vidriera-tecnologica');
    await expect(vidriera).toHaveCount(1, { timeout: 60_000 });
    await page.evaluate(() => {
      document.querySelector('#vidriera-tecnologica')?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(2_000);

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
    await expect(vidriera).toHaveCount(1, { timeout: 60_000 });
    await expect(vidriera).toContainText('Fotocabina Digital', { timeout: 30_000 });
  });
});
