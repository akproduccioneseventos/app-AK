import { test, expect } from '@playwright/test';

/**
 * Test: Galería pública en el landing.
 * Tests the public gallery at /landing (no auth required)
 */
test.describe('Galería – Landing público', () => {
  test('muestra la galería de fotos en el landing', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    // Title should be visible
    await expect(page).toHaveTitle(/AK Producciones/i);

    // Gallery section
    const gallery = page.locator('[data-testid="gallery-section"]');
    await expect(gallery).toBeVisible({ timeout: 15_000 });
  });

  test('muestra la sección de videos en el landing', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle', { timeout: 20_000 });

    const videos = page.locator('[data-testid="video-section"]');
    await expect(videos).toBeVisible({ timeout: 15_000 });
  });

  test('muestra el hero del landing con el CTA', async ({ page }) => {
    await page.goto('/landing');

    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toBeVisible({ timeout: 15_000 });

    // CTA button (WhatsApp or cotizar) should be present
    const ctaButton = page.locator('[data-testid="hero-cta-button"]');
    await expect(ctaButton).toBeVisible({ timeout: 10_000 });
  });

  test('muestra la sección de servicios', async ({ page }) => {
    await page.goto('/landing');

    const services = page.locator('[data-testid="services-section"]');
    await expect(services).toBeVisible({ timeout: 15_000 });
  });
});
