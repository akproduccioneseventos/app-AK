import { expect, test } from '@playwright/test';

/**
 * Las pantallas que ve un prospecto, abiertas de a una.
 *
 * El recorrido de las 353 pantallas reporto el mismo error interno de React en
 * 16 pantallas muy distintas, varias de la web de venta. Un error igual en
 * pantallas que no tienen nada que ver suele significar una de dos cosas: **una
 * causa comun**, o que el recorrido se lo atribuyo a quien no era —porque abre
 * las 353 con la misma pestana, una atras de otra, y un error que llega tarde
 * cae sobre la siguiente—.
 *
 * Esto lo separa: abre cada una **sola, en su propia pestana**, y mira si el
 * error aparece igual. Es la unica forma de saber cual de las dos es.
 *
 * Las pantallas que prueba este archivo son:
 *   /blog
 *   /landing
 *   /presentacion
 */

const PANTALLAS = ['/blog', '/landing', '/presentacion'];

test('las pantallas de venta se abren solas sin romperse por dentro', async ({ browser }, testInfo) => {
  test.setTimeout(240_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const rotas: string[] = [];

  for (const ruta of PANTALLAS) {
    // Pestana nueva por pantalla: asi un error de la anterior no ensucia a la
    // siguiente, que es lo que se quiere descartar.
    const context = await browser.newContext();
    const page = await context.newPage();
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && /Minified React error/i.test(m.text())) errores.push(m.text());
    });

    const respuesta = await page.goto(ruta, { waitUntil: 'domcontentloaded' });
    expect(respuesta?.status(), `${ruta} abre`).toBeLessThan(400);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(3_000);

    const texto = ((await page.locator('body').innerText().catch(() => '')) || '').trim();
    if (texto.length < 40) rotas.push(`${ruta}: no dibuja nada`);
    if (errores.length > 0) rotas.push(`${ruta}: ${errores[0].slice(0, 120)}`);

    await context.close();
  }

  expect(rotas.join('\n'), rotas.join('\n')).toBe('');
});
