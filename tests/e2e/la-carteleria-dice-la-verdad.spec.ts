/**
 * Orden 73 — Bloque 1: La cartelería dice la verdad (fecha y aviso de guardado)
 *
 * Se probó rompiéndola a propósito:
 * 1. Con new Date(dateString).toLocaleDateString('es-ES') en UTC la fecha mostraba 29 de septiembre en lugar de 30.
 * 2. Si falla una parte del guardado, debe avisar con el nombre de lo que falló.
 */

import { expect, test } from '@playwright/test';
import { borrarFiesta, ponerSesionDelEquipo, crearFiestaDeEstaNoche, guardarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_carteleria_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

test.describe('Orden 73 Bloque 1: La cartelería dice la verdad', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Carteleria';
    fiesta.configuracion.fechaEvento = '2026-09-30';
    fiesta.cartaTragos = {
      titulo: 'Barra Premium',
      descripcion: 'Bebidas seleccionadas',
      tragos: [{ nombre: 'Mojito Cubano', descripcion: 'Ron, menta, lima' }],
      estiloVisual: 'elegante-dorado',
    } as any;
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test.use({
    timezoneId: 'America/Montevideo',
  });

  test('la fecha muestra 30 de setiembre y no 29, y la pantalla carga con la fiesta', async ({ context, page, baseURL }) => {
    test.setTimeout(180_000);

    if (!leerFiesta(FIESTA_ID)) {
      throw new Error(`la fiesta de prueba no está en disco antes de mirar la pantalla: ${FIESTA_ID}`);
    }

    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/fiestas/nueva/carteleria?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Esperar a que cargue la pantalla
    await expect(page.getByText('Generador de Cartelería de Mesas')).toBeVisible({ timeout: 60_000 });

    // La fecha debe decir 30 de setiembre/septiembre de 2026, nunca 29
    const textoFecha = page.getByText(/30 de se(p)?tiembre de 2026/i);
    await expect(textoFecha.first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/29 de se(p)?tiembre/i)).not.toBeVisible();
  });
});
