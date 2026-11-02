import { expect, test } from '@playwright/test';

test.describe('Orden 246: La sección de la app se entiende', () => {
  test('en 390x844 se ven las 5 pestañas sin desplazar de costado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const seccionTecnologia = page.locator('#tecnologia');
    await seccionTecnologia.scrollIntoViewIfNeeded();
    await expect(seccionTecnologia).toBeVisible();

    const tabs = seccionTecnologia.locator('[data-testid="momento-de-la-app"]');
    await expect(tabs).toHaveCount(5);

    // Verificar que todas las pestañas están dentro del ancho de la pantalla (sin desborde horizontal)
    for (let i = 0; i < 5; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toBeVisible();
      const box = await tab.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(390 + 5); // dentro del viewport con margen mínimo
        expect(box.height).toBeGreaterThanOrEqual(44); // mínimo 44px de alto para tacto celular
      }
    }
  });

  test('tocar Barra muestra foto de un trago real y tocar Fernet sin alcohol muestra Cola con naranja', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const seccionTecnologia = page.locator('#tecnologia');
    await seccionTecnologia.scrollIntoViewIfNeeded();

    // Tocar pestaña Barra
    const tabBarra = seccionTecnologia.getByRole('button', { name: /Barra/i }).first();
    await tabBarra.click();

    // Muestra foto de un trago real (/images/tragos/)
    const imagenTrago = seccionTecnologia.locator('img[src*="/images/tragos/"]').first();
    await expect(imagenTrago).toBeVisible();

    // Tocar Fernet con Coca
    const tragoFernet = seccionTecnologia.getByText(/Fernet con Coca/i).first();
    await expect(tragoFernet).toBeVisible();
    await tragoFernet.click();

    // Aparece y se toca "Sin alcohol"
    const botonSinAlcohol = seccionTecnologia.getByRole('button', { name: /Sin alcohol/i }).first();
    await expect(botonSinAlcohol).toBeVisible();
    await botonSinAlcohol.click();

    // Muestra "Cola con naranja"
    await expect(seccionTecnologia.getByText(/Cola con naranja/i).first()).toBeVisible();
  });

  test('la sección no contiene textos viejos ni plazos prometidos', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const seccionTecnologia = page.locator('#tecnologia');
    await seccionTecnologia.scrollIntoViewIfNeeded();

    await expect(seccionTecnologia).not.toContainText('DEMO EN VIVO');
    await expect(seccionTecnologia).not.toContainText('sin fricción');
    await expect(seccionTecnologia).not.toContainText('al día siguiente');
    await expect(seccionTecnologia).not.toContainText('Modo seguro');
  });
});
