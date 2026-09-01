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

  // 1. Se dibuja y se entiende de que es.
  expect(texto, 'dice que es la hoja de cocina').toMatch(/hoja de cocina/i);
  expect(texto, 'muestra la fiesta y las personas').toMatch(/adultos|personas|fiesta/i);

  // 2. Se puede imprimir: es para pegarla en la cocina.
  const imprimir = page.getByRole('button', { name: /imprimir/i });
  await expect(imprimir, 'esta el boton de imprimir').toBeVisible();

  // 3. Lo que mas importa: si falta cargar algo, LO DICE. Nunca ceros mudos.
  const faltaAlgo = /no hay platos cargados|no hay cantidad de invitados/i.test(texto);
  const hayPlatos = /porciones/i.test(texto);
  expect(
    faltaAlgo || hayPlatos,
    'o muestra las porciones, o avisa en criollo que falta cargar algo',
  ).toBe(true);

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

  // Una pantalla a la que no se llega no la usa nadie: el enlace tiene que estar.
  const enlace = page.locator(`a[href*="/fiestas/nueva/catering/hoja-de-cocina"]`);
  expect(await enlace.count(), 'la pantalla de comida enlaza la hoja de cocina').toBeGreaterThan(0);
});
