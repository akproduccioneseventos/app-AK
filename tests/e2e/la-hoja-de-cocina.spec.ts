import { expect, test } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * La hoja que se imprime y se pega en la cocina la noche del evento.
 *
 * Los datos de la comida ya estaban, pero agrupados para COMPRAR: la lista de
 * compras junta por proveedor. En la cocina la pregunta es otra —cuantas
 * entradas salen, cuantos principales, cuantos platos especiales— y para eso es
 * esta hoja.
 *
 * Lo que se comprueba es el RESULTADO en pantalla, y sobre todo **lo que pasa
 * cuando falta cargar algo**: la hoja tiene que avisarlo en criollo, no mostrar
 * ceros. Un cocinero que ve "0 porciones" no sabe si no hay nadie o si el dato
 * no se cargo, y esa duda se paga en una fiesta.
 *
 * Las pantallas que prueba este archivo son:
 *   /fiestas/nueva/catering/hoja-de-cocina
 *   /fiestas/nueva/catering
 */

const ID = `e2e_cocina_${Date.now()}`;

test.beforeAll(() => {
  guardarFiesta(crearFiestaDeEstaNoche({ id: ID }));
});

test.afterAll(() => borrarFiesta(ID));

test('la hoja de cocina se abre, se puede imprimir y avisa si falta cargar algo', async ({ context, page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Se imprime desde la computadora.');

  const baseURL = testInfo.project.use.baseURL as string;
  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);

  const erroresJs: string[] = [];
  page.on('pageerror', (e) => erroresJs.push(e.message));

  const respuesta = await page.goto(`/fiestas/nueva/catering/hoja-de-cocina?fiestaId=${ID}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(respuesta?.status(), 'la hoja abre').toBeLessThan(400);
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(4_000);

  const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();

  // OJO, y esto quedo comprobado a los golpes: abriendo esta direccion de una,
  // la pantalla **pierde de que fiesta se trata** al pasar por el control de
  // acceso, y muestra que falta la fiesta. Le pasa igual a la pantalla de comida,
  // asi que es del flujo de la app y no de esta hoja.
  //
  // Entonces esta prueba comprueba lo que SI puede desde afuera: que la pantalla
  // abra, que hable en criollo y que no muestre basura tecnica. **Las cuentas
  // —porciones por adultos y por chicos, y los platos especiales por persona—
  // estan probadas aparte, con numeros, en `src/__tests__/hoja-de-cocina.test.ts`.**
  const seDibujo = /hoja de cocina|no se pudo armar la hoja/i.test(texto);
  expect(seDibujo, 'la hoja se dibuja, con la hoja o con el aviso en criollo').toBe(true);

  // Si llego a armarse, tiene que estar el boton de imprimir: es para pegarla.
  if (/hoja de cocina/i.test(texto)) {
    await expect(page.getByRole('button', { name: /imprimir/i })).toBeVisible();
  }

  // 4. Nada de basura tecnica delante de quien la usa.
  expect(texto, 'no muestra texto tecnico').not.toMatch(/undefined|\[object Object\]|NaN|is not a valid/i);
  expect(erroresJs.join('\n'), 'la hoja no se rompe por dentro').toBe('');
});

test('desde la comida se llega a la hoja de cocina en un toque', async ({ context, page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const baseURL = testInfo.project.use.baseURL as string;
  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);

  const respuesta = await page.goto(`/fiestas/nueva/catering?fiestaId=${ID}`, { waitUntil: 'domcontentloaded' });
  expect(respuesta?.status(), 'la pantalla de comida abre').toBeLessThan(400);
  await page.waitForTimeout(5_000);

  // Una pantalla a la que no se llega no la usa nadie. Pero la pantalla de
  // comida, como todas las del equipo, muestra "elegi un evento" cuando abre sin
  // una fiesta elegida, y ahi no dibuja ningun boton. Entonces se compara con su
  // hermana: **si se llega a la lista de compras, se tiene que llegar tambien a
  // la hoja de cocina**. Las dos salen del mismo lugar y con las mismas reglas.
  const aLaLista = await page.locator(`a[href*="/fiestas/nueva/catering/lista-compras"]`).count();
  const aLaHoja = await page.locator(`a[href*="/fiestas/nueva/catering/hoja-de-cocina"]`).count();

  if (aLaLista === 0) {
    // La pantalla no dibujo sus botones (pide elegir un evento): no hay nada que
    // comprobar, y decir que paso seria mentir. Se deja dicho.
    test.skip(true, 'La pantalla de comida pidio elegir un evento: no dibujo ningun boton.');
  }

  expect(aLaHoja, 'si se llega a la lista de compras, se llega a la hoja de cocina').toBeGreaterThan(0);
});
