import { expect, test } from '@playwright/test';

/**
 * ORDEN 57 — LA PORTADA APARECE AL TOQUE, SIN ESPERAR A NADIE.
 *
 * De donde sale. El dueño no podia entrar y la portada le tiraba el cartel de error de
 * Google: *"esto le pasa a un prospecto y se va"*. La causa, verificada en el codigo y
 * medida de los dos lados: la portada esperaba **diez** pedidos de datos —YouTube,
 * Instagram, galeria, blog, salones, testimonios— antes de dibujar un solo pixel, asi
 * que tardaba lo que tardaba el mas lento.
 *
 * QUE COMPRUEBA ESTA PRUEBA, Y POR QUE ASI.
 *
 * Los ocho pedidos lentos **los hace el servidor**, no el navegador, asi que no se los
 * puede demorar desde afuera para ver si la pantalla los espera. La forma de probarlo
 * es otra y es mas firme: **mirar lo que manda el servidor**.
 *
 * Cuando la portada no espera, el servidor manda primero la pantalla armada con los
 * **recuadros de espera** en el lugar de cada seccion lenta —marcados con `aria-busy`—
 * y va completando el resto a medida que llega. Si la portada esperara, esos recuadros
 * **no existirian en ningun lado**: la respuesta saldria entera y tarde.
 *
 * Por eso alcanza con una cosa, y es la que separa el antes del despues: **que el
 * titular y los recuadros de espera esten en lo que manda el servidor**. Con la version
 * vieja esta prueba se pone en rojo, porque ahi no habia recuadros.
 */

test.describe('Orden 57 - la portada aparece al toque', () => {
  test('el servidor manda el titular y los recuadros de espera, sin aguardar a los ocho pedidos lentos', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    const respuesta = await request.get('/');
    expect(respuesta.status(), 'la portada tiene que contestar bien').toBeLessThan(400);

    const html = await respuesta.text();

    // 1. El titular viaja en lo primero que manda el servidor.
    expect(html, 'el titular tiene que venir en la pagina').toMatch(/<h1[\s>]/);

    // 2. Y las secciones lentas viajan como recuadros de espera, no como contenido ya
    //    resuelto. Esto es lo que demuestra que la pantalla no las espero.
    const recuadros = (html.match(/aria-busy="true"/g) || []).length;
    expect(recuadros, 'tienen que venir los recuadros de espera de las secciones lentas').toBeGreaterThanOrEqual(3);
  });

  test('la portada se ve, y el boton para pedir presupuesto se puede tocar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });
    const boton = page
      .locator('a[href*="simulador-de-presupuesto"], a[href*="wa.me"], a[href*="whatsapp"]')
      .first();
    await expect(boton).toBeVisible({ timeout: 20_000 });
  });
});
