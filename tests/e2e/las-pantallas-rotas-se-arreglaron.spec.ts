import { test, expect, type Page } from '@playwright/test';
import { FIXTURE_IDS } from '../../scripts/helpers/route-inventory.mjs';

/**
 * Las pantallas que estaban rotas, ahora dan una respuesta util.
 *
 * **La primera version de esta prueba pedia 20 caracteres en pantalla**, y eso
 * pasa con una pantalla practicamente en blanco: un titulo suelto tiene mas de
 * veinte letras. Ademas no miraba el **error 310 de React**, que era justamente
 * lo que rompia la mitad de estas pantallas.
 *
 * Ahora usa **el mismo criterio que el recorrido de la puerta**, para que no
 * haya dos varas distintas midiendo lo mismo:
 *
 * - **200 caracteres**, que es como una frase larga. Debajo de eso no hay
 *   pantalla: hay un cartel de "cargando" o un titulo solo.
 * - **Ningun error de React en la consola.** Es el que deja la pantalla en
 *   blanco sin avisar.
 * - **Ni "undefined" ni "[object Object]"** a la vista del cliente.
 *
 * Estas pantallas se abren **sin datos y sin llave**, igual que las encontro el
 * recorrido. Lo que se espera no es que anden con una fiesta cargada: es que
 * **cuando no hay dato, lo digan en criollo** en vez de quedarse mudas.
 */

const MINIMO_PARA_QUE_CUENTE = 200;

/** Abre la pantalla y devuelve lo que dibujo y los errores que tiro. */
async function abrir(page: Page, ruta: string) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && /Minified React error|Warning: Each child/.test(m.text())) {
      errores.push(m.text());
    }
  });
  const respuesta = await page.goto(ruta, { waitUntil: 'networkidle' });
  const texto = ((await page.locator('body').innerText().catch(() => '')) || '').trim();
  return { errores, texto, estado: respuesta?.status() ?? 0, url: page.url() };
}

/** Lo que se le exige a cualquiera de estas pantallas. */
async function seComportaBien(page: Page, ruta: string) {
  const r = await abrir(page, ruta);

  expect(r.estado, `${ruta} contestó con un error del servidor`).toBeLessThan(400);

  expect(
    r.errores,
    `${ruta} tiró un error de React. Es el que deja la pantalla en blanco sin avisar:\n${r.errores.join('\n')}`,
  ).toEqual([]);

  expect(
    r.texto.length,
    `${ruta} dibujó ${r.texto.length} caracteres. Eso no es una pantalla: es un cartel suelto. ` +
      `Cuando no hay datos tiene que decirlo en criollo y ofrecer a dónde ir.`,
  ).toBeGreaterThanOrEqual(MINIMO_PARA_QUE_CUENTE);

  // Lo que nunca puede ver un cliente.
  expect(r.texto).not.toContain('undefined');
  expect(r.texto).not.toContain('[object Object]');
  expect(r.texto).not.toMatch(/Minified React error|Application error/i);

  return r;
}

test.describe('Las pantallas que estaban rotas', () => {
  test('el portal del cliente, sin fiesta', async ({ page }) => {
    await seComportaBien(page, '/portal');
  });

  test('la distribución de mesas, sin fiesta', async ({ page }) => {
    await seComportaBien(page, '/portal/mesas');
  });

  test('la pantalla del invitado, sin invitado', async ({ page }) => {
    await seComportaBien(page, `/invitado/${FIXTURE_IDS.fiesta}/${FIXTURE_IDS.guest}`);
  });

  test('el hub del evento', async ({ page }) => {
    await seComportaBien(page, `/evento/hub/${FIXTURE_IDS.fiesta}`);
  });

  test('la zona digital', async ({ page }) => {
    await seComportaBien(page, `/evento/zona-digital/${FIXTURE_IDS.fiesta}`);
  });

  test('el acceso del proveedor, con una llave que no existe', async ({ page }) => {
    await seComportaBien(page, `/proveedor/acceso/${FIXTURE_IDS.token}`);
  });

  test('la landing de eventos lleva a algún lado', async ({ page }) => {
    const r = await abrir(page, '/landing/eventos');
    expect(r.estado).toBeLessThan(400);
    expect(r.errores).toEqual([]);
    // Es una direccion que redirige: lo que importa es que la de destino ande.
    expect(r.texto.length).toBeGreaterThanOrEqual(MINIMO_PARA_QUE_CUENTE);
  });
});
