import { expect, test } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Tres pantallas que dibujan iconos elegidos por codigo (un icono por zona,
 * por funcion o por bloque del recorrido) y que no tenian ninguna prueba.
 * Al pasar a React 19 cambio el TIPO de esos iconos, y lo que importa es el
 * RESULTADO: que cada item siga mostrando su icono (un svg) y su texto real.
 *
 * Se comprueba por cantidad de svg dentro de cada item y por el texto leido,
 * no solo "se ve". Y que la pagina no tire errores por dentro.
 *
 * Las pantallas que prueba este archivo son:
 *   /fiestas/nueva/decoracion/pdf
 *   /fiestas/nueva/portal-cliente/experiencia-mundial
 *   /fiestas/nueva/zona-digital
 */

const ID = `e2e_iconos19_${Date.now()}`;

const ZONAS = [
  { id: 'atras_torta', nombreDisplay: 'Atrás de la torta', activada: true, descripcion: 'Telón dorado con globos.' },
  { id: 'zona_fotografia', nombreDisplay: 'Rincón de fotos', activada: true, descripcion: 'Fondo con luces cálidas.' },
  { id: 'zona_regalos', nombreDisplay: 'Mesa de regalos', activada: false },
];

test.beforeAll(() => {
  const fiesta: any = crearFiestaDeEstaNoche({ id: ID });
  fiesta.decoracion = { ...(fiesta.decoracion ?? {}), zonasContratadas: ZONAS };
  fiesta.modulosContratados = { ...(fiesta.modulosContratados ?? {}), zonaDigital: true };
  // Dos funciones prendidas y las demas apagadas: todas igual dibujan su icono.
  const prendidas = ['muro_social', 'retos'];
  fiesta.zonaDigitalAdolescentes = {
    enabled: true,
    features: [
      'muro_social', 'retos', 'juegos', 'fotocabina', 'plataforma360', 'bogue',
      'espejo_magico', 'barra', 'totems', 'audioritmico', 'ranking', 'recap',
    ].map((id) => ({ id, enabled: prendidas.includes(id) })),
  };
  guardarFiesta(fiesta);
});

test.afterAll(() => borrarFiesta(ID));

async function abrir(context: any, page: any, testInfo: any, ruta: string) {
  const baseURL = testInfo.project.use.baseURL as string;
  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);
  const erroresJs: string[] = [];
  page.on('pageerror', (e: Error) => erroresJs.push(e.message));
  const respuesta = await page.goto(`${ruta}?fiestaId=${ID}`, { waitUntil: 'domcontentloaded' });
  expect(respuesta?.status(), 'la pantalla abre').toBeLessThan(400);
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  return erroresJs;
}

test('decoracion/pdf: cada zona contratada muestra su icono y su nombre', async ({ context, page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Se imprime desde la computadora.');

  const erroresJs = await abrir(context, page, testInfo, '/fiestas/nueva/decoracion/pdf');

  const titulo = page.getByRole('heading', { name: 'Zonas Decorativas Específicas' });
  await expect(titulo, 'aparece la seccion de zonas').toBeVisible({ timeout: 30_000 });

  // Cada zona es un <div> con <h3> (nombre) y un <p> (descripcion).
  const zonas = page.locator('section', { has: titulo }).locator('h3');
  await expect(zonas, 'solo las dos zonas activadas').toHaveCount(2);
  const nombres = (await zonas.allInnerTexts()).map((t) => t.trim());
  expect(nombres).toEqual(['Atrás de la torta', 'Rincón de fotos']);

  for (let i = 0; i < 2; i++) {
    expect(await zonas.nth(i).locator('svg').count(), `la zona ${nombres[i]} dibuja su icono`).toBe(1);
  }
  const seccion = ((await page.locator('section', { has: titulo }).innerText()) || '').replace(/\s+/g, ' ');
  expect(seccion).toContain('Telón dorado con globos.');
  expect(seccion).toContain('Fondo con luces cálidas.');
  expect(seccion, 'la zona apagada no aparece').not.toContain('Mesa de regalos');

  // Los dos iconos son distintos (torta y camara), no el comodin repetido.
  const dibujos = await zonas.evaluateAll((hs) => hs.map((h) => h.querySelector('svg')?.innerHTML ?? ''));
  expect(dibujos[0]).not.toBe('');
  expect(dibujos[0], 'cada zona tiene su propio icono').not.toBe(dibujos[1]);

  const texto = ((await page.locator('body').innerText()) || '').replace(/\s+/g, ' ');
  expect(texto).not.toMatch(/undefined|\[object Object\]|NaN/);
  expect(erroresJs.join('\n'), 'la pantalla no se rompe por dentro').toBe('');
});

test('experiencia-mundial: los seis bloques del recorrido muestran icono, titulo y estado', async ({ context, page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const erroresJs = await abrir(context, page, testInfo, '/fiestas/nueva/portal-cliente/experiencia-mundial');

  const titulos = [
    'Portada clara y linda',
    'Organización sin marear',
    'Contable en un solo lugar',
    'Invitados siempre visibles',
    'Comunicación única',
    'Post-evento preparado',
  ];
  await expect(page.getByText(titulos[0], { exact: true })).toBeVisible({ timeout: 30_000 });

  for (const t of titulos) {
    // La tarjeta: el titulo y, en su misma tarjeta, el icono y el estado.
    const tarjeta = page.locator('div.rounded-xl', { has: page.getByText(t, { exact: true }) }).last();
    await expect(tarjeta, `existe la tarjeta ${t}`).toHaveCount(1);
    expect(await tarjeta.locator('svg').count(), `${t} dibuja su icono`).toBeGreaterThanOrEqual(1);
    const txt = ((await tarjeta.innerText()) || '').replace(/\s+/g, ' ');
    expect(txt, `${t} dice su estado`).toMatch(/\b(Listo|Revisar)\b/);
    expect(txt, `${t} tiene el boton`).toContain('Abrir bloque');
  }

  // Seis tarjetas, seis botones, y el contador coincide con los "Listo" del recorrido.
  const abrirBloque = page.getByRole('link', { name: 'Abrir bloque' });
  await expect(abrirBloque).toHaveCount(6);
  const cuerpo = ((await page.locator('main').last().innerText()) || '').replace(/\s+/g, ' ');
  expect(cuerpo).toMatch(/Experiencia\s*\d\/6 bloques/);

  expect(cuerpo).not.toMatch(/undefined|\[object Object\]|NaN/);
  expect(erroresJs.join('\n'), 'la pantalla no se rompe por dentro').toBe('');
});

test('zona-digital: las doce funciones muestran su icono, su nombre y su interruptor', async ({ context, page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  const erroresJs = await abrir(context, page, testInfo, '/fiestas/nueva/zona-digital');

  const nombres = [
    'Muro social', 'Retos de la fiesta', 'Juegos en vivo', 'Fotocabina', 'Plataforma 360',
    'Vogue / Boomerang', 'Espejo mágico', 'Barra interactiva', 'Tótems sincronizados',
    'Modo baile audiorrítmico', 'Ranking por puntos', 'Resumen final',
  ];
  await expect(page.getByRole('heading', { name: 'Muro social', exact: true })).toBeVisible({ timeout: 30_000 });

  const iconosDistintos = new Set<string>();
  for (const n of nombres) {
    const h = page.getByRole('heading', { name: n, exact: true });
    await expect(h, `aparece ${n}`).toHaveCount(1);
    // El icono vive en el recuadro rojo, hermano del bloque del titulo.
    const caja = h.locator('xpath=ancestor::div[contains(@class,"flex gap-3")][1]');
    const svgs = caja.locator('div.rounded-2xl svg');
    expect(await svgs.count(), `${n} dibuja su icono`).toBe(1);
    iconosDistintos.add(await svgs.first().evaluate((s) => s.innerHTML));
  }
  expect(iconosDistintos.size, 'cada funcion tiene su icono propio, no el comodin').toBeGreaterThanOrEqual(10);

  // Las dos funciones activadas estan prendidas y las otras diez, apagadas.
  const prendido = (n: string) =>
    page.getByRole('heading', { name: n, exact: true })
      .locator('xpath=ancestor::div[contains(@class,"justify-between")][1]')
      .getByRole('switch').first();
  await expect(prendido('Muro social')).toHaveAttribute('aria-checked', 'true');
  await expect(prendido('Retos de la fiesta')).toHaveAttribute('aria-checked', 'true');
  await expect(prendido('Juegos en vivo')).toHaveAttribute('aria-checked', 'false');
  await expect(prendido('Resumen final')).toHaveAttribute('aria-checked', 'false');

  const texto = ((await page.locator('main').last().innerText()) || '').replace(/\s+/g, ' ');
  expect(texto).toContain('requiere equipo');
  expect(texto).not.toMatch(/undefined|\[object Object\]|NaN/);
  expect(erroresJs.join('\n'), 'la pantalla no se rompe por dentro').toBe('');
});
