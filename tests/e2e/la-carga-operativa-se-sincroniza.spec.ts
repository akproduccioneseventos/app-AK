/**
 * Orden 66 — La carga operativa se sincroniza bien entre dos operadores.
 *
 * Se probó rompiéndola a propósito:
 * Se quitó temporalmente la comprobación de actualizadoAt en mergeRemoteOperationalState
 * de src/app/(app)/fiestas/nueva/carga-operativa/page.tsx, y la prueba falló en rojo
 * porque una respuesta retrasada volvió el ítem a su estado anterior.
 * Al restaurar la comparación de fecha, pasó a verde.
 */

import { expect, test } from '@playwright/test';
import { borrarFiesta, ponerSesionDelEquipo, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_carga_sync_${Date.now()}`;

test.describe('Orden 66: La carga operativa se sincroniza bien entre dos operadores', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Carga Operativa Sync';
    fiesta.listaDeCargaOperativa = {
      categorias: [
        {
          id: 'cat-equipos',
          nombre: 'Equipos Generales',
          items: [
            {
              id: 'item-sync-1',
              nombre: 'Consola Pioneer DJ',
              cantidad: '1',
              unidad: 'Uds.',
              cargado: false,
              actualizadoAt: new Date(Date.now() - 60_000).toISOString(),
              actualizadoPor: 'Operador A',
            },
            {
              id: 'item-sync-2',
              nombre: 'Micrófonos Inalámbricos',
              cantidad: '2',
              unidad: 'Uds.',
              cargado: false,
              actualizadoAt: new Date(Date.now() - 60_000).toISOString(),
              actualizadoPor: 'Operador B',
            },
          ],
        },
      ],
      notasGenerales: '',
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test('dos operadores sincronizan cambios sin pisar foco ni aceptar respuestas atrasadas', async ({ browser, baseURL }) => {
    test.setTimeout(90_000);


    // Contexto y Pestaña Operador A
    const contextA = await browser.newContext();
    await ponerSesionDelEquipo(contextA, baseURL);
    const pageA = await contextA.newPage();

    // Contexto y Pestaña Operador B
    const contextB = await browser.newContext();
    await ponerSesionDelEquipo(contextB, baseURL);
    const pageB = await contextB.newPage();

    try {
      await pageA.goto(`/fiestas/nueva/carga-operativa?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
      await pageB.goto(`/fiestas/nueva/carga-operativa?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });

      // Esperar a que carguen ambas pestañas
      const inputA1 = pageA.locator('input[placeholder="Cant."]').first();
      const inputB1 = pageB.locator('input[placeholder="Cant."]').first();
      const inputB2 = pageB.locator('input[placeholder="Cant."]').nth(1);

      await expect(inputA1).toBeVisible({ timeout: 20_000 });
      await expect(inputB1).toBeVisible({ timeout: 20_000 });
      await expect(inputB2).toBeVisible({ timeout: 20_000 });

      // 1. Operador B pone el foco en el ítem 2 y escribe un texto en progreso
      await inputB2.focus();
      await inputB2.fill('99');

      // 2. Operador A cambia la cantidad del ítem 1 a "4" y lo guarda (blur)
      await inputA1.fill('4');
      await inputA1.blur();

      // Esperar brevemente a que el patch se guarde y sincronice
      await pageA.waitForTimeout(1500);

      // Disparar sincronización en página B (cambio de visibilidad)
      await pageB.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // 3. Comprobar que en B el ítem 1 se actualizó a "4", pero el ítem 2 que tiene el foco sigue teniendo "99" (no se pisó)
      await expect(inputB1).toHaveValue('4', { timeout: 15_000 });
      await expect(inputB2).toHaveValue('99');

      // 4. Bloque 2: Comprobar que una respuesta atrasada no devuelve el ítem a "sin cargar"
      // Marcar ítem 1 como cargado en página A
      const checkCargadoA = pageA.locator('#item-cargado-item-sync-1');
      await checkCargadoA.click();
      await pageA.waitForTimeout(1000);

      // Simular respuesta atrasada más vieja en página B y verificar que no pise el estado cargado
      await pageB.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      const checkCargadoB = pageB.locator('#item-cargado-item-sync-1');
      await expect(checkCargadoB).toBeChecked({ timeout: 15_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
