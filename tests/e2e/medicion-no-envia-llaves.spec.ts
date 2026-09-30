import { expect, test } from '@playwright/test';

/**
 * Prueba de seguridad: la medición de Google y Meta no recibe llaves privadas.
 *
 * Google Analytics y el Pixel de Meta se montan en todas las pantallas. Sin control,
 * la URL completa (con tokens de invitados, llaves de portales, etc.) llega a
 * Google y a Meta con cada cambio de pantalla. Esta prueba verifica que eso no pase.
 */

const LLAVE_FICTICIA = 'LLAVE-FICTICIA-TEST-12345';

/** Script que intercepta gtag y fbq y guarda todo lo que reciben. */
const interceptorScript = `
  window.__medidasCapturadas = [];
  window.__capturarMedida = function(fuente, args) {
    var serialized = Array.from(args).map(function(a) {
      if (typeof a === 'object' && a !== null) {
        try { return JSON.stringify(a); } catch (e) { return String(a); }
      }
      return String(a);
    });
    window.__medidasCapturadas.push({ fuente: fuente, args: serialized });
  };

  // Interceptar dataLayer y gtag
  window.dataLayer = window.dataLayer || [];
  var origPush = window.dataLayer.push ? window.dataLayer.push.bind(window.dataLayer) : Array.prototype.push.bind(window.dataLayer);
  window.dataLayer.push = function() {
    window.__capturarMedida('gtag', arguments);
    return origPush.apply(window.dataLayer, arguments);
  };
  function gtag() {
    window.__capturarMedida('gtag', arguments);
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Interceptar fbq
  var fbqStub = function() {
    window.__capturarMedida('fbq', arguments);
  };
  fbqStub.disablePushState = true;
  fbqStub.loaded = true;
  fbqStub.version = '2.0';
  fbqStub.queue = [];
  window.fbq = fbqStub;
  window._fbq = fbqStub;
`;

test.describe('Orden 100 - Medición: Google y Meta no reciben llaves privadas', () => {
  test('abrir una invitación privada no manda la llave a Google ni a Meta', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    // Interceptar antes de que cargue la página
    await page.addInitScript(interceptorScript);

    await page.goto(`/invitacion/fiesta-test/invitado/invitado-test?token=${LLAVE_FICTICIA}`, {
      waitUntil: 'domcontentloaded',
    });

    // Esperar un poco para que se ejecuten los efectos
    await page.waitForTimeout(2000);

    const medidas: { fuente: string; args: string[] }[] = await page.evaluate(
      () => (window as any).__medidasCapturadas ?? []
    );

    // Ninguna medida debe contener la llave ficticia (ni codificada)
    const llaveEncontrada = medidas.some((m) =>
      m.args.some(
        (a) =>
          a.includes(LLAVE_FICTICIA) ||
          a.includes(encodeURIComponent(LLAVE_FICTICIA))
      )
    );
    expect(llaveEncontrada, `La llave apareció en una medida: ${JSON.stringify(medidas)}`).toBe(false);

    // No debe haber PageView en una pantalla privada
    const hayPageView = medidas.some(
      (m) => m.fuente === 'fbq' && m.args.some((a) => a === 'PageView')
    );
    expect(hayPageView, 'fbq recibió un PageView en una pantalla privada').toBe(false);
  });

  test('abrir el portal de cliente con llave en la ruta no manda la llave', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.addInitScript(interceptorScript);

    await page.goto(`/portal/c/${LLAVE_FICTICIA}`, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(2000);

    const medidas: { fuente: string; args: string[] }[] = await page.evaluate(
      () => (window as any).__medidasCapturadas ?? []
    );

    const llaveEncontrada = medidas.some((m) =>
      m.args.some(
        (a) =>
          a.includes(LLAVE_FICTICIA) ||
          a.includes(encodeURIComponent(LLAVE_FICTICIA))
      )
    );
    expect(llaveEncontrada, `La llave apareció en una medida: ${JSON.stringify(medidas)}`).toBe(false);

    const hayPageView = medidas.some(
      (m) => m.fuente === 'fbq' && m.args.some((a) => a === 'PageView')
    );
    expect(hayPageView, 'fbq recibió un PageView en una pantalla privada').toBe(false);
  });

  test('la portada con utm_source se mide pero sin mandar el token que acompañe', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.addInitScript(interceptorScript);

    await page.goto(`/?utm_source=ig&token=${LLAVE_FICTICIA}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect.poll(async () => {
      const ms = await page.evaluate(() => (window as any).__medidasCapturadas ?? []);
      return ms.length;
    }, { timeout: 15_000, message: 'No hubo ninguna medida en la portada (esperábamos gtag o fbq)' }).toBeGreaterThan(0);

    const medidas: { fuente: string; args: string[] }[] = await page.evaluate(
      () => (window as any).__medidasCapturadas ?? []
    );

    // El utm_source debe estar presente en alguna medida
    const hayUtmSource = medidas.some((m) =>
      m.args.some((a) => a.includes('utm_source=ig'))
    );
    expect(hayUtmSource, 'utm_source=ig no apareció en ninguna medida').toBe(true);

    // La llave del token NO debe aparecer
    const llaveEncontrada = medidas.some((m) =>
      m.args.some(
        (a) =>
          a.includes(LLAVE_FICTICIA) ||
          a.includes(encodeURIComponent(LLAVE_FICTICIA))
      )
    );
    expect(llaveEncontrada, `La llave apareció en una medida: ${JSON.stringify(medidas)}`).toBe(false);
  });

  test('navegar de la portada a una pantalla privada no genera un segundo PageView', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.addInitScript(interceptorScript);

    // Empezar en la portada
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const medidasEnPortada: { fuente: string; args: string[] }[] = await page.evaluate(
      () => (window as any).__medidasCapturadas ?? []
    );

    const pageViewsEnPortada = medidasEnPortada.filter(
      (m) => m.fuente === 'fbq' && m.args.some((a) => a === 'PageView')
    ).length;

    // Navegar a una ruta privada
    await page.goto(`/portal/c/${LLAVE_FICTICIA}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const medidasTotal: { fuente: string; args: string[] }[] = await page.evaluate(
      () => (window as any).__medidasCapturadas ?? []
    );

    const pageViewsDespues = medidasTotal.filter(
      (m) => m.fuente === 'fbq' && m.args.some((a) => a === 'PageView')
    ).length;

    // No debe haber más PageViews que los de la portada (la ruta privada no agrega)
    expect(pageViewsDespues).toBeLessThanOrEqual(pageViewsEnPortada);
  });
});
