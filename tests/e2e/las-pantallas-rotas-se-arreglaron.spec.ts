import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { FIXTURE_IDS } from '../../scripts/helpers/route-inventory.mjs';

/**
 * Las que TODAVIA estan rotas, de `docs/pantallas-rotas-conocidas.json`.
 *
 * **Se lee la misma lista que usa el recorrido de la puerta**, para que no haya
 * dos criterios midiendo lo mismo. Una pantalla que sigue en esa lista no
 * frena aca: ya la informa el recorrido, y **ese numero solo puede bajar**.
 * Cuando se arregla, se saca del archivo y esta prueba empieza a exigirsela
 * sola, sin tocar nada.
 */
const ROTAS_CONOCIDAS: string[] = (() => {
  try {
    const j = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'docs/pantallas-rotas-conocidas.json'), 'utf8'),
    );
    return j.rotas || [];
  } catch {
    return [];
  }
})();

const sigueRota = (ruta: string) => ROTAS_CONOCIDAS.includes(ruta.split('?')[0]);

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
 * - **Un titulo visible y un texto que diga que hacer.** Al principio esto
 *   pedia 200 caracteres, y **estaba mal**: el acceso del proveedor con una
 *   llave vencida muestra *"Acceso no disponible - Solicita un enlace nuevo a
 *   AK Producciones"*, que son 62 caracteres **y es exactamente lo correcto**.
 *   Contar letras castiga al cartel bien hecho. Lo que importa es que **diga
 *   que pasa y que hacer**, no que sea largo.
 * - **Ningun error de React en la consola.** Es el que deja la pantalla en
 *   blanco sin avisar.
 * - **Ni "undefined" ni "[object Object]"** a la vista del cliente.
 *
 * Estas pantallas se abren **sin datos y sin llave**, igual que las encontro el
 * recorrido. Lo que se espera no es que anden con una fiesta cargada: es que
 * **cuando no hay dato, lo digan en criollo** en vez de quedarse mudas.
 */

// El aviso mas corto que se acepta: un titulo y una linea diciendo que hacer.
const MINIMO_PARA_QUE_CUENTE = 40;

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
  test.skip(
    sigueRota(ruta),
    `${ruta} sigue en docs/pantallas-rotas-conocidas.json. El recorrido de la puerta la informa; cuando se arregle, sacala del archivo y esta prueba se la exige sola.`,
  );
  const r = await abrir(page, ruta);

  expect(r.estado, `${ruta} contestó con un error del servidor`).toBeLessThan(400);

  expect(
    r.errores,
    `${ruta} tiró un error de React. Es el que deja la pantalla en blanco sin avisar:\n${r.errores.join('\n')}`,
  ).toEqual([]);

  // Tiene que haber ALGO escrito con jerarquía: un título, un encabezado o el
  // título de un aviso. Una pantalla en blanco no tiene ninguno de los tres.
  //
  // **Van los seis niveles de título, del h1 al h6.** La primera version miraba
  // solo hasta el h3, y el aviso de la app -`AlertTitle`, en
  // `components/ui/alert.tsx:39`- se dibuja como **h5**. Por eso daba por
  // rota la pantalla del proveedor, que en realidad muestra su cartel bien.
  const hayTitulo = await page
    .locator('h1, h2, h3, h4, h5, h6, [role="heading"], [data-slot="alert-title"], [data-slot="card-title"]')
    .first()
    .isVisible()
    .catch(() => false);

  expect(
    hayTitulo,
    `${ruta} no muestra ningún título. Dibujó ${r.texto.length} caracteres. ` +
      `Cuando no hay datos, la pantalla tiene que decir qué pasa y qué hacer.`,
  ).toBe(true);

  // Y algo para leer, aunque sea corto: el aviso mas breve que se acepta ronda
  // los 40 caracteres -"Acceso no disponible" mas la linea que dice que hacer-.
  expect(r.texto.length, `${ruta} está prácticamente vacía`).toBeGreaterThanOrEqual(
    MINIMO_PARA_QUE_CUENTE,
  );

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
    // Es una direccion que redirige: lo que importa es que la de destino ande,
    // y esa SI es una pantalla de verdad, asi que se le pide contenido.
    expect(r.texto.length).toBeGreaterThanOrEqual(200);
  });
});
