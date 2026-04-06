import { test, expect } from '@playwright/test';

/**
 * Smoke test: verifies the public landing page renders correctly.
 * This page is public (no auth required).
 */
test.describe('Smoke – Landing pública', () => {
  test('carga el landing y muestra el título principal', async ({ page }) => {
    await page.goto('/landing');

    // Verify the page loaded (title or main heading)
    await expect(page).toHaveTitle(/AK Producciones/i);

    // The hero section should be visible
    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toBeVisible();
  });

  test('muestra la sección de galería', async ({ page }) => {
    await page.goto('/landing');

    const gallery = page.locator('[data-testid="gallery-section"]');
    await expect(gallery).toBeVisible();
  });

  test('muestra la sección de videos', async ({ page }) => {
    await page.goto('/landing');

    const videos = page.locator('[data-testid="video-section"]');
    await expect(videos).toBeVisible();
  });
});
