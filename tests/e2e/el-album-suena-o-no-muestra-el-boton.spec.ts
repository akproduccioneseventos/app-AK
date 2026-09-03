import { expect, test } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Devolución — La música del álbum suena o no muestra el botón.
 *
 * Se comprueba:
 * 1. Con una fiesta sin canción cargada, el botón de música NO aparece.
 *    (Regla del negocio: nunca un botón que no hace nada).
 * 2. Con una fiesta con canción cargada, el botón SÍ aparece y el reproductor
 *    apunta a esa canción exacta.
 * 3. Arranca en silencio (para no asustar al invitado) y al tocar el botón
 *    comienza a reproducir.
 */

test.describe('La música del álbum: suena la canción de la fiesta o no hay botón', () => {
  let fiestaSinCancionId: string;
  let fiestaConCancionId: string;
  const CANCION_URL_PRUEBA = 'https://cdn.example.com/cancion-especial-fiesta.mp3';

  test.beforeAll(() => {
    // 1. Fiesta sin canción
    const fiestaSin = crearFiestaDeEstaNoche({
      id: `e2e_album_sin_${Date.now()}`,
    });
    delete (fiestaSin as any).cancionUrl;
    delete (fiestaSin as any).musicaFondoUrl;
    if (fiestaSin.socialGallerySettings) {
      delete (fiestaSin.socialGallerySettings as any).cancionUrl;
      delete (fiestaSin.socialGallerySettings as any).musicaFondoUrl;
    }
    fiestaSinCancionId = fiestaSin.id;
    guardarFiesta(fiestaSin);

    // 2. Fiesta con canción
    const fiestaCon = crearFiestaDeEstaNoche({
      id: `e2e_album_con_${Date.now()}`,
    });
    fiestaCon.cancionUrl = CANCION_URL_PRUEBA;
    if (fiestaCon.socialGallerySettings) {
      fiestaCon.socialGallerySettings.cancionUrl = CANCION_URL_PRUEBA;
    }
    fiestaConCancionId = fiestaCon.id;
    guardarFiesta(fiestaCon);
  });

  test.afterAll(() => {
    if (fiestaSinCancionId) borrarFiesta(fiestaSinCancionId);
    if (fiestaConCancionId) borrarFiesta(fiestaConCancionId);
  });

  test('1. Con una fiesta sin canción cargada, el botón de música no aparece', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto(`/evento/album/${fiestaSinCancionId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    // El botón de música no debe aparecer ni existir en el DOM
    const botonMusica = page.locator('[data-testid="boton-musica-album"]');
    await expect(botonMusica).toHaveCount(0);

    // Tampoco debe existir el elemento de audio de fondo
    const audioElement = page.locator('audio[data-testid="audio-fondo-album"]');
    await expect(audioElement).toHaveCount(0);
  });

  test('2. Con una canción cargada, el botón aparece y el reproductor apunta a esa canción', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    await page.goto(`/evento/album/${fiestaConCancionId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);

    // 1. El botón de música debe ser visible
    const botonMusica = page.locator('[data-testid="boton-musica-album"]');
    await expect(botonMusica).toBeVisible();
    await expect(botonMusica).toContainText(/Música/i);

    // 2. El reproductor existe y apunta exactamente a la canción de la fiesta
    const audioElement = page.locator('audio[data-testid="audio-fondo-album"]');
    await expect(audioElement).toBeAttached();
    const src = await audioElement.getAttribute('src');
    expect(src).toBe(CANCION_URL_PRUEBA);

    // 3. Arranca en silencio (paused = true)
    const initiallyPaused = await audioElement.evaluate((el: HTMLAudioElement) => el.paused);
    expect(initiallyPaused).toBe(true);

    // 4. Mockeamos play() en el navegador para evitar políticas de autoplay en headless
    await page.evaluate(() => {
      const audio = document.querySelector('audio[data-testid="audio-fondo-album"]') as HTMLAudioElement;
      if (audio) {
        audio.play = () => {
          Object.defineProperty(audio, 'paused', { value: false, writable: true });
          audio.dispatchEvent(new Event('play'));
          return Promise.resolve();
        };
      }
    });

    // 5. Al hacer click en el botón de música, comienza a reproducir
    await botonMusica.click();
    await expect(botonMusica).toContainText(/sonando/i);

    const isPlaying = await audioElement.evaluate((el: HTMLAudioElement) => !el.paused);
    expect(isPlaying).toBe(true);
  });
});
