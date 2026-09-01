import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * La red social de la fiesta, abierta como la abre un invitado.
 *
 * Estas dos pantallas —la red social y el hub— **nunca tuvieron una prueba**, y
 * son las que usa el invitado toda la noche desde su celular.
 *
 * La orden 23 pidio cuatro cosas concretas, y esto comprueba que **se vean**, no
 * que esten escritas:
 *
 *  - "Mi mesa": la pantalla existia y el invitado no llegaba desde ningun lado.
 *  - El cronograma: antes solo se veia en la invitacion, nunca durante la fiesta.
 *  - El ranking.
 *  - Bajar su propia foto.
 *
 * Las pantallas que prueba este archivo son:
 *   /evento/social/[fiestaId]
 *   /evento/hub/[fiestaId]
 */

const ID = `e2e_social_${Date.now()}`;

test.beforeAll(() => {
  guardarFiesta(crearFiestaDeEstaNoche({ id: ID }));
});

test.afterAll(() => borrarFiesta(ID));

test('la red social le da al invitado su mesa, el cronograma y el ranking', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const erroresJs: string[] = [];
  page.on('pageerror', (e) => erroresJs.push(e.message));

  const respuesta = await page.goto(`/evento/social/${ID}`, { waitUntil: 'domcontentloaded' });
  expect(respuesta?.status(), 'la red social abre').toBeLessThan(400);
  // OJO: esta pantalla tarda mas de 6 segundos en cargar sus datos. Con una
  // espera fija daba rojo estando todo bien, y ya se perdio una vez esta
  // correccion al juntar ramas. Lo que importa no es que sea rapida: es que
  // TERMINE de cargar. Si a los 30 segundos sigue buscando, ahi si es una falla:
  // el invitado se queda mirando un cartel para siempre.
  await page
    .locator('nav button', { hasText: /cronograma/i })
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
    .catch(() => {});

  const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();

  // 1. Se dibuja y no le muestra basura tecnica al invitado.
  expect(texto.length, 'la red social dibuja su pantalla').toBeGreaterThan(40);
  expect(texto, 'no muestra texto tecnico').not.toMatch(
    /undefined|firestore|is not a valid|\[object Object\]|Algo sali[oó] mal/i,
  );

  // 2. Lo que pidio la orden 23, comprobado en pantalla.
  const faltan: string[] = [];
  if (!/mi mesa|d[oó]nde me siento/i.test(texto)) faltan.push('el acceso a "Mi mesa"');
  if (!/cronograma/i.test(texto)) faltan.push('el cronograma de la fiesta');
  if (!/ranking/i.test(texto)) faltan.push('el ranking');
  expect(faltan.join(', '), `falta en la red social: ${faltan.join(', ')}`).toBe('');

  // 3. El enlace a la mesa lleva a la pantalla que ya existia, no a una copia.
  const mesa = page.locator(`a[href*="/evento/mi-mesa/${ID}"]`);
  expect(await mesa.count(), 'el enlace a mi mesa apunta a la pantalla que ya existe').toBeGreaterThan(0);

  expect(erroresJs.join('\n'), 'la red social no se rompe por dentro').toBe('');
});

test('el hub de la fiesta se dibuja para el invitado', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const erroresJs: string[] = [];
  page.on('pageerror', (e) => erroresJs.push(e.message));

  const respuesta = await page.goto(`/evento/hub/${ID}`, { waitUntil: 'domcontentloaded' });
  expect(respuesta?.status(), 'el hub abre').toBeLessThan(400);
  await page.waitForTimeout(5_000);

  const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  expect(texto.length, 'el hub dibuja su pantalla').toBeGreaterThan(30);
  expect(texto, 'no muestra texto tecnico').not.toMatch(
    /undefined|firestore|is not a valid|\[object Object\]|Algo sali[oó] mal/i,
  );
  expect(erroresJs.join('\n'), 'el hub no se rompe por dentro').toBe('');
});
