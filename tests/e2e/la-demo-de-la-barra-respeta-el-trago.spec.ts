import { expect, test } from '@playwright/test';

test.describe('Orden 96 - Bloque 7: La demo de la barra respeta el trago elegido', () => {
  test('en la portada, pedir un trago sin alcohol y luego otro con alcohol muestra los nombres y números correctos (#42 y #43)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const techSection = page.locator('#tecnologia');
    await techSection.scrollIntoViewIfNeeded();
    await expect(techSection).toBeVisible({ timeout: 20_000 });

    const seccionApp = techSection
      .locator('[data-testid="momento-de-la-app"]', { hasText: /Barra/i })
      .first();
    await seccionApp.scrollIntoViewIfNeeded();
    await expect(seccionApp).toBeVisible({ timeout: 15_000 });

    // Activar la pestaña de Barra (insistiendo si aún está terminando de hidratar)
    await expect
      .poll(async () => {
        await seccionApp.click().catch(() => {});
        return /Fernet con Coca/i.test(await techSection.innerText());
      }, { timeout: 25_000, intervals: [500, 1_000, 2_000] })
      .toBe(true);

    // 1. Pedir Fernet con Coca en versión Sin alcohol ("Cola con naranja")
    const tarjetaFernet = techSection.getByText('Fernet con Coca').first();
    await tarjetaFernet.click();

    const botonSinAlcoholFernet = techSection.getByRole('button', { name: /Sin alcohol/i }).first();
    await expect(botonSinAlcoholFernet).toBeVisible({ timeout: 10_000 });
    await botonSinAlcoholFernet.click();

    // Debe mostrar Pedido #42: Cola con naranja
    const cartelPedido42 = techSection.getByText(/Pedido #42.*Cola con naranja/i).first();
    await expect(cartelPedido42).toContainText('Cola con naranja');
    await expect(cartelPedido42).toContainText('#42');

    // Debe pasar a "Listo para retirar"
    await expect(techSection.getByText(/Listo para retirar/i).first()).toContainText('Listo para retirar', { timeout: 10_000 });

    // 2. Elegir Daiquiri de frutilla y pedirlo Con alcohol
    const tarjetaDaiquiri = techSection.getByText('Daiquiri de frutilla').first();
    await tarjetaDaiquiri.click();

    const botonConAlcohol = techSection.getByRole('button', { name: /^Con alcohol$/i }).first();
    await expect(botonConAlcohol).toBeVisible({ timeout: 10_000 });
    await botonConAlcohol.click();

    // Debe mostrar Pedido #43: Daiquiri de frutilla
    const cartelPedido43 = techSection.getByText(/Pedido #43.*Daiquiri de frutilla/i).first();
    await expect(cartelPedido43).toContainText('Daiquiri de frutilla');
    await expect(cartelPedido43).toContainText('#43');
  });
});
