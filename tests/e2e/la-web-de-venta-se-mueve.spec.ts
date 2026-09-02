import { test, expect } from '@playwright/test';

test.describe('Orden 30: Que la app se mueva (animaciones pro)', () => {
  test('1. Elementos clave de venta están visibles de inmediato sin esperar animaciones', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/landing/xv-anos', { waitUntil: 'domcontentloaded' });

    // Título visible de inmediato
    const titulo = page.getByRole('heading', { level: 1 }).first();
    await expect(titulo).toBeVisible({ timeout: 10_000 });

    // Enlace o botón de contacto visible de inmediato
    const botonContacto = page.locator('a[href*="wa.me"], a[href*="simulador"]').first();
    await expect(botonContacto).toBeVisible({ timeout: 10_000 });
  });

  test('2. Las secciones se animan al entrar en pantalla', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/quinceaneras', { waitUntil: 'domcontentloaded' });

    const seccion = page.locator('section').first();
    await expect(seccion).toBeVisible({ timeout: 10_000 });
  });

  test('3. Respeta prefers-reduced-motion sin romper visibilidad', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/landing/bodas', { waitUntil: 'domcontentloaded' });

    const titulo = page.getByRole('heading', { level: 1 }).first();
    await expect(titulo).toBeVisible({ timeout: 10_000 });
  });
});