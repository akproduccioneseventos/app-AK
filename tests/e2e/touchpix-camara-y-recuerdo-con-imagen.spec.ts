import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, crearPermisoDeEstacion, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Orden 145 (Codex, ENT93-CAM): la foto de Touchpix no puede salir negra.
 *
 * El <video> de la camara esta oculto con `autoplay` y el navegador lo dejaba en pausa con la senal
 * viva (640x480, readyState 4): lo dibujado era negro, aunque la captura, la descarga y el archivo
 * "salieran bien". Es el mismo defecto que ya se arreglo en la fotocabina (orden 140).
 *
 * Aca se mira el RESULTADO, con el invitado (permiso acotado, sin cookie del equipo):
 *  1. camara NATIVA falsa de Chromium: la foto trae pixeles con imagen;
 *  2. la camara de Codex (azul-verde con un cuadro amarillo, de canvas.captureStream): la foto
 *     trae mas de 500 pixeles de ESA senal, fuera del pie, y tras recargar la pantalla (segunda
 *     captura, camara nueva) tambien;
 *  3. si la camara no entrega ningun cuadro: aviso visible + "Reintentar camara" y NINGUNA foto.
 *
 * Probado rompiendolo: sacando `asegurarCuadroDeVideo` de `captureRawPhoto` (Touchpix) la foto
 * sale negra y 1 y 2 se ponen en rojo; sacando el aviso o el boton, 3 se pone en rojo.
 * No se bloquean fotos oscuras reales: los colores se miran SOLO en la prueba.
 */

// Al pisar launchOptions se pierde el navegador que fija playwright.config.ts: se repone aca.
const chromiumInstalado = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({
  launchOptions: {
    ...(chromiumInstalado ? { executablePath: chromiumInstalado } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

const ID = `e2e_touchpix145_${Date.now()}`;
const fiesta = crearFiestaDeEstaNoche({ id: ID });
fiesta.others = {
  ...fiesta.others,
  entretenimiento: {
    ...fiesta.others?.entretenimiento,
    modules: {
      ...fiesta.others?.entretenimiento?.modules,
      espejoMagicoIA: {
        enabled: true,
        countdownSeconds: 1,
        segundosCuentaRegresiva: 1,
        reviewSeconds: 180,
        allowGuestRetake: true,
        maxRetakes: 3,
        consentRequired: false,
        autoPublish: false,
      },
    },
  },
} as any;

test.afterAll(() => {
  borrarFiesta(ID);
});

/** Camara de Codex: fondo azul-verde alterno y un cuadro amarillo que se mueve. Video de canvas. */
async function camaraDeColores(page: Page) {
  await page.addInitScript(() => {
    const armar = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 640;
      lienzo.height = 480;
      const ctx = lienzo.getContext('2d')!;
      let cuadro = 0;
      const reloj = setInterval(() => {
        ctx.fillStyle = cuadro++ % 2 ? '#27ad78' : '#2586cc';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#ffd447';
        ctx.fillRect((cuadro * 9) % 500, 100, 100, 100);
      }, 33);
      const senal = lienzo.captureStream(30);
      for (const pista of senal.getTracks()) pista.addEventListener('ended', () => clearInterval(reloj));
      return senal;
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armar(),
        enumerateDevices: async () => [{ deviceId: 'qa145', kind: 'videoinput', label: 'Camara ficticia', groupId: 'qa145' }],
        addEventListener() {},
        removeEventListener() {},
      },
    });
  });
}

/** Cuenta pixeles con imagen DENTRO de la foto (sin el pie de marca). `colores` mira la senal azul-verde de Codex. */
async function pixelesDeLaFoto(page: Page, modo: 'luz' | 'colores') {
  const fuente = (await page.locator('img[alt="Captura Touchpix"]').getAttribute('src')) || '';
  expect(fuente.length, 'la foto tiene fuente').toBeGreaterThan(100);
  return page.evaluate(async ({ src, modo }) => {
    const imagen = await createImageBitmap(await (await fetch(src)).blob());
    const c = document.createElement('canvas');
    c.width = imagen.width;
    c.height = imagen.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(imagen, 0, 0);
    const datos = ctx.getImageData(0, 0, c.width, Math.max(1, c.height - 80)).data;
    let conImagen = 0;
    for (let i = 0; i < datos.length; i += 4) {
      const [r, g, b] = [datos[i], datos[i + 1], datos[i + 2]];
      if (modo === 'colores' ? b > 100 && g > 70 && r < 80 : r + g + b > 30) conImagen++;
    }
    return { ancho: c.width, alto: c.height, conImagen, total: datos.length / 4 };
  }, { src: fuente, modo });
}

async function sacarUnaFoto(page: Page, acceso: string) {
  await page.goto(`/evento/touchpix/${ID}?access=${acceso}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('touchpix-tab-foto')).toBeVisible({ timeout: 60_000 });
  const abrir = page.getByRole('button', { name: 'Abrir Cámara', exact: true });
  if (await abrir.isVisible().catch(() => false)) await abrir.click();
  const sacar = page.getByRole('button', { name: 'Sacar foto', exact: true });
  await expect(sacar).toBeVisible({ timeout: 30_000 });
  await sacar.click();
}

test.describe('Touchpix: la foto trae la imagen de la camara', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  });

  test('camara nativa falsa: la foto no es un recuadro negro', async ({ page, context }) => {
    test.setTimeout(120_000);
    guardarFiesta(fiesta);
    const acceso = crearPermisoDeEstacion(ID, 'espejoMagicoIA');
    await sacarUnaFoto(page, acceso);
    expect((await context.cookies()).some((c) => c.name === 'ak_session'), 'sin cookie del equipo').toBe(false);

    await expect(page.locator('img[alt="Captura Touchpix"]'), 'sale la foto, no un aviso de camara').toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('boton-reintentar-camara')).toHaveCount(0);

    const { ancho, conImagen, total } = await pixelesDeLaFoto(page, 'luz');
    expect(ancho).toBeGreaterThan(100);
    expect(conImagen / total, 'la foto trae la senal de la camara, no un negro con marca').toBeGreaterThan(0.1);
  });

  test('camara de colores: mas de 500 pixeles de la senal, tambien tras recargar (segunda captura)', async ({ page }) => {
    test.setTimeout(180_000);
    guardarFiesta(fiesta);
    await camaraDeColores(page);
    const acceso = crearPermisoDeEstacion(ID, 'espejoMagicoIA');

    await sacarUnaFoto(page, acceso);
    await expect(page.locator('img[alt="Captura Touchpix"]')).toBeVisible({ timeout: 30_000 });
    expect((await pixelesDeLaFoto(page, 'colores')).conImagen, 'primera captura con la senal').toBeGreaterThan(500);

    // Reinicio: otra carga de la pantalla, camara nueva, otra captura.
    await sacarUnaFoto(page, acceso);
    await expect(page.locator('img[alt="Captura Touchpix"]')).toBeVisible({ timeout: 30_000 });
    expect((await pixelesDeLaFoto(page, 'colores')).conImagen, 'segunda captura con la senal').toBeGreaterThan(500);
  });

  test('camara que no entrega cuadros: aviso visible, "Reintentar camara", y ninguna foto', async ({ page }) => {
    test.setTimeout(120_000);
    guardarFiesta(fiesta);
    // Un video que dice estar listo pero nunca arranca: no hay cuadro que dibujar.
    await page.addInitScript(() => {
      const original = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return this.classList.contains('hidden') ? Promise.reject(new DOMException('bloqueado', 'NotAllowedError')) : original.call(this);
      };
      Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get: () => true });
    });
    const acceso = crearPermisoDeEstacion(ID, 'espejoMagicoIA');
    await sacarUnaFoto(page, acceso);

    await expect(page.getByText('La camara no esta entregando imagen')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('boton-reintentar-camara')).toBeVisible();
    await expect(page.locator('img[alt="Captura Touchpix"]'), 'no se entrega ninguna foto').toHaveCount(0);
  });
});
