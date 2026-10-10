# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 86-planificacion-salida.spec.ts >> Planificación de salida, fixture y consumidor >> edita hora y visibilidad de un momento; fixture, editor y portal cliente coinciden tras recargar
- Location: tests\e2e\86-planificacion-salida.spec.ts:58:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "21:37"
Received: undefined

Call Log:
- Timeout 45000ms exceeded while waiting on the predicate
```

# Test source

```ts
  1   | // @ts-nocheck -- Evidence spec is copied into tests/e2e in the guarded temporary workspace.
  2   | import os from 'node:os';
  3   | import path from 'node:path';
  4   | import { expect, test } from '@playwright/test';
  5   | import { createPortalSession } from '../../src/lib/security/portal-session';
  6   | import {
  7   |   borrarFiesta,
  8   |   ponerSesionDelEquipo,
  9   |   crearFiestaDeEstaNoche,
  10  |   guardarFiesta,
  11  |   leerFiesta,
  12  | } from './helpers/fiesta-de-prueba';
  13  | 
  14  | const CWD = process.cwd();
  15  | if (
  16  |   process.env.AK_ENTORNO_AISLADO !== 'true' ||
  17  |   !path.basename(CWD).startsWith('ak-entorno-aislado-') ||
  18  |   path.dirname(path.resolve(CWD)) !== path.resolve(os.tmpdir())
  19  | ) {
  20  |   throw new Error('Sonda 86 bloqueada: requiere cwd TEMP\\ak-entorno-aislado-* y AK_ENTORNO_AISLADO=true.');
  21  | }
  22  | 
  23  | const FIESTA_ID = `e2e_plan86_${process.pid}_${Date.now()}`;
  24  | const CLAVE_PORTAL = `clave-plan86-${Date.now()}`;
  25  | const TITULO_TAREA = `Tarea plan86 ${Date.now()}`;
  26  | const TITULO_MOMENTO = `Momento plan86 ${Date.now()}`;
  27  | 
  28  | test.describe('Planificación de salida, fixture y consumidor', () => {
  29  |   test.beforeAll(() => {
  30  |     const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID, clavePortal: CLAVE_PORTAL });
  31  |     fiesta.configuracion.nombreEvento = `Fiesta E2E plan86 ${Date.now()}`;
  32  |     fiesta.tareas = [];
  33  |     fiesta.programa = [];
  34  |     guardarFiesta(fiesta);
  35  |   });
  36  | 
  37  |   test.afterAll(() => borrarFiesta(FIESTA_ID));
  38  | 
  39  |   test('crea y cambia estado de tarea en UI; fixture y lista sobreviven a recargar', async ({ page, context, baseURL }) => {
  40  |     test.setTimeout(120000);
  41  |     await ponerSesionDelEquipo(context, baseURL);
  42  |     await page.goto(`/fiestas/nueva/tareas?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  43  | 
  44  |     await page.locator('#task-text').fill(TITULO_TAREA);
  45  |     await page.getByRole('button', { name: 'Añadir Tarea' }).click();
  46  |     await expect.poll(() => leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.texto === TITULO_TAREA)?.id, { timeout: 30000 }).toBeTruthy();
  47  |     const tarea = leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.texto === TITULO_TAREA);
  48  |     expect(tarea?.id, 'el alta desde UI persistió la tarea').toBeTruthy();
  49  | 
  50  |     await page.locator(`label[for="task-${tarea.id}"]`).click();
  51  |     await expect.poll(() => leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.id === tarea.id)?.completada).toBe(true);
  52  |     await page.reload({ waitUntil: 'domcontentloaded' });
  53  |     await expect(page.getByText(TITULO_TAREA, { exact: true })).toBeVisible();
  54  |     await expect(page.locator(`#task-${tarea.id}`)).toBeChecked();
  55  |     expect(leerFiesta(FIESTA_ID)?.tareas?.find((item) => item.id === tarea.id)?.completada).toBe(true);
  56  |   });
  57  | 
  58  |   test('edita hora y visibilidad de un momento; fixture, editor y portal cliente coinciden tras recargar', async ({ page, context, baseURL, browser }) => {
  59  |     test.setTimeout(120000);
  60  |     await ponerSesionDelEquipo(context, baseURL);
  61  |     await page.goto(`/fiestas/nueva/itinerario?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  62  |     await page.getByRole('button', { name: 'Añadir Momento' }).click();
  63  |     await page.locator('#item-hora').fill('21:37');
  64  |     await page.locator('#item-titulo').fill(TITULO_MOMENTO);
  65  |     await page.locator('#item-visible-cliente').check();
  66  |     await page.getByRole('button', { name: /guardar/i }).last().click();
  67  | 
> 68  |     await expect.poll(() => leerFiesta(FIESTA_ID)?.programa?.find((item) => item.titulo === TITULO_MOMENTO)?.hora).toBe('21:37');
      |                                                                                                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  69  |     await expect.poll(() => leerFiesta(FIESTA_ID)?.programa?.find((item) => item.titulo === TITULO_MOMENTO)?.visibleParaCliente).toBe(true);
  70  |     await page.waitForTimeout(2500);
  71  |     await page.reload({ waitUntil: 'domcontentloaded' });
  72  |     await expect(page.getByText(`21:37 - ${TITULO_MOMENTO}`, { exact: true })).toBeVisible();
  73  |     expect(leerFiesta(FIESTA_ID)?.programa?.find((item) => item.titulo === TITULO_MOMENTO)).toMatchObject({
  74  |       hora: '21:37', visibleParaCliente: true,
  75  |     });
  76  | 
  77  |     const cliente = await browser.newContext();
  78  |     await cliente.addCookies([{
  79  |       name: 'ak_portal_session', value: createPortalSession(FIESTA_ID, CLAVE_PORTAL),
  80  |       url: baseURL, httpOnly: true, sameSite: 'Lax',
  81  |     }]);
  82  |     await cliente.addInitScript(({ fid, key }) => {
  83  |       window.sessionStorage.setItem(`portal_auth_${fid}`, key);
  84  |     }, { fid: FIESTA_ID, key: CLAVE_PORTAL });
  85  |     const vista = await cliente.newPage();
  86  |     try {
  87  |       await vista.goto(`/portal-cliente/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  88  |       await vista.getByRole('button', { name: /Menú e Itinerario/i }).click();
  89  |       await expect(vista.locator('#itinerario').getByText(TITULO_MOMENTO, { exact: true })).toBeVisible();
  90  |       await expect(vista.locator('#itinerario').getByText('21:37', { exact: true })).toBeVisible();
  91  |       expect((await cliente.cookies()).some(c => c.name === 'ak_session')).toBe(false);
  92  |     } finally { await cliente.close(); }
  93  |   });
  94  | });
  95  | 
  96  | // Comprobar (pendiente de ejecutar): archivo=src/app/(app)/fiestas/nueva/tareas/client.tsx,
  97  | // usa=handleAddTask/toggleTaskCompletion y lista Tareas del Evento; prueba=alta, estado y reload.
  98  | // Comprobar (pendiente de ejecutar): archivo=src/app/(app)/fiestas/nueva/itinerario/page.tsx,
  99  | // usa=handleSaveItem/useAutoSave y portal src/app/portal-cliente/[id]/page.tsx muestra programa público;
  100 | // prueba=hora/visibleParaCliente, reload del editor y lectura en sesión de portal cliente.
  101 | 
```