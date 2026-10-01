import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  ponerSesionDelEquipo,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  leerFiesta,
} from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_reunion_org_${process.pid}_${Date.now()}`;

test.describe('Orden 95: La reunión de organización guarda donde corresponde', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.musica = {
      cancionEntrada: '',
      cancionVals: '',
      cancionesTortaBrindis: [],
      playlistFiesta: '',
      listaNoReproducir: '',
      sugerenciasInvitados: '',
    };
    fiesta.reuniones = [];
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test('completar la canción de entrada en el cuestionario la muestra en música y cerrar reunión crea una reunión con acuerdos', async ({
    context,
    page,
    baseURL,
  }) => {
    test.setTimeout(90_000);

    if (!leerFiesta(FIESTA_ID)) {
      throw new Error(`la fiesta de prueba no está en disco: ${FIESTA_ID}`);
    }

    await ponerSesionDelEquipo(context, baseURL);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('ak_session', 'true');
        sessionStorage.setItem('ak_session', 'true');
      } catch {}
    });

    // 1. Ir a la pantalla de reunión de organización
    await page.goto(`/fiestas/nueva/reunion-organizacion?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // 2. Completar la canción de entrada
    const inputEntrada = page.locator('#cancionEntrada');
    await expect(inputEntrada).toBeVisible({ timeout: 15_000 });
    await inputEntrada.fill('Viva La Vida - Coldplay');

    // 3. Cerrar la reunión
    const btnCerrar = page.getByTestId('btn-cerrar-reunion');
    await expect(btnCerrar).toBeVisible();
    await btnCerrar.click();

    // Esperar mensaje toast de éxito o actualización
    await expect(page.locator('text=¡Reunión cerrada con éxito!').first()).toBeVisible({ timeout: 15_000 });

    // 4. Verificar en el archivo de la fiesta que se guardó la canción de entrada y la reunión
    const fiestaEnDisco = leerFiesta(FIESTA_ID);
    expect(fiestaEnDisco?.musica?.cancionEntrada).toBe('Viva La Vida - Coldplay');
    expect(fiestaEnDisco?.reuniones?.length).toBeGreaterThanOrEqual(1);
    const ultimaReunion = fiestaEnDisco?.reuniones?.[fiestaEnDisco.reuniones.length - 1];
    expect(ultimaReunion?.titulo).toContain('Reunión de Organización');
    expect(ultimaReunion?.acuerdos).toContain('Viva La Vida - Coldplay');

    // 5. Ir a la pantalla de música de la fiesta y verificar que muestra la canción guardada
    await page.goto(`/fiestas/nueva/musica?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    const inputMusicaEntrada = page.locator('input[placeholder*="canción"], input#cancionEntrada, input[name="cancionEntrada"]').first();
    // O buscar por valor en cualquier input
    const inputConValor = page.locator('input[value="Viva La Vida - Coldplay"]');
    await expect(inputConValor).toBeVisible({ timeout: 15_000 });
  });
});
