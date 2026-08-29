import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';

/**
 * Instalar SÓLO la estación, no la app entera.
 *
 * Pedido del dueño: él ya había instalado la app completa en una PC, y quiere
 * poder instalar **sólo la estación** en la máquina del empleado. Y una vez
 * sola: *"cuando entro pongo la fiesta que es y ta, así no hay que instalar a
 * cada rato."*
 *
 * Lo que se comprueba es el resultado: que la estación declare un manifiesto
 * propio, que ese ícono **no quede atado a una fiesta**, que arranque en la
 * pantalla donde se elige, y que **no deje salir al resto de la app**.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_instalar_${Date.now()}` });
const ID = fiesta.id;

test.afterAll(() => {
  borrarFiesta(ID);
});

test('la fotocabina se puede instalar sola, y abre directo en su fiesta', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const acceso = crearPermisoDeEstacion(ID, 'fotocabina');
  await page.goto(`/evento/fotocabina/${ID}?access=${acceso}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2_500);

  // La pantalla tiene que declarar su propio manifiesto, no el de la app entera.
  const href = await page.locator('link[rel="manifest"]').first().getAttribute('href');
  expect(href, 'la estacion declara su propio manifiesto').toContain('/api/manifest-estacion');
  expect(href, 'el manifiesto es de la fotocabina').toContain('estacion=fotocabina');

  // Y el manifiesto tiene que abrir en ESTA fiesta y no dejar salir de las
  // pantallas de evento.
  const manifiesto = await page.request.get(href as string);
  expect(manifiesto.status(), 'el manifiesto se puede leer sin sesion').toBe(200);

  const datos = await manifiesto.json();
  expect(datos.start_url, 'arranca donde se elige la fiesta').toContain('/evento/fotocabina');
  // Lo que importa: el icono NO queda pegado a una fiesta. Se instala una vez.
  expect(String(datos.start_url), 'el icono no queda atado a una fiesta').not.toContain(ID);
  expect(String(datos.name), 'el nombre no lleva el de la fiesta').not.toContain(ID);
  expect(datos.scope, 'no deja salir al resto de la app').toBe('/evento/');
  expect(datos.display).toBe('standalone');
  expect(String(datos.short_name)).toContain('Fotocabina');
});
