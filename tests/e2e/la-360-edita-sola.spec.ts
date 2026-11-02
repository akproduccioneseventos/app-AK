import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 264: La 360 edita sola.
 *
 * Prueba de navegador para la estación 360 con cámara simulada donde se graba
 * y el <video> final resultante tiene una duración mayor a la grabación original
 * gracias a la línea de tiempo con arranque normal, cámara lenta y boomerang.
 */

const chromiumInstalado = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({
  launchOptions: {
    ...(chromiumInstalado ? { executablePath: chromiumInstalado } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

const FIESTA_ID = `e2e_360_edita_sola_${Date.now()}`;
const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });

if (!fiesta.others) (fiesta as any).others = {};
if (!(fiesta as any).others.entretenimiento) (fiesta as any).others.entretenimiento = {};
if (!(fiesta as any).others.entretenimiento.modules) (fiesta as any).others.entretenimiento.modules = {};

(fiesta as any).others.entretenimiento.modules.plataforma360 = {
  enabled: true,
  countdownSeconds: 1,
  recordingDurationSeconds: 10,
  reviewSeconds: 180,
  vueltas360: 2,
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

async function enchufarCamaraAnimada(page: any) {
  await page.addInitScript(() => {
    const armar = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 720;
      lienzo.height = 1280;
      const ctx = lienzo.getContext('2d');
      let cuadro = 0;
      const reloj = setInterval(() => {
        if (!ctx) return;
        ctx.fillStyle = cuadro++ % 2 ? '#27ad78' : '#7c3aed';
        ctx.fillRect(0, 0, 720, 1280);
        ctx.fillStyle = '#ffd447';
        ctx.fillRect((cuadro * 9) % 500, 200, 150, 150);
      }, 33);
      const senal = lienzo.captureStream(30);
      for (const pista of senal.getTracks()) {
        pista.addEventListener('ended', () => clearInterval(reloj));
      }
      return senal;
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armar(),
        enumerateDevices: async () => [
          { deviceId: 'cam360', kind: 'videoinput', label: 'Cámara 360 Simulada', groupId: 'g360' },
        ],
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
}

test.describe('Orden 264 — La 360 edita sola', () => {
  test('la grabación de 10s genera un video final con duración mayor a la grabación original', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraAnimada(page);

    const permiso = crearPermisoDeEstacion(fiesta.id, 'plataforma360');
    await page.goto(`/evento/plataforma-360/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    // Verificar que la cámara cargó y el botón de grabación está disponible
    const btnGrabar = page.getByRole('button', { name: /grabar video/i }).first();
    await expect(btnGrabar).toBeVisible({ timeout: 25_000 });

    // Iniciar la grabación
    await btnGrabar.click();

    // Debe mostrar la cuenta regresiva e iniciar la captura
    await expect(page.getByText(/¡A bailar!|Grabando/i).or(page.getByText(/segundo/i))).toBeVisible({ timeout: 15_000 });

    // Esperar a que procese y aparezca la vista previa final del video editado
    await expect(page.getByText(/Previsualizacion lista/i)).toBeVisible({ timeout: 60_000 });

    const videoPreview = page.locator('video[src^="blob:"]').first();
    await expect(videoPreview).toBeVisible();

    // Evaluar la duración del video final generado
    const duracionFinal = await videoPreview.evaluate(async (el) => {
      const v = el as HTMLVideoElement;
      if (isFinite(v.duration) && v.duration > 0) return v.duration;
      v.currentTime = 1e101;
      await new Promise((r) => setTimeout(r, 250));
      return isFinite(v.duration) && v.duration > 0 ? v.duration : v.currentTime;
    });

    // La grabación original fue de 10 segundos
    const duracionOriginal = 10;
    expect(duracionFinal).toBeGreaterThan(duracionOriginal);
    expect(duracionFinal).toBeGreaterThanOrEqual(12);
    expect(duracionFinal).toBeLessThanOrEqual(21);
  });
});
