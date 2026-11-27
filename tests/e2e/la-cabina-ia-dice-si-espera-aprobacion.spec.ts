import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  crearPermisoDeEstacion,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';

const chromiumInstalado = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({
  launchOptions: {
    ...(chromiumInstalado ? { executablePath: chromiumInstalado } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

const ID = `e2e_touchpix_mod368_${Date.now()}`;

test.describe('Orden 368 B2.1: la cabina IA avisa si la foto espera aprobación', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  });

  test.afterAll(() => {
    borrarFiesta(ID);
  });

  test('con aprobación pedida, la cabina no dice "Ya está en el muro"', async ({ page }) => {
    test.setTimeout(120_000);

    const fiesta = crearFiestaDeEstaNoche({ id: ID });
    (fiesta as any).socialWallEnabled = true;
    fiesta.socialGallerySettings = {
      ...(fiesta.socialGallerySettings as any),
      enabled: true,
      requireApproval: true,
    };
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

    guardarFiesta(fiesta);
    const acceso = crearPermisoDeEstacion(ID, 'espejoMagicoIA');

    await page.goto(`/evento/touchpix/${ID}?access=${acceso}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('touchpix-tab-foto')).toBeVisible({ timeout: 60_000 });

    const abrir = page.getByRole('button', { name: 'Abrir Cámara', exact: true });
    if (await abrir.isVisible().catch(() => false)) {
      await abrir.click();
    }

    const sacar = page.getByRole('button', { name: 'Sacar foto', exact: true });
    await expect(sacar).toBeVisible({ timeout: 30_000 });
    await sacar.click();

    await expect(page.locator('img[alt="Captura Touchpix"]')).toBeVisible({ timeout: 30_000 });

    const publicar = page.getByRole('button', { name: /Publicar al muro/i });
    await expect(publicar).toBeVisible({ timeout: 20_000 });
    await publicar.click();

    await expect(page.getByText(/Tu foto quedó esperando la aprobación del equipo/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Ya está en el muro/i)).toHaveCount(0);
  });
});
