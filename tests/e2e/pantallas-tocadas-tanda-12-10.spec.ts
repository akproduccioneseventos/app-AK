import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, guardarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Pantallas tocadas en la tanda del 12 de octubre de 2026.
 *
 * Comprueba RESULTADOS:
 *  - los atajos al Centro de Fiesta y "Servicios contratados" abren la fiesta PEDIDA
 *    (?fiestaId=B) y no la "actual" (A);
 *  - "Nueva incidencia" arranca vacía después de guardar una;
 *  - las pantallas de la torre de control muestran su contenido real y, si la lectura
 *    falla, avisan en vez de decir "todo tranquilo".
 *
 * Las pantallas que prueba este archivo son:
 *   /fiestas/nueva/centro-total
 *   /fiestas/nueva/centro
 *   /fiestas/nueva/mission-control
 *   /fiestas/nueva/servicios-contratados
 *   /incidentes
 *   /control-tower/automatizaciones
 *   /control-tower/comercial
 *   /control-tower/post-fiesta
 *   /control-tower/preparacion
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
    await page.goto(`/fiestas/nueva/${ruta}?fiestaId=${ID_B}`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(new RegExp(`/fiestas/${ID_B}/centro`), { timeout: 60_000 });
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

const TORRE: Array<{ ruta: string; titulo: RegExp }> = [
  { ruta: '/control-tower/automatizaciones', titulo: /Automatizaciones inteligentes AK/ },
  { ruta: '/control-tower/comercial', titulo: /Seguimientos comerciales/ },
  { ruta: '/control-tower/post-fiesta', titulo: /Cierre, testimonios y marketing/ },
  { ruta: '/control-tower/preparacion', titulo: /Preparación de fiestas/ },
];

for (const { ruta, titulo } of TORRE) {
  test(`${ruta} muestra su contenido real y sin errores de página`, async ({ page }) => {
    test.setTimeout(120_000);
    const erroresJs: string[] = [];
    page.on('pageerror', (e) => erroresJs.push(e.message));
    await page.goto(ruta, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: titulo })).toBeVisible({ timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    expect(page.url()).toContain(ruta);
    expect(erroresJs).toEqual([]);
  });
}

async function cortarLecturas(page: Page) {
  // La primera acción es la del portero (AuthGuard): se deja pasar; se cortan las demás.
  let idDelPortero: string | null = null;
  await page.route('**/*', async (r) => {
    const req = r.request();
    const id = req.method() === 'POST' ? req.headers()['next-action'] : undefined;
    if (id) {
      if (idDelPortero === null) idDelPortero = id;
      if (id !== idDelPortero) {
        await r.abort('internetdisconnected');
        return;
      }
    }
    await r.continue();
  });
}

test('/control-tower/comercial con la lectura caída avisa y NO dice "Todo tranquilo"', async ({ page }) => {
  test.setTimeout(120_000);
  await cortarLecturas(page);
  await page.goto('/control-tower/comercial', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Seguimientos comerciales/ })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3_000);
  await expect(page.getByText(/Todo tranquilo/)).toHaveCount(0);
});
