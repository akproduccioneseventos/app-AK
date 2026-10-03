import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * El video resumen dura lo que promete (orden 115, 3/10/2026).
 *
 * La prueba vieja miraba la cuenta (`calcularDuracionVideoResumen`) y el peso del archivo, y daba
 * verde con una muestra de 141 segundos. Esta abre el archivo en el navegador y mide cuánto dura
 * de verdad. Con la muestra de 141 s se pone en rojo.
 */
test('la muestra del video resumen dura entre 60 y 90 segundos', async ({ page }) => {
  const archivo = path.join(process.cwd(), 'docs/evidencias/video-resumen-muestra.webm');
  const datos = fs.readFileSync(archivo).toString('base64');
  await page.setContent('<video id="v" muted></video>');
  const duracion = await page.evaluate(async (base64) => {
    const v = document.getElementById('v') as HTMLVideoElement;
    v.src = `data:video/webm;base64,${base64}`;
    await new Promise((listo) => { v.onloadedmetadata = listo; });
    // MediaRecorder no escribe la duración: hay que ir al final para que el navegador la calcule.
    if (!Number.isFinite(v.duration)) {
      v.currentTime = 1e9;
      await new Promise((listo) => { v.ontimeupdate = listo; });
    }
    return v.duration;
  }, datos);
  expect(duracion).toBeGreaterThanOrEqual(60);
  expect(duracion).toBeLessThanOrEqual(90);
});
