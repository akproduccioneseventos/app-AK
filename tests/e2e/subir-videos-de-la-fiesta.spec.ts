import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 275 - Videos para redes de cada fiesta.
 * En Presencia digital, el botón "Subir los videos de la fiesta" aparece y,
 * cortando la subida, la pantalla dice cuántos borradores va a crear.
 */
test.describe('Orden 275: Subir los videos de la fiesta en Presencia Digital', () => {
  test('el botón aparece y al seleccionar archivos dice cuántos borradores va a crear', async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/empresa/presencia-digital', { waitUntil: 'domcontentloaded' });

    // El botón "Subir los videos de la fiesta" aparece y es visible
    const botonSubir = page.getByRole('button', { name: /Subir los videos de la fiesta/i });
    await expect(botonSubir).toBeVisible({ timeout: 30_000 });

    // Click para desplegar el selector de archivos
    await botonSubir.click();

    const inputArchivos = page.locator('input[type="file"][data-testid="input-files-redes"]');
    await expect(inputArchivos).toBeVisible();

    // Seleccionamos un redes.json simulado con un reel y un cuadrado
    const manifestContent = JSON.stringify([
      { estacion: 'fotocabina', formato: 'reel', archivo: 'fotocabina-reel.mp4' },
      { estacion: 'plataforma360', formato: 'cuadrado', archivo: '360-cuadrado.mp4' },
    ]);

    await inputArchivos.setInputFiles([
      {
        name: 'redes.json',
        mimeType: 'application/json',
        buffer: Buffer.from(manifestContent),
      },
      {
        name: 'fotocabina-reel.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('video-dummy-1'),
      },
      {
        name: '360-cuadrado.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('video-dummy-2'),
      },
    ]);

    // La pantalla dice cuántos borradores va a crear: 1 reel (3) + 1 cuadrado (1) = 4
    const conteo = page.locator('[data-testid="conteo-borradores"]');
    await expect(conteo).toBeVisible();
    await expect(conteo).toContainText('Va a crear 4 borradores para redes');

    // Cortando la subida: tocamos cancelar y no se envía nada
    const botonCancelar = page.getByRole('button', { name: /Cancelar/i });
    await expect(botonCancelar).toBeVisible();
    await botonCancelar.click();

    // La sección de subida se cierra
    await expect(inputArchivos).not.toBeVisible();
  });
});
