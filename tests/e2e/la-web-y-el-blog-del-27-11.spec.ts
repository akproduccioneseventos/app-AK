import { expect, test } from '@playwright/test';

const RUTAS_MOVIL = [
  '/',
  '/bodas',
  '/quinceaneras',
  '/cumpleanos',
  '/club-uruguay',
  '/blog',
];

test.describe('Orden 378 — La web y el blog del 27/11', () => {
  test('redirección de /public/blog, canonical de /blog y /sitemap.xml', async ({
    browser,
    request,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain('/blog');
    expect(sitemapXml).not.toContain('/public/blog/');

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const resp = await page.goto('/public/blog', { waitUntil: 'domcontentloaded' });
      expect(resp?.status()).toBeLessThan(400);
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

      const pathnameFinal = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      expect(pathnameFinal).toBe('/blog');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/^(\/|https:\/\/akproducciones\.uy\/)blog$/);
    } finally {
      await context.close();
    }
  });

  test('/bodas muestra logo real, H1 de wedding planner y FAQPage; /quinceaneras no duplica la marca en title', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const respBodas = await page.goto('/bodas', { waitUntil: 'domcontentloaded' });
      expect(respBodas?.status()).toBeLessThan(400);
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

      const logo = page.locator('header img[alt="AK Producciones"]').first();
      await expect(logo).toBeVisible();
      await expect
        .poll(
          async () => logo.evaluate((el) => (el as HTMLImageElement).naturalWidth),
          { timeout: 15_000 },
        )
        .toBeGreaterThan(0);

      await expect(page.locator('h1').first()).toContainText(
        'Wedding planner y organizador de bodas en Salto',
      );

      const jsonLdScripts = await page
        .locator('script[type="application/ld+json"]')
        .allInnerTexts();
      const tieneFaqPage = jsonLdScripts.some((raw) => {
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown> | Array<Record<string, unknown>>;
          const items = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as Record<string, unknown>)['@graph'])
              ? ((parsed as Record<string, Array<Record<string, unknown>>>)['@graph'])
              : [parsed];
          return items.some((item) => item?.['@type'] === 'FAQPage');
        } catch {
          return false;
        }
      });
      expect(tieneFaqPage).toBe(true);

      const respQuince = await page.goto('/quinceaneras', { waitUntil: 'domcontentloaded' });
      expect(respQuince?.status()).toBeLessThan(400);
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

      const titleQuince = await page.title();
      const coincidenciasMarca = titleQuince.match(/AK Producciones/g) || [];
      expect(coincidenciasMarca).toHaveLength(1);
    } finally {
      await context.close();
    }
  });

  test('sin desborde horizontal en móvil (390x844) en las páginas principales y /blog', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(180_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      for (const ruta of RUTAS_MOVIL) {
        const resp = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
        expect(resp?.status(), `${ruta} abre en móvil`).toBeLessThan(400);
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(500);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth, `${ruta} sin desborde horizontal en 390px`).toBeLessThanOrEqual(395);
      }
    } finally {
      await context.close();
    }
  });
});
