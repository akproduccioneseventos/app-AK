/**
 * Orden 68 — La hoja del DJ dice la verdad: la fecha y el "copiado".
 *
 * Se probó rompiéndola a propósito:
 * 1. Para la fecha: se usó new Date(dateString).toLocaleDateString('es-ES') en UTC
 *    y falló en rojo al mostrar "29 de septiembre" en lugar de "30 de septiembre".
 * 2. Para el copiado: se simuló fallo en navigator.clipboard.writeText sin mostrar
 *    el fallback manual y la prueba falló en rojo.
 * Al aplicar formatearFechaEvento y el contenedor de fallback, pasó a verde.
 */

import { expect, test } from '@playwright/test';
import { borrarFiesta, ponerSesionDelEquipo, crearFiestaDeEstaNoche, guardarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_hoja_dj_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

test.describe('Orden 68: La hoja del DJ dice la verdad', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Hoja DJ';
    // Fecha explícita: 30 de septiembre de 2026
    fiesta.configuracion.fechaEvento = '2026-09-30';
    fiesta.musica = {
      cancionEntrada: 'Entrada Triunfal',
      cancionVals: 'Vals de las Mariposas',
      playlistFiesta: 'Cumbia, Rock, No Te Va Gustar',
      listaNoReproducir: 'Reggaeton explícito',
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test.use({
    timezoneId: 'America/Montevideo',
  });

  test('la fecha muestra 30 de septiembre y si el portapapeles falla se muestra el enlace a mano', async ({ context, page, baseURL }) => {
    test.setTimeout(180_000);

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

    // 1. Simular que navigator.clipboard.writeText falla a propósito
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => Promise.reject(new Error('Permission denied')),
        },
        configurable: true,
      });
      // También deshabilitar navigator.share para forzar el path de copiado
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        configurable: true,
      });
    });

    await page.goto(`/fiestas/nueva/musica/pdf?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // 2. La fecha en pantalla dice el 30 (no el 29). La app escribe "setiembre",
    // como se dice en Uruguay, asi que se acepta con "p" y sin "p".
    const headerFecha = page.getByText(/30 de se(p)?tiembre de 2026/i);
    await expect(headerFecha).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/29 de se(p)?tiembre/i)).not.toBeVisible();

    // 3. Tocar el botón de compartir
    const btnCompartir = page.getByRole('button', { name: /Compartir/i });
    await expect(btnCompartir).toBeVisible();
    await btnCompartir.click();

    // 4. NO debe aparecer el cartel "Enlace Copiado"
    await expect(page.getByText('Enlace Copiado')).not.toBeVisible();

    // 5. SÍ debe aparecer el enlace para copiar a mano
    const fallbackBox = page.locator('[data-testid="share-url-fallback"]');
    await expect(fallbackBox).toBeVisible({ timeout: 10_000 });
    await expect(fallbackBox).toContainText('No se pudo copiar automáticamente');
    const inputUrl = fallbackBox.locator('input');
    await expect(inputUrl).toBeVisible();
    await expect(inputUrl).toHaveValue(/fiestas\/nueva\/musica\/pdf/);
  });
});
