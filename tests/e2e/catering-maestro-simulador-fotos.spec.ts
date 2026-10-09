/**
 * Orden 127: la foto que se MUESTRA en pantalla para un plato es la que `getCateringDishImage`
 * le asigna a ese plato (no la de otro, no la pizarra vacia de la mesa bufet).
 *
 * Mira el RESULTADO en pantalla: el `src` de cada imagen del catalogo interno de menus
 * (`/empresa/menus/catalogo`), el mismo helper que usa el simulador. Se compara con lo que el
 * helper real devuelve para el plato del maestro en Git (`src/data/menus-catering.json`).
 *
 * Requiere la sesion del equipo (el catalogo es interno). Con `AK_USE_LOCAL_JSON_ONLY=true`
 * el catalogo sale del JSON local, el mismo que se compara aca.
 */
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { getCateringDishImage } from '../../src/lib/catering/menu-images';

type Plato = { id: string; name: string; imageUrl?: string };
const menus = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'menus-catering.json'), 'utf8'));
const platos: Plato[] = menus.flatMap((m: any) => m.items as Plato[]);
const plato = (id: string) => platos.find((p) => p.id === id)!;

// Tres que cubren los casos delicados: picada cruzada a proposito, mesa bufet (sin pizarra), y uno comun.
const ELEGIDOS = ['dish_entrada_21', 'dish_entrada_22', 'dish_main_19', 'dish_child_4'];

test('el catalogo muestra, para cada plato elegido, la foto que le asigna la app', async ({ page, context, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  test.setTimeout(120_000);
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/empresa/menus/catalogo', { waitUntil: 'domcontentloaded' });

  // Las categorias vienen cerradas: se abren todas.
  const disparadores = page.locator('button[data-state="closed"][aria-controls]');
  await expect(disparadores.first()).toBeVisible({ timeout: 60_000 });
  for (let i = 0; i < 12; i++) {
    const cerrado = page.locator('button[data-state="closed"][aria-controls]').first();
    if (!(await cerrado.isVisible().catch(() => false))) break;
    await cerrado.click();
  }

  for (const id of ELEGIDOS) {
    const p = plato(id);
    const esperada = getCateringDishImage(p)!;
    expect(esperada, `el helper debe dar foto para ${id}`).toBeTruthy();
    const imagenes = page.locator(`img[alt="${p.name}"]`);
    await expect(imagenes.first(), `se ve la foto de ${p.name}`).toBeVisible({ timeout: 30_000 });
    const srcs = await imagenes.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).getAttribute('src')));
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) expect(src, `${p.name} muestra su foto`).toBe(esperada);
    // Y que el navegador la pudo cargar de verdad (no una direccion rota).
    const cargo = await imagenes.first().evaluate((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0);
    expect(cargo, `${p.name}: la imagen carga`).toBe(true);
  }

  // La mesa bufet nunca muestra la pizarra vacia.
  const buffet = await page.locator(`img[alt="${plato('dish_main_19').name}"]`).evaluateAll((els) => els.map((e) => (e as HTMLImageElement).getAttribute('src')));
  expect(buffet.join(' ')).not.toContain('/catering/menus/xv/dish_main_19.jpeg');
});
