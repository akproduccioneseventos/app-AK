import { test, expect } from '@playwright/test';

/**
 * Desde el blog, "Galería de Eventos Reales" lleva a /#landing-gallery. La portada carga la galería
 * después de abrir, así que el navegador no bajaba y quedaba arriba (Codex, 2/10/2026).
 */
test('llegar a la portada con #landing-gallery baja hasta la galería', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#landing-gallery', { waitUntil: 'domcontentloaded' });
  const galeria = page.locator('section#landing-gallery');
  await expect(galeria).toBeAttached({ timeout: 30_000 });
  await expect(galeria).toBeInViewport({ timeout: 15_000 });
  // La página bajó de verdad: arriba de todo está la portada, no la galería.
  const bajo = await page.evaluate(() => window.scrollY);
  expect(bajo).toBeGreaterThan(300);
});
