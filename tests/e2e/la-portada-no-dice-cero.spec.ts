import { expect, test } from '@playwright/test';

test.describe('Orden 96 - Bloque 2: Los números de la portada no dicen cero', () => {
  test('el HTML que llega del servidor contiene los números finales y no arranca en cero', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const respuesta = await request.get('/');
    expect(respuesta.status()).toBeLessThan(400);

    const html = await respuesta.text();

    // El servidor no manda "+0 " ni "0/7"
    expect(html).not.toMatch(/\+0\s/);
    expect(html).not.toMatch(/0\/7/);

    // Contiene la cifra oficial de eventos realizados (+200)
    expect(html).toContain('+200');
  });

  test('al scrollear hasta las tarjetas de estadísticas se ven los números reales', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const tarjetaEventos = page.locator('text=Eventos realizados').first();
    await tarjetaEventos.scrollIntoViewIfNeeded();

    await expect(tarjetaEventos).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('body')).toContainText('+200');
    await expect(page.locator('body')).not.toContainText('+0 eventos');
  });
});
