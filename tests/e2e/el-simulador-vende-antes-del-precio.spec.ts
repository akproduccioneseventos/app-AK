import { expect, test, type Page } from '@playwright/test';

async function assertWelcomeScreen(page: Page, isMobile: boolean) {
  await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

  const hero = page.getByTestId('simulator-welcome-hero');
  await expect(hero).toBeVisible({ timeout: 20_000 });

  // Un solo botón de acción en la parte superior ("Armar mi presupuesto gratis")
  const heroButtons = hero.getByRole('button', { name: /Armar mi presupuesto gratis/i });
  await expect(heroButtons).toHaveCount(1);
  await expect(heroButtons.first()).toBeVisible();
  await expect(heroButtons.first()).toBeEnabled({ timeout: 60_000 });

  // Textos clave arriba sin bajar
  await expect(hero).toContainText('Tu fiesta, sin dolores de cabeza.');
  await expect(hero).toContainText('2 minutos');
  await expect(hero).toContainText('Sin compromiso');
  await expect(hero).toContainText('Válido 30 días');

  // Franja de confianza con +200
  const trustStrip = page.getByTestId('simulator-trust-strip');
  await expect(trustStrip).toBeVisible();
  await expect(trustStrip).toContainText('+200');
  await expect(trustStrip).toContainText('+7');

  // Seis tarjetas de miedo
  await expect(page.getByRole('heading', { name: /Tu miedo, nuestra respuesta/i })).toBeVisible();
  await expect(page.getByTestId('simulator-fear-card')).toHaveCount(6);

  // Sin clases bg-indigo en toda la pantalla
  await expect(page.locator('[class*="bg-indigo"]')).toHaveCount(0);

  if (isMobile) {
    // Al scrollear hasta el pie, aparece la barra fija inferior en celular
    await page.getByTestId('simulator-welcome-bottom-cta').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('simulator-welcome-sticky-bar')).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // Clic en el botón principal lleva directo a Datos del evento (Paso 1 de 4)
  await heroButtons.first().click();
  await expect(page.getByText(/Paso 1 de 4/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#simulator-name')).toBeVisible();
  await expect(page.locator('[class*="bg-indigo"]')).toHaveCount(0);
}

test.describe('Orden 343 — El simulador vende antes del precio', () => {
  test('en escritorio muestra una sola bienvenida con 6 tarjetas, +200, sin bg-indigo y entra directo a Datos', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await assertWelcomeScreen(page, false);
  });

  test('en celular (390x844) muestra el botón arriba sin bajar, barra fija al scrollear y entra directo a Datos', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await assertWelcomeScreen(page, true);
  });

  test('con prefers-reduced-motion: reduce todo sigue visible sin animación', async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    const h1 = page.locator('h1').first();
    const cta = page.getByTestId('simulator-cover-start');
    await expect(h1).toBeVisible({ timeout: 20_000 });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled({ timeout: 60_000 });

    const h1Opacity = await h1.evaluate((el) => getComputedStyle(el).opacity);
    const ctaOpacity = await cta.evaluate((el) => getComputedStyle(el).opacity);
    expect(h1Opacity).toBe('1');
    expect(ctaOpacity).toBe('1');
  });
});
