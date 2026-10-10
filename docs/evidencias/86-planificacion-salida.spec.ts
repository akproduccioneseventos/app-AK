// @ts-nocheck -- Evidence spec is copied into tests/e2e in the guarded temporary workspace.
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { createPortalSession } from '../../src/lib/security/portal-session';
import admin from 'firebase-admin';
import {
  borrarFiesta,
  ponerSesionDelEquipo,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  leerFiesta,
} from './helpers/fiesta-de-prueba';

const CWD = process.cwd();
if (
  process.env.AK_ENTORNO_AISLADO !== 'true' ||
  !path.basename(CWD).startsWith('ak-entorno-aislado-') ||
  path.dirname(path.resolve(CWD)) !== path.resolve(os.tmpdir())
) {
  throw new Error('Sonda 86 bloqueada: requiere cwd TEMP\\ak-entorno-aislado-* y AK_ENTORNO_AISLADO=true.');
}

const FIESTA_ID = `e2e_plan86_${process.pid}_${Date.now()}`;
const CLAVE_PORTAL = `clave-plan86-${Date.now()}`;
const TITULO_TAREA = `Tarea plan86 ${Date.now()}`;
const TITULO_MOMENTO = `Momento plan86 ${Date.now()}`;
const app = admin.initializeApp({projectId:'demo-ak-producciones'}, `plan86-${process.pid}`);
app.firestore().settings({ignoreUndefinedProperties:true});

test.describe('Planificación de salida, fixture y consumidor', () => {
  test.beforeAll(async () => {
    if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Solo emulador demo');
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID, clavePortal: CLAVE_PORTAL });
    fiesta.configuracion.nombreEvento = `Fiesta E2E plan86 ${Date.now()}`;
    fiesta.tareas = [];
    fiesta.programa = [];
    fiesta.clientePortalExperience = { ...fiesta.clientePortalExperience, simplicityMode: false };
    fiesta.clientPortalSettings.itinerario = { visible: true };
    guardarFiesta(fiesta);
    await app.firestore().collection('fiestas').doc(FIESTA_ID).set(JSON.parse(JSON.stringify(fiesta)));
  });

  test.afterAll(async () => { borrarFiesta(FIESTA_ID); await app.firestore().collection('fiestas').doc(FIESTA_ID).delete(); await app.delete(); });

  test('crea y cambia estado de tarea en UI; fixture y lista sobreviven a recargar', async ({ page, context, baseURL }) => {
    test.setTimeout(120000);
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto(`/fiestas/nueva/tareas?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });

    await page.locator('#task-text').fill(TITULO_TAREA);
    await page.getByRole('button', { name: 'Añadir Tarea' }).click();
    await expect.poll(() => leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.texto === TITULO_TAREA)?.id, { timeout: 30000 }).toBeTruthy();
    const tarea = leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.texto === TITULO_TAREA);
    expect(tarea?.id, 'el alta desde UI persistió la tarea').toBeTruthy();

    await page.locator(`label[for="task-${tarea.id}"]`).click();
    await expect.poll(() => leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.id === tarea.id)?.completada).toBe(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(TITULO_TAREA, { exact: true })).toBeVisible();
    await expect(page.locator(`#task-${tarea.id}`)).toBeChecked();
    expect(leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.id === tarea.id)?.completada).toBe(true);
  });

  test('edita hora y visibilidad de un momento; fixture, editor y portal cliente coinciden tras recargar', async ({ page, context, baseURL, browser }) => {
    test.setTimeout(120000);
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto(`/fiestas/nueva/itinerario?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Añadir Momento' }).click();
    await page.locator('#item-hora').fill('21:37');
    await page.locator('#item-titulo').fill(TITULO_MOMENTO);
    await page.locator('#item-visible-cliente').check();
    await page.getByRole('button', { name: /guardar/i }).last().click();

    await expect.poll(() => leerFiesta(FIESTA_ID)?.programa?.find((item) => item.titulo === TITULO_MOMENTO)?.hora).toBe('21:37');
    await expect.poll(() => leerFiesta(FIESTA_ID)?.programa?.find((item) => item.titulo === TITULO_MOMENTO)?.visibleParaCliente).toBe(true);
    await page.waitForTimeout(2500);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(`21:37 - ${TITULO_MOMENTO}`, { exact: true })).toBeVisible();
    expect(leerFiesta(FIESTA_ID)?.programa?.find((item) => item.titulo === TITULO_MOMENTO)).toMatchObject({
      hora: '21:37', visibleParaCliente: true,
    });

    const cliente = await browser.newContext();
    await cliente.addCookies([{
      name: 'ak_portal_session', value: createPortalSession(FIESTA_ID, CLAVE_PORTAL),
      url: baseURL, httpOnly: true, sameSite: 'Lax',
    }]);
    await cliente.addInitScript(({ fid, key }) => {
      window.sessionStorage.setItem(`portal_auth_${fid}`, key);
    }, { fid: FIESTA_ID, key: CLAVE_PORTAL });
    const vista = await cliente.newPage();
    try {
      await vista.goto(`/portal-cliente/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
      await expect(vista.getByRole('button', { name: /Menú e Itinerario/i })).toBeVisible({ timeout: 20000 });
      await vista.getByRole('button', { name: /Menú e Itinerario/i }).click();
      await expect(vista.locator('#itinerario').getByText(TITULO_MOMENTO, { exact: true })).toBeVisible();
      await expect(vista.locator('#itinerario').getByText('21:37', { exact: true })).toBeVisible();
      expect((await cliente.cookies()).some(c => c.name === 'ak_session')).toBe(false);
    } finally { await cliente.close(); }
  });
});

// Comprobar (aprobado en 86-plan-firestore-resultados.json): archivo=src/app/(app)/fiestas/nueva/tareas/client.tsx,
// usa=handleAddTask/toggleTaskCompletion y lista Tareas del Evento; prueba=alta, estado y reload.
// Comprobar (aprobado en 86-itinerario-consumidor-resultados.json): archivo=src/app/(app)/fiestas/nueva/itinerario/page.tsx,
// usa=handleSaveItem/useAutoSave y portal src/app/portal-cliente/[id]/page.tsx muestra programa público;
// prueba=hora/visibleParaCliente, reload del editor y lectura en sesión de portal cliente.
