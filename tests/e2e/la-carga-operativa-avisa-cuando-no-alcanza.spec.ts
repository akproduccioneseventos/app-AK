/**
 * Orden 65 — La carga operativa avisa cuando no alcanza el equipo.
 *
 * Se probó rompiéndola a propósito:
 * Se quitó temporalmente la llamada a checkAssetConflicts dentro de
 * handleItemQuantityCommit en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx,
 * y la prueba falló en rojo porque el cartel "Falta Stock" nunca apareció al
 * escribir 12 a mano. Al restaurar la llamada, pasó a verde.
 */

import { expect, test } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_carga_stock_${Date.now()}`;

test.describe('Orden 65: La carga operativa avisa cuando no alcanza el equipo', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Carga Operativa Stock';
    fiesta.listaDeCargaOperativa = {
      categorias: [
        {
          id: 'cat-sonido',
          nombre: 'Sonido e Iluminación',
          items: [
            {
              id: 'item-parlantes-1',
              nombre: 'Parlantes JBL EON',
              cantidad: '5',
              unidad: 'Uds.',
              cargado: false,
              hasConflict: false,
              availableStockAtDate: 10,
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

  test('al cambiar la cantidad a mano a un número mayor al disponible aparece "Falta Stock" y al bajarlo desaparece', async ({ context, page, baseURL }) => {
    test.setTimeout(60_000);

    // Inyectar sesión de administrador
    await context.addCookies([
      {
        name: 'ak_session',
        value: crearCookieDeSesion(),
        url: baseURL!,
      },
    ]);

    await page.goto(`/fiestas/nueva/carga-operativa?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Esperar a que la lista cargue
    const inputCantidad = page.locator('input[placeholder="Cant."]').first();
    await expect(inputCantidad).toBeVisible({ timeout: 20_000 });
    await expect(inputCantidad).toHaveValue('5');

    // Inicialmente no debe haber cartel de Falta Stock
    await expect(page.getByText('Falta Stock')).not.toBeVisible();

    // 1. Escribir 12 a mano (supera los 10 disponibles)
    await inputCantidad.fill('12');
    await inputCantidad.blur();

    // 2. Comprobar que aparece el cartel "Falta Stock" sin recargar
    const cartelFaltaStock = page.getByText('Falta Stock');
    await expect(cartelFaltaStock).toBeVisible({ timeout: 10_000 });

    // 3. Bajar la cantidad a 8 (dentro del stock de 10)
    await inputCantidad.fill('8');
    await inputCantidad.blur();

    // 4. Comprobar que el cartel desaparece
    await expect(cartelFaltaStock).not.toBeVisible({ timeout: 10_000 });
  });
});
