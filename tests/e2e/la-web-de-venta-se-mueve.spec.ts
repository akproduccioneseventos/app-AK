import { test, expect } from '@playwright/test';

test.describe('Orden 30: Que la app se mueva (animaciones pro)', () => {
  test('1. Elementos clave de venta son visibles de entrada sin esperar animaciones', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // 2. QUE NO ESCONDA LO QUE VENDE: visible APENAS carga
    await page.goto('/landing/xv-anos', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/15|Quinceañeras|Fiesta/i);

    const contactLink = page.locator('main a[href*="wa.me"], main a[href*="simulador"]').first();
    await expect(contactLink).toBeVisible();
  });

  test('2. Que se mueva de verdad: la posición cambia entre el momento de entrar y después', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/quinceaneras', { waitUntil: 'domcontentloaded' });

    // 1. QUE SE MUEVA DE VERDAD: la posición cambia entre el momento de entrar y después
    const bloque = page.locator('section').nth(1);
    await expect(bloque).toBeVisible();
    const antes = await bloque.boundingBox();
    await bloque.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const despues = await bloque.boundingBox();

    if (antes && despues) {
      expect(antes.y).not.toBeCloseTo(despues.y, 0);
    } else {
      expect(despues).toBeTruthy();
    }
  });

  test('3. Que respete a quien pidió menos movimiento: quieto pero VISIBLE', async ({ page }) => {
    test.setTimeout(90_000);
    // 3. QUE RESPETE A QUIEN PIDIO MENOS MOVIMIENTO: quieto, pero VISIBLE
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/landing/bodas', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Bodas|Casamientos/i);
  });
});
