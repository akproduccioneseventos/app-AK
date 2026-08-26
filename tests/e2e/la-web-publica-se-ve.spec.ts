import { test, expect } from '@playwright/test';
import { PAGINAS_PARA_GOOGLE } from '../../src/lib/seo/paginas-publicas';

test.describe('La web pública se ve — Prueba de visibilidad real y SEO', () => {
  test('La portada muestra todas las secciones hasta el pie de página y el botón de contacto es visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verificar que el Hero está visible
    const hero = page.locator('#landing-hero');
    await expect(hero).toBeVisible();

    // Scroll hasta el final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // El pie de página y el botón de contacto deben estar en el viewport y ser visibles
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const ctaSection = page.locator('#landing-cta-footer');
    await expect(ctaSection).toBeVisible();
  });

  test('Las páginas públicas tienen título y descripción válidos, y no redirigen a login', async ({ page }) => {
    for (const ruta of PAGINAS_PARA_GOOGLE.slice(0, 8)) {
      const response = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);

      // No debe redirigir al login
      expect(page.url()).not.toContain('/login');
      expect(page.url()).not.toContain('/ingreso');

      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(5);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.trim().length).toBeGreaterThan(15);
    }
  });

  test('La dirección canónica apunta a la página misma', async ({ page }) => {
    const rutasMuestreo = ['/bodas', '/quinceaneras', '/cumpleanos', '/catalogo', '/club-uruguay'];
    for (const ruta of rutasMuestreo) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain(ruta);
    }
  });
});
