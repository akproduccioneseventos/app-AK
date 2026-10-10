import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, crearPermisoDeEstacion, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Orden 140 (Codex, ENT89-IMAGEN): la foto de la fotocabina no puede salir negra.
 *
 * El video de la cámara está oculto y el navegador lo dejaba en pausa: la señal estaba viva
 * pero lo dibujado era negro. Acá se usa la cámara NATIVA falsa de Chromium (sin sustituir la
 * captura de la app), se saca UNA foto por la pantalla real, con permiso acotado y sin cookie
 * del equipo, y se mira el resultado: que DENTRO de la foto haya píxeles con imagen. No alcanza
 * con que el JPEG tenga dimensiones, marco o QR.
 *
 * Probado rompiéndolo: sacando `asegurarCuadroDeVideo` de `captureToCanvas` la región queda sin
 * píxeles con imagen y esta prueba se pone en rojo.
 */

// Al pisar launchOptions se pierde el navegador que fija playwright.config.ts: se repone acá.
const chromiumInstalado = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({
  launchOptions: {
    ...(chromiumInstalado ? { executablePath: chromiumInstalado } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_foto140_${Date.now()}` });
const ID = fiesta.id;
fiesta.others = {
  ...fiesta.others,
  entretenimiento: {
    ...fiesta.others?.entretenimiento,
    modules: {
      ...fiesta.others?.entretenimiento?.modules,
      fotocabina: {
        enabled: true,
        fotosPorTanda: 1,
        segundosCuentaRegresiva: 2,
        countdownSeconds: 2,
        allowGuestRetake: true,
        maxRetakes: 2,
      },
    },
  },
} as any;

test.afterAll(() => {
  borrarFiesta(ID);
});

test('la foto de la fotocabina trae la imagen de la camara, no un recuadro negro', async ({ page, context }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

  guardarFiesta(fiesta);
  const acceso = crearPermisoDeEstacion(ID, 'fotocabina');
  await page.goto(`/evento/fotocabina/${ID}?access=${acceso}`, { waitUntil: 'domcontentloaded' });
  expect((await context.cookies()).some((c) => c.name === 'ak_session'), 'sin cookie del equipo').toBe(false);

  const disparar = page.getByTestId('boton-sacar-foto');
  await expect(disparar).toBeEnabled({ timeout: 60_000 });
  await disparar.click();

  const resultado = page.locator('img[alt="Captura Final"]');
  await expect(resultado, 'sale la foto, no un aviso de camara').toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('boton-reintentar-camara')).toHaveCount(0);

  const fuente = (await resultado.getAttribute('src')) || '';
  expect(fuente).toMatch(/^data:image\/(jpeg|png)/);

  const pixeles = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    // Se mira DENTRO de la foto, sin plantilla ni pie, que podrian tapar una captura vacia.
    const datos = ctx.getImageData(200, 300, 800, 350).data;
    let conImagen = 0;
    for (let i = 0; i < datos.length; i += 4) if (datos[i] + datos[i + 1] + datos[i + 2] > 30) conImagen++;
    return { ancho: c.width, alto: c.height, conImagen, total: datos.length / 4 };
  }, fuente);

  expect(pixeles.ancho).toBeGreaterThan(100);
  expect(pixeles.conImagen / pixeles.total, 'la foto trae la senal de la camara, no solo el marco').toBeGreaterThan(0.1);
});
