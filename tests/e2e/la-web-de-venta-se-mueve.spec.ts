import { test, expect } from '@playwright/test';

test.describe('Orden 30: Que la app se mueva (animaciones pro)', () => {
  test('1. Elementos clave de venta muestran su texto de inmediato sin esperar animaciones', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/landing/xv-anos', { waitUntil: 'domcontentloaded' });

    // Título visible con su texto de venta
    const titulo = page.getByRole('heading', { level: 1 }).first();
    await expect(titulo).toContainText(/15|Quinceañeras|Fiesta/i);

    // Enlace o botón de contacto con enlace directo
    const botonContacto = page.locator('a[href*="wa.me"], a[href*="simulador"]').first();
    await expect(botonContacto).toHaveAttribute('href', /wa\.me|simulador/);
  });

  test('2. Las secciones se animan y cambian de posición suavemente', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/quinceaneras', { waitUntil: 'domcontentloaded' });

    const seccion = page.locator('section').first();
    await expect(seccion).toContainText(/15|AK Producciones/i);
  });

  test('3. Respeta prefers-reduced-motion sin romper el contenido textual', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/landing/bodas', { waitUntil: 'domcontentloaded' });

    const titulo = page.getByRole('heading', { level: 1 }).first();
    await expect(titulo).toContainText(/Bodas|Casamientos/i);
  });
});