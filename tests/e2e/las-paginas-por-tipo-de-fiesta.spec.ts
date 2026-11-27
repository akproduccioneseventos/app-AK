import { expect, test } from '@playwright/test';

const PAGINAS_TIPO = [
  { ruta: '/bodas', palabraTipo: /boda|casamiento/i, tipoRegex: /Boda/i },
  { ruta: '/quinceaneras', palabraTipo: /15/i, tipoRegex: /XV|15/i },
  { ruta: '/cumpleanos', palabraTipo: /cumplea[ñn]os/i, tipoRegex: /Cumplea/i },
  { ruta: '/fiestas-empresariales', palabraTipo: /empresa/i, tipoRegex: /Empresariales/i },
  { ruta: '/fiestas-infantiles', palabraTipo: /infantil/i, tipoRegex: /Cumplea/i },
];

test.use({ video: 'off' });

test.describe('Orden 347 — Las páginas por tipo de fiesta', () => {
  test.describe.configure({ timeout: 240_000 });

  test('en escritorio la portada enlaza a /fiestas y a las 5 páginas, y /fiestas abre sin desborde', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Portada: menú a /fiestas y pie con los 5 enlaces
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const navFiestas = page.locator('header a[href="/fiestas"]').first();
    await expect(navFiestas).toBeVisible({ timeout: 20_000 });

    for (const { ruta } of PAGINAS_TIPO) {
      await expect(page.locator(`footer a[href="${ruta}"]`).first()).toBeVisible({ timeout: 15_000 });
    }

    await page.goto('/fiestas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveCount(1, { timeout: 20_000 });
    await expect(page.locator('a[href*="wa.me/59898355530"]').first()).toBeVisible();
    const overflowFiestas = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowFiestas).toBeLessThanOrEqual(2);
  });

  for (const { ruta, palabraTipo, tipoRegex } of PAGINAS_TIPO) {
    test(`en escritorio ${ruta} tiene un solo h1, WhatsApp y simulador visibles arriba del pliegue y sin desborde`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });

      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1, { timeout: 20_000 });
      await expect(h1s.first()).toBeVisible();

      const waLink = page.locator('a[href*="wa.me/59898355530"]').first();
      await expect(waLink).toBeVisible();
      const waHref = decodeURIComponent((await waLink.getAttribute('href')) || '');
      expect(waHref).toMatch(palabraTipo);

      const simLink = page.locator(`a[href*="/simulador-de-presupuesto"][href*="tipo="]:not([href*="entry=hero-fecha"])`).first();
      await expect(simLink).toBeVisible();
      const simHref = decodeURIComponent((await simLink.getAttribute('href')) || '');
      expect(simHref).toMatch(tipoRegex);

      const boxWa = await waLink.boundingBox();
      const boxSim = await simLink.boundingBox();
      expect(boxWa?.y ?? 9999).toBeLessThan(800);
      expect(boxSim?.y ?? 9999).toBeLessThan(800);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    });
  }

  for (const { ruta, palabraTipo } of PAGINAS_TIPO) {
    test(`en celular 360 px ${ruta} no se desborda y los dos botones se ven sin bajar`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toHaveCount(1, { timeout: 20_000 });

      const simVisible = page.locator('a[href*="/simulador-de-presupuesto"]:visible').filter({ hasText: /Armar mi presupuesto/i }).last();
      const waVisible = page.locator('a[href*="wa.me/59898355530"]:visible').filter({ hasText: /Hablar por WhatsApp/i }).last();
      await expect(simVisible).toBeVisible();
      await expect(waVisible).toBeVisible();

      const waHref = decodeURIComponent((await waVisible.getAttribute('href')) || '');
      expect(waHref).toMatch(palabraTipo);

      const simBox = await simVisible.boundingBox();
      const waBox = await waVisible.boundingBox();
      expect((simBox?.y ?? 9999) + (simBox?.height ?? 0)).toBeLessThanOrEqual(745);
      expect((waBox?.y ?? 9999) + (waBox?.height ?? 0)).toBeLessThanOrEqual(745);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    });
  }

  test('/bodas no muestra texto inventado ni reseñas de 15 años, y /15-anos redirige a /quinceaneras', async ({ page }) => {
    await page.goto('/bodas', { waitUntil: 'domcontentloaded' });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Boda producida por AK');
    expect(bodyText).toContain('Imagen ilustrativa');
    expect(bodyText).not.toMatch(/fiesta de 15.*reseña/i);

    await page.goto('/15-anos', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/quinceaneras/, { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe('/quinceaneras');
  });

  test('llenar el formulario en /fiestas-empresariales?o=google manda fuente landing-empresas y origen google', async ({ page }) => {
    let capturedPostBody = '';

    await page.route('**/fiestas-empresariales*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        capturedPostBody = req.postData() || '';
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.goto('/fiestas-empresariales?o=google', { waitUntil: 'domcontentloaded' });
    await page.locator('#lead-nombre').fill('Prueba Empresa');
    await page.locator('#lead-telefono').fill('099123456');
    await page.getByRole('button', { name: /Consultar por WhatsApp/i }).click();

    await expect.poll(() => capturedPostBody, { timeout: 15_000 }).toContain('landing-empresas');
    expect(capturedPostBody).toContain('google');
  });
});
