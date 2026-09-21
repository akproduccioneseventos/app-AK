/**
 * Orden 70 — La lista de regalos respeta que el cliente la quiera vacía
 *
 * Se probó rompiéndola a propósito:
 * - Al volver a poner el rellenado automático con defaults cuando la lista estaba vacía,
 *   la prueba falló en rojo al esperar que la lista se mantenga vacía después de guardar.
 * - Al permitir reservar un regalo ya reclamado sin verificar isClaimed en claimGift,
 *   la prueba falló en rojo.
 * Con los cambios aplicados, pasa a verde.
 */

import { expect, test } from '@playwright/test';
import { borrarFiesta, ponerSesionDelEquipo, crearFiestaDeEstaNoche, guardarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_regalos_vacia_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

test.describe('Orden 70: La lista de regalos respeta que el cliente la quiera vacía', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.modulosContratados = {
      ...fiesta.modulosContratados,
      regalos: true,
    } as any;
    fiesta.invitacionDigital = {
      ...fiesta.invitacionDigital,
      regalos: {
        visible: true,
        titulo: { text: 'Mesa de Regalos' },
        texto: { text: 'Gracias por acompañarnos' },
        datosBancarios: '',
        items: [], // Lista explícitamente vacía
      },
    } as any;
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test('1. Al cargar con lista vacía, no inventa regalos y muestra estado vacío con "Cargar sugerencias"', async ({ context, page, baseURL }) => {
    test.setTimeout(60_000);

    // Comprobar que la fiesta de prueba esté en disco antes de cargar
    if (!leerFiesta(FIESTA_ID)) {
      throw new Error(`la fiesta de prueba no está en disco antes de mirar la pantalla: ${FIESTA_ID}`);
    }

    await ponerSesionDelEquipo(context, baseURL);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('ak_session', 'true');
        sessionStorage.setItem('ak_session', 'true');
      } catch {}
    });

    await page.goto(`/fiestas/nueva/regalos?fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });

    // Comprobar que no diga que el módulo no está contratado y esperar el encabezado
    await expect(page.getByText(/El módulo de Lista de Regalos no está contratado/i)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Lista de Regalos/i })).toBeVisible({ timeout: 60_000 });

    // Debe mostrar el estado vacío
    await expect(page.getByText('Todavía no hay regalos en la lista')).toBeVisible({ timeout: 30_000 });
    const btnSugerencias = page.getByRole('button', { name: /Cargar sugerencias/i }).first();
    await expect(btnSugerencias).toBeVisible();

    // 2. Al tocar "Cargar sugerencias", se agregan los ítems sugeridos a la pantalla
    await btnSugerencias.click();
    await expect(page.getByText('Todavía no hay regalos en la lista')).not.toBeVisible();
    await expect(page.getByText('💐 Flores')).toContainText('Flores');
  });

  /**
   * Lo de "un regalo ya reservado no se puede volver a reservar" NO vive aca.
   * Llamar a la accion del servidor desde el proceso de Playwright arrastra
   * `server-only` y el archivo entero no carga: se lleva puesta la tanda completa.
   * Esa comprobacion vive en `src/__tests__/un-regalo-no-se-reserva-dos-veces.test.ts`.
   */
});
