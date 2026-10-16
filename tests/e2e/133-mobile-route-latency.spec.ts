import { expect, test } from '@playwright/test';
import { crearCookieDeSesion } from './helpers/fiesta-de-prueba';

test('home y sincronizaciones abren en movil sin depender de servicios externos', async ({ context, page, baseURL }, info) => {
  test.skip(info.project.name !== 'chromium-mobile', 'Sonda movil focalizada');
  if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Synthetic isolated QA only');
  await page.setViewportSize({ width: 390, height: 844 });

  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL!, httpOnly: true, sameSite: 'Lax' },
  ]);
  await page.route(/^https?:\/\//, (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });

  for (const route of ['/', '/settings/cupones', '/empresa/red-social-eventos']) {
    const started = Date.now();
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const elapsedMs = Date.now() - started;
    console.log(`MOBILE_ROUTE ${JSON.stringify({ route, status: response?.status(), elapsedMs, finalPath: new URL(page.url()).pathname })}`);
    expect(response?.status(), `${route} debe responder`).toBeLessThan(400);
    expect(new URL(page.url()).pathname, `${route} no debe redirigir`).toBe(route);
    if (route === '/empresa/red-social-eventos') {
      await expect(page.getByRole('heading', { name: 'Muro Social General' })).toBeVisible({ timeout: 15_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 800);
      const layout = await page.evaluate(() => {
        const box = (element: Element) => {
          const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
          return { left, right, top, bottom, width, height };
        };
        const fixed = [...document.querySelectorAll('body *')]
          .filter(element => getComputedStyle(element).position === 'fixed')
          .filter(element => element.getBoundingClientRect().width > 24 && element.getBoundingClientRect().height > 24)
          .slice(-12)
          .map(element => ({ tag: element.tagName, text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70), box: box(element) }));
        const headers = [...document.querySelectorAll('th')].map(element => ({ text: element.textContent?.trim(), box: box(element) }));
        const nav = [...document.querySelectorAll('nav')].find(element => getComputedStyle(element).position === 'fixed');
        const eventHeader = [...document.querySelectorAll('th')].find(element => element.textContent?.trim() === 'Evento');
        const navBox = nav?.getBoundingClientRect();
        const headerBox = eventHeader?.getBoundingClientRect();
        const navHeaderOverlapArea = navBox && headerBox
          ? Math.max(0, Math.min(navBox.right, headerBox.right) - Math.max(navBox.left, headerBox.left))
            * Math.max(0, Math.min(navBox.bottom, headerBox.bottom) - Math.max(navBox.top, headerBox.top))
          : null;
        return { viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }, fixed, headers, navHeaderOverlapArea };
      });
      console.log(`MOBILE_ROUTE_LAYOUT ${JSON.stringify({ route, overflow, ...layout })}`);
      console.log(`MOBILE_ROUTE_CONTENT ${JSON.stringify(text)}`);
      await page.screenshot({ path: info.outputPath('red-social-eventos-mobile-viewport.png') });
      expect(text.length, 'el panel debe mostrar contenido al usuario').toBeGreaterThan(20);
      expect(overflow, 'el panel de redes sociales no debe desbordar el celular').toBeLessThanOrEqual(2);
      expect(layout.navHeaderOverlapArea, 'la navegacion fija no debe tapar el encabezado de la tabla').toBe(0);
    }
  }
});
