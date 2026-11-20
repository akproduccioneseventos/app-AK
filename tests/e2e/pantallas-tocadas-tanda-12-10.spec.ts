import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, guardarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Pantallas tocadas en la tanda del 12 de octubre de 2026.
 *
 * Comprueba RESULTADOS:
 *  - los atajos al Centro de Fiesta y "Servicios contratados" abren la fiesta PEDIDA
 *    (?fiestaId=B) y no la "actual" (A);
 *  - "Nueva incidencia" arranca vacía después de guardar una.
 *
 * Las pantallas que prueba este archivo son:
 *   /fiestas/nueva/centro-total
 *   /fiestas/nueva/centro
 *   /fiestas/nueva/mission-control
 *   /fiestas/nueva/servicios-contratados
 *   /incidentes
 */

const SUFIJO = Date.now();
const ID_A = `e2e_tanda_a_${SUFIJO}`;
const ID_B = `e2e_tanda_b_${SUFIJO}`;
const NOMBRE_A = `Fiesta Alfa ${SUFIJO}`;
const NOMBRE_B = `Fiesta Beta ${SUFIJO}`;

const ARCHIVOS_INCIDENTES = [
  path.join(process.cwd(), 'data', 'incidentes.json'),
  path.join(process.cwd(), 'src', 'data', 'incidentes.json'),
];
const respaldoIncidentes = new Map<string, string | null>();

test.beforeAll(() => {
  for (const [id, nombre] of [[ID_A, NOMBRE_A], [ID_B, NOMBRE_B]] as const) {
    const f = crearFiestaDeEstaNoche({ id });
    f.configuracion.nombreEvento = nombre;
    guardarFiesta(f);
  }
  for (const a of ARCHIVOS_INCIDENTES) {
    respaldoIncidentes.set(a, fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : null);
  }
});

test.afterAll(() => {
  borrarFiesta(ID_A);
  borrarFiesta(ID_B);
  for (const [a, contenido] of respaldoIncidentes) {
    if (contenido === null) {
      if (fs.existsSync(a)) fs.unlinkSync(a);
    } else {
      fs.writeFileSync(a, contenido);
    }
  }
});

test.beforeEach(async ({ context, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Se prueba desde la computadora.');
  await ponerSesionDelEquipo(context, baseURL);
});

for (const ruta of ['centro-total', 'centro', 'mission-control']) {
  test(`/fiestas/nueva/${ruta}?fiestaId=B lleva al Centro de la fiesta B, no a la A`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`/fiestas/nueva/${ruta}?fiestaId=${ID_B}`, { waitUntil: 'commit' });
    // Se mira a dónde lleva, no que el centro termine de cargar: esa pantalla es pesada y con la máquina cargada pasaba
    // el minuto (falló tres veces así el 18/11/2026 con la redirección ya inmediata).
    await page.waitForURL(new RegExp(`/fiestas/${ID_B}/centro`), { timeout: 60_000, waitUntil: 'commit' });
    expect(page.url()).toContain(`/fiestas/${ID_B}/centro`);
    expect(page.url()).not.toContain(ID_A);
  });
}

test('/fiestas/nueva/servicios-contratados?fiestaId=B muestra los datos de B', async ({ page }) => {
  test.setTimeout(120_000);
  const erroresJs: string[] = [];
  page.on('pageerror', (e) => erroresJs.push(e.message));
  await page.goto(`/fiestas/nueva/servicios-contratados?fiestaId=${ID_B}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Servicios Contratados' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(NOMBRE_B).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(NOMBRE_A)).toHaveCount(0);
  expect(erroresJs).toEqual([]);
});

test('/incidentes: después de guardar una incidencia, "Nueva incidencia" abre con el título vacío', async ({ page }) => {
  test.setTimeout(120_000);
  const titulo = `Incidencia de prueba ${SUFIJO}`;
  await page.goto('/incidentes', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Gestión de Incidentes' })).toBeVisible({ timeout: 60_000 });

  await page.getByRole('button', { name: /Nueva Incidencia/i }).click();
  const dialogo = page.getByRole('dialog');
  await dialogo.getByPlaceholder('Título del incidente').fill(titulo);
  await dialogo.getByPlaceholder('Nombre del responsable').fill('Responsable de prueba');
  await dialogo.getByPlaceholder('Describí el incidente...').fill('Texto de prueba');
  await dialogo.getByRole('button', { name: /Registrar Incidente/i }).click();

  await expect(page.getByText('Incidente creado', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: /Nueva Incidencia/i }).click();
  const dialogo2 = page.getByRole('dialog');
  await expect(dialogo2.getByPlaceholder('Título del incidente')).toHaveValue('');
  await expect(dialogo2.getByPlaceholder('Describí el incidente...')).toHaveValue('');
});
