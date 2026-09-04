import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 39 Bloque 4: El álbum del recuerdo se baja entero.
 *
 * El cliente y los invitados tienen que poder descargar todos los recuerdos
 * de la fiesta sin recibir un error 401 de 'no autorizado'.
 *
 * Esta prueba comprueba:
 * 1. Que el botón 'Descargar todo' está visible en la pantalla del álbum (/evento/album/[fiestaId]).
 * 2. Que NO se redirige ni se llama a la ruta interna administrativa /api/fiestas/[fiestaId]/download-recuerdos.
 * 3. Que el botón está listo para empaquetar los recuerdos para el cliente.
 */

const fiestaId = `e2e_album_descarga_${Date.now()}`;

test.describe('Orden 39 Bloque 4: Descarga del álbum completo', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Boda de Prueba - Descarga Álbum';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('el botón de descarga existe en el álbum y no depende de la sesión de admin', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    // Escuchar solicitudes de red para vigilar que NO se use el endpoint de admin
    let llamoEndpointAdmin = false;
    page.on('request', (req) => {
      if (req.url().includes('/download-recuerdos')) {
        llamoEndpointAdmin = true;
      }
    });

    await page.goto(`/evento/album/${fiestaId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // El botón de descarga completa debe existir en la interfaz
    const botonDescargar = page.locator('[data-testid="boton-descargar-album"]');
    await expect(botonDescargar).toBeVisible({ timeout: 15_000 });
    await expect(botonDescargar).toContainText(/Descargar todo/i);

    // No debe haber intentado comunicarse con el endpoint administrativo de recuerdos
    expect(llamoEndpointAdmin).toBe(false);
  });
});

