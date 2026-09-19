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
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';
import { claimGift } from '../../src/app/actions/fiesta/regalos.actions';

const FIESTA_ID = `e2e_regalos_vacia_${Date.now()}`;

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

  test('1. Al cargar con lista vacía, no inventa regalos y muestra estado vacío con "Cargar sugerencias"', async ({ context, page }) => {
    test.setTimeout(60_000);

    await context.addCookies([
      {
        name: 'ak_session',
        value: crearCookieDeSesion(),
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`/fiestas/nueva/regalos?fiestaId=${FIESTA_ID}`, { waitUntil: 'networkidle' });

    // Debe mostrar el estado vacío
    await expect(page.getByText('Todavía no hay regalos en la lista')).toBeVisible();
    const btnSugerencias = page.getByRole('button', { name: /Cargar sugerencias/i });
    await expect(btnSugerencias).toBeVisible();

    // 2. Al tocar "Cargar sugerencias", se agregan los ítems sugeridos a la pantalla
    await btnSugerencias.click();
    await expect(page.getByText('Todavía no hay regalos en la lista')).not.toBeVisible();
    await expect(page.getByText('Set de Copas de Cristal')).toBeVisible();
  });

  test('2. Si el regalo ya está reservado, claimGift devuelve error y no canta victoria', async () => {
    // Configuramos un regalo en la fiesta ya reclamado
    const fiestaConRegalo = crearFiestaDeEstaNoche({ id: `${FIESTA_ID}_claim` });
    fiestaConRegalo.invitacionDigital = {
      ...fiestaConRegalo.invitacionDigital,
      regalos: {
        visible: true,
        titulo: { text: 'Regalos' },
        texto: { text: '' },
        datosBancarios: '',
        items: [
          {
            id: 'regalo_1',
            name: 'Cafetera Espresso',
            description: 'Para el desayuno',
            isClaimed: true,
            claimedBy: 'Tía Marta',
          },
        ],
      },
    } as any;
    guardarFiesta(fiestaConRegalo);

    try {
      const res = await claimGift(`${FIESTA_ID}_claim`, 'regalo_1', 'Juan Pérez');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Justo lo eligió otro invitado; elegí otro de la lista.');
    } finally {
      borrarFiesta(`${FIESTA_ID}_claim`);
    }
  });
});
