import { test, expect } from '@playwright/test';

/**
 * Desde el blog, "Galería de Eventos Reales" lleva a /#galeria. La portada carga la galería
 * después de abrir, así que el navegador no bajaba y quedaba arriba (Codex, 2/10/2026).
 */
test('llegar a la portada con #galeria baja hasta la galería', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#galeria', { waitUntil: 'domcontentloaded' });
  const galeria = page.locator('section#galeria');
  await expect(galeria).toBeAttached({ timeout: 30_000 });
  await expect(galeria).toBeInViewport({ timeout: 15_000 });
  // La página bajó de verdad: arriba de todo está la portada, no la galería.
  const bajo = await page.evaluate(() => window.scrollY);
  expect(bajo).toBeGreaterThan(300);
});
