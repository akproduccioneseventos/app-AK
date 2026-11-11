import { expect, test } from '@playwright/test';

/**
 * Orden 277 — Bloque 2:
 * En /bodas el enlace "Consultar disponibilidad de fecha" tiene tipo=Bodas,
 * en /cumpleanos tipo=Sociales y en la portada sigue tipo=15%20A.
 */

test.describe('Orden 277: Las landings arrancan con su evento correspondiente', () => {
  test('el enlace de disponibilidad en /bodas tiene tipo=Bodas', async ({ page }) => {
    await page.goto('/bodas', { waitUntil: 'domcontentloaded' });
    const link = page.getByRole('link', { name: /Consultar disponibilidad de fecha/i }).first();
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toContain('tipo=Bodas');
  });

  test('el enlace de disponibilidad en /cumpleanos tiene tipo=Sociales', async ({ page }) => {
    await page.goto('/cumpleanos', { waitUntil: 'domcontentloaded' });
    const link = page.getByRole('link', { name: /Consultar disponibilidad de fecha/i }).first();
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toContain('tipo=Sociales');
  });

  test('el enlace de disponibilidad en la portada sigue con tipo=15%20A', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const link = page.getByRole('link', { name: /Consultar disponibilidad de fecha/i }).first();
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toMatch(/tipo=15(%20|\+)A/i);
  });
});
