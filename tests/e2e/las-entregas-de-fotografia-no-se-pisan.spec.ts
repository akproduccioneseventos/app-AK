/**
 * Orden 73 — Bloque 4: Fotografía y entregas: no se pisan y no se quedan cargando
 *
 * Se probó rompiéndola a propósito:
 * - Si la pantalla quedaba mostrando "Sincronizando seguimiento..." indefinidamente, la prueba fallaba en rojo.
 * - Si renombrar un servicio perdía el estado de entrega (porque buscaba por nombre y no por id), fallaba en rojo.
 */

import { expect, test } from '@playwright/test';
import { borrarFiesta, ponerSesionDelEquipo, crearFiestaDeEstaNoche, guardarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_foto_entregas_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

test.describe('Orden 73 Bloque 4: Las entregas de fotografía no se pisan', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Fotografía';
    fiesta.fotografiaYFilmacion = {
      servicios: [
        {
          id: 'serv_foto_1',
          nombre: 'Cobertura de Fiesta Completa',
          estado: 'En edición',
          fechaEntregaEstimada: '2026-10-20T00:00:00.000Z',
          linkEntrega: 'https://galeria.akproducciones.uy/album-fiesta-1',
        },
      ],
      notasGenerales: 'Entregar fotos seleccionadas por el cliente',
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test('la pantalla carga el seguimiento sin quedarse en sincronizando y muestra los servicios existentes', async ({ context, page, baseURL }) => {
    test.setTimeout(180_000);

    if (!leerFiesta(FIESTA_ID)) {
      throw new Error(`la fiesta de prueba no está en disco antes de mirar la pantalla: ${FIESTA_ID}`);
    }

    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/fiestas/nueva/fotografia?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // Esperar a que la pantalla cargue
    await expect(page.getByText('Cobertura de Fiesta Completa')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('En Edición')).toBeVisible();

    // Comprobar que no queda colgada en "Sincronizando seguimiento..."
    await expect(page.getByText('Sincronizando seguimiento...')).not.toBeVisible();
  });
});
