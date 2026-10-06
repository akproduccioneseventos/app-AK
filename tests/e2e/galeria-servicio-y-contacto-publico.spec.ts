import { test, expect } from '@playwright/test';

/**
 * Orden 125 (auditoría 74): Privacidad mostraba un correo como número de WhatsApp, y la galería
 * vendía un toro mecánico como "Glitter bar". Mira lo que ve el visitante.
 */
test('Privacidad da un WhatsApp que es un número de teléfono', async ({ page }) => {
  await page.goto('/privacidad', { waitUntil: 'domcontentloaded' });
  const parrafo = page.getByText(/contactarnos directamente por WhatsApp al/);
  await expect(parrafo).toBeVisible({ timeout: 30_000 });
  const numero = (await parrafo.locator('strong').first().textContent())?.trim() || '';
  expect(numero).not.toContain('@');
  expect(numero.replace(/\D/g, '').length).toBeGreaterThanOrEqual(8);
});

test('la galería de la portada no muestra el toro mecánico como glitter bar', async ({ page }) => {
  await page.goto('/#landing-gallery', { waitUntil: 'domcontentloaded' });
  const galeria = page.locator('section#landing-gallery');
  await expect(galeria.locator('img').first()).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('img[src*="glitter-bar-01"]')).toHaveCount(0);
  await expect(galeria.getByText('Glitter bar', { exact: true })).toHaveCount(0);
});
