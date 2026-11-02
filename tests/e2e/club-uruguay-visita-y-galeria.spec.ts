import { test, expect } from '@playwright/test';

test.describe('Orden 248: Club Uruguay - Visita, espacios y galería accesible', () => {
  test('la página de Club Uruguay presenta la estructura de 7 bandas verificada', async ({ page }) => {
    await page.goto('/club-uruguay');

    // BANDA 1: Portada con H1 literal y dirección Uruguay 754
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Club Uruguay Salto');

    await expect(page.getByText('Uruguay 754').first().first()).toBeVisible();
    await expect(page.getByText('50 a 250 personas').first().first()).toBeVisible();

    // CTAs principales en portada
    const waButtonHero = page.locator('a:has-text("Coordinar visita por WhatsApp")').first();
    await expect(waButtonHero).toBeVisible();
    await expect(waButtonHero).toHaveAttribute('href', /wa\.me/);

    const simButtonHero = page.locator('a:has-text("Calcular presupuesto")').first();
    await expect(simButtonHero).toBeVisible();
    await expect(simButtonHero).toHaveAttribute('href', '/simulador-de-presupuesto?salon=club');

    // BANDA 2: Dos espacios comparables (Salón Principal y Espacio Íntimo)
    await expect(page.getByRole('heading', { name: 'Salón Principal', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Espacio Íntimo', exact: true })).toBeVisible();
    await expect(page.getByText('Hasta ~250 personas', { exact: true })).toBeVisible();
    await expect(page.getByText('Hasta ~50 personas').first()).toBeVisible();

    // BANDA 3: Galería real con captions descriptivos fuera de la foto
    await expect(page.locator('h2:has-text("Galería real de montajes en Club Uruguay")')).toBeVisible();
    const photos = page.locator('#galeria figure');
    await expect(photos).toHaveCount(3);

    // Lightbox accesible: click abre visor, Escape lo cierra
    const firstPhoto = page.locator('#galeria figure div[role="button"]').first();
    await firstPhoto.click();

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Foto 1 de 3')).toBeVisible();

    // Cierre mediante teclado (Escape)
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // BANDA 4: Historia y patrimonio (150 aniversario 2025 y mural)
    await expect(page.getByText('150 aniversario en 2025').first()).toBeVisible();
    await expect(page.getByText('mural patrimonial').first()).toBeVisible();

    // BANDA 5: Ubicación céntrica
    await expect(page.locator('h2:has-text("Ubicación céntrica en Uruguay 754")')).toBeVisible();
    const mapsLink = page.locator('a:has-text("Abrir en Google Maps")');
    await expect(mapsLink).toBeVisible();
    await expect(mapsLink).toHaveAttribute('href', /google\.com\/maps/);

    // BANDA 6: Organización integral con AK (tecnología visible y 50% de bonificación)
    await expect(page.locator('h2:has-text("Organización integral con AK Producciones")')).toBeVisible();
    await expect(page.getByText('Fotocabina QR').first()).toBeVisible();
    await expect(page.getByText('Plataforma 360°').first()).toBeVisible();
    await expect(page.getByText('Espejo Mágico').first()).toBeVisible();
    await expect(page.getByText('50% de bonificación en el alquiler del salón').first()).toBeVisible();

    // BANDA 7: FAQ corta y cierre con CTAs
    await expect(page.locator('h2:has-text("Preguntas frecuentes sobre Club Uruguay")')).toBeVisible();
    await expect(page.locator('details')).toHaveCount(4);

    const waClosing = page.locator('section:last-of-type a:has-text("Coordinar visita por WhatsApp")');
    await expect(waClosing).toBeVisible();
  });

  test('no presenta desbordes horizontales en resoluciones móviles y de escritorio', async ({ page }) => {
    const viewports = [
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/club-uruguay');
      await page.waitForLoadState('domcontentloaded');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(isOverflowing).toBe(false);
    }
  });
});
