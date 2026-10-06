import { test, expect } from '@playwright/test';

/**
 * Orden 124 B (GAL73): "Galería HD" abría una tarjeta de contacto externa, sin fotos. El dueño
 * eligió (6/10/2026) que lleve a la galería de fotos de la portada. Mira el RESULTADO: la sección
 * de la galería en pantalla y sin abrir otra pestaña.
 */
test('Galería HD lleva a la galería de fotos de la portada', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const abrirMenu = page.getByRole('button', { name: 'Abrir menú' });
  if (await abrirMenu.isVisible().catch(() => false)) await abrirMenu.click();

  const pestanasAntes = context.pages().length;
  await page.getByRole('link', { name: 'Galería HD' }).filter({ visible: true }).first().click();

  const galeria = page.locator('section#landing-gallery');
  await expect(galeria).toBeInViewport({ timeout: 30_000 });
  await expect(page).toHaveURL(/#landing-gallery$/);
  expect(context.pages().length).toBe(pestanasAntes);
  await expect(galeria.locator('img').first()).toBeVisible({ timeout: 30_000 });
});
