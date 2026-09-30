import { expect, test } from '@playwright/test';

test.describe('Orden 96 - Bloque 7: La demo de la barra respeta el trago elegido', () => {
  test('en la portada, pedir el Citrus Mocktail y luego el Mojito muestra los nombres y números correctos', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Navegar hasta el botón de la pestaña "Barra & Cócteles"
    // El texto está dentro de un <p> que vive adentro del <button> con data-testid="momento-de-la-app".
    // Hay que hacer click en el botón, no en el texto hijo, para que el evento llegue al handler correcto.
    const seccionApp = page
      .locator('[data-testid="momento-de-la-app"]', { hasText: 'Barra & Cócteles' })
      .first();
    await seccionApp.scrollIntoViewIfNeeded();
    await expect(seccionApp).toBeVisible({ timeout: 15_000 });

    // Activar la pestaña de "Barra & Cócteles"
    await seccionApp.click();

    // 1. Pedir Citrus Mocktail (Sin Alcohol)
    const botonCitrus = page.locator('div', { hasText: 'Citrus Mocktail (Sin Alcohol)' })
      .locator('button', { hasText: 'Pedir en barra' })
      .first();
    await expect(botonCitrus).toBeVisible({ timeout: 10_000 });
    await botonCitrus.click();

    // Debe mostrar Pedido #42 y Citrus Mocktail
    const cartelPedido42 = page.locator('text=Pedido #42: Citrus Mocktail').first();
    await expect(cartelPedido42).toContainText('Citrus Mocktail');
    await expect(cartelPedido42).toContainText('#42');

    // Debe pasar por "En preparación" y luego "Listo para retirar"
    await expect(page.locator('text=Listo para retirar').first()).toContainText('Listo para retirar');

    // 2. Pedir Mojito de Maracuyá
    const botonMojito = page.locator('div', { hasText: 'Mojito de Maracuyá' })
      .locator('button', { hasText: 'Pedir en barra' })
      .first();
    await expect(botonMojito).toContainText('Pedir en barra');
    await botonMojito.click();

    // Debe mostrar Pedido #43 y Mojito de Maracuyá
    const cartelPedido43 = page.locator('text=Pedido #43: Mojito de Maracuyá').first();
    await expect(cartelPedido43).toContainText('Mojito de Maracuyá');
    await expect(cartelPedido43).toContainText('#43');
  });
});
