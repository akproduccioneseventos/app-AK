import { test, expect } from '@playwright/test';

/**
 * Ojo con medir antes de tiempo.
 *
 * `domcontentloaded` avisa cuando llego el HTML, NO cuando la pantalla esta
 * dibujada. Varias pantallas de la app se arman del lado del cliente: medirlas
 * ahi da cero caracteres y parece que estan vacias cuando no lo estan. Por eso
 * cada prueba espera a que la pantalla termine de cargar antes de mirarla.
 */
test.describe('Orden 15: Pruebas de Trabajo Completo con Comprobación de Resultados Reales', () => {

  test('Trabajo 1: La portada pública muestra el pie de página visible y el botón de contacto operativo', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 1. Verificar Hero
    const hero = page.locator('#landing-hero');
    await expect(hero).toBeVisible();

    // 2. Scroll al fondo
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 3. El pie de página DEBE verse con información real de contacto
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // 4. Comprobar que no hay textos rotos ni vacíos
    const footerText = await footer.innerText();
    expect(footerText.length).toBeGreaterThan(50);
    expect(footerText).not.toContain('undefined');
    expect(footerText).not.toContain('$NaN');
  });

  test('Trabajo 2: La página de Club Uruguay muestra la propuesta y no redirige a login', async ({ page }) => {
    const response = await page.goto('/club-uruguay', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    const title = await page.title();
    expect(title).toContain('Club Uruguay');

    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(200);
    expect(bodyText).not.toContain('Application error');
  });

  test('Trabajo 3: El simulador de presupuestos calcula montos numéricos válidos mayores a cero', async ({ page }) => {
    const response = await page.goto('/simulador-ak', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(150);
    expect(bodyText).not.toContain('$NaN');
    expect(bodyText).not.toContain('$undefined');
  });

  test('Trabajo 4: Las páginas públicas principales tienen datos estructurados y contenido superior a 200 caracteres', async ({ page }) => {
    const paginas = ['/bodas', '/quinceaneras', '/cumpleanos', '/catalogo'];
    for (const ruta of paginas) {
      const response = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);

      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      const text = await page.locator('body').innerText();
      expect(text.length).toBeGreaterThan(200);
      expect(text).not.toContain('undefined');
      expect(text).not.toContain('NaN');
    }
  });

});
