import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  crearPermisoDeEstacion,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Si la fiesta pide permiso, al invitado se le pregunta. Y si no, no.
 *
 * El ajuste "pedir consentimiento" existía en la pantalla del equipo desde hacía
 * rato y **no lo leía nadie**: se marcaba, se guardaba, y al invitado no se le
 * preguntaba nada. La única vez que se pedía permiso era en el modo con
 * inteligencia artificial, y estaba escrito a mano.
 *
 * Esta prueba abre el Espejo Mágico de las dos maneras y mira el resultado en
 * pantalla, que es lo único que importa: **con el permiso pedido, el botón de
 * sacar la foto está apagado hasta que el invitado acepta.**
 *
 * La pantalla que prueba este archivo es `/evento/espejo-magico/[fiestaId]`.
 */

function fiestaConPermiso(pide: boolean, id: string) {
  const fiesta = crearFiestaDeEstaNoche({ id });
  const others = (fiesta as unknown as { others?: Record<string, unknown> }).others || {};
  (fiesta as unknown as { others: Record<string, unknown> }).others = {
    ...others,
    entretenimiento: {
      modules: {
        espejoMagicoFoto: { enabled: true, consentRequired: pide },
      },
    },
  };
  guardarFiesta(fiesta as never);
  return fiesta;
}

const CON = `e2e_espejo_con_${Date.now()}`;
const SIN = `e2e_espejo_sin_${Date.now()}`;

test.afterAll(() => {
  borrarFiesta(CON);
  borrarFiesta(SIN);
});

test('con el permiso pedido, no se puede sacar la foto hasta aceptar', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  fiestaConPermiso(true, CON);

  const acceso = crearPermisoDeEstacion(CON, 'espejoMagicoFoto');
  await page.goto(`/evento/espejo-magico/${CON}?mode=foto&access=${acceso}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(4_000);

  // El invitado tiene que ver de qué se trata, en criollo.
  await expect(
    page.getByText(/Acepto que mi foto se muestre en la pantalla/i),
    'se le explica al invitado qué está aceptando',
  ).toBeVisible();

  const sacar = page.getByRole('button', { name: /sacar|disparar|foto/i }).first();
  await expect(sacar, 'sin aceptar, no se puede sacar la foto').toBeDisabled();

  await page.getByRole('checkbox').first().check();
  await expect(sacar, 'aceptando, ya se puede').toBeEnabled();
});

test('sin el permiso pedido, la foto sale sin preguntar nada', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  fiestaConPermiso(false, SIN);

  const acceso = crearPermisoDeEstacion(SIN, 'espejoMagicoFoto');
  await page.goto(`/evento/espejo-magico/${SIN}?mode=foto&access=${acceso}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(4_000);

  // Sin el ajuste puesto, no se le hace perder tiempo al invitado.
  await expect(
    page.getByText(/Acepto que mi foto se muestre en la pantalla/i),
  ).toHaveCount(0);

  const sacar = page.getByRole('button', { name: /sacar|disparar|foto/i }).first();
  await expect(sacar, 'se puede sacar la foto directamente').toBeEnabled();
});
