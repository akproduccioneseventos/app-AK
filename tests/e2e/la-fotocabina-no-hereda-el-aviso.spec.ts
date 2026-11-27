import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

const baseFiesta = crearFiestaDeEstaNoche({ id: `e2e_fotocabina_360_${Date.now()}` });
const fiesta = {
  ...baseFiesta,
  socialWallEnabled: true,
  socialGallerySettings: {
    allowLikes: true,
    allowComments: true,
    allowGuestUploads: true,
    moderateComments: false,
    autoApproveComments: true,
    ...(baseFiesta.socialGallerySettings ?? {}),
    uploadsActive: baseFiesta.socialGallerySettings?.uploadsActive ?? true,
    enabled: true,
    requireApproval: true,
  },
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test('Orden 360: al sacar otra foto tras error de red no hereda el aviso del muro', async ({ page, context }, testInfo) => {
  test.setTimeout(180_000);
  const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
  await ponerSesionDelEquipo(context, baseURL);
  await enchufarCamaraFalsa(page);

  const permiso = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
  await page.goto(`/evento/fotocabina/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible({ timeout: 30_000 });

  let hayCamara = false;
  for (let intento = 0; intento < 20 && !hayCamara; intento += 1) {
    hayCamara = await page.evaluate(() => Boolean(document.querySelector('video')?.srcObject));
    if (!hayCamara) await page.waitForTimeout(500);
  }
  expect(hayCamara).toBe(true);

  const disparar = page.getByTestId('boton-sacar-foto');
  await expect(disparar).toBeEnabled({ timeout: 20_000 });
  await disparar.click();

  await expect(page.locator('img[alt="Captura Final"]')).toBeVisible({ timeout: 90_000 });

  const publicarBtn = page.getByRole('button', { name: /Publicar en el muro|Publicar/i });
  if (await publicarBtn.count()) {
    await publicarBtn.first().click();
  }
  await expect(page.getByText(/Tu recuerdo está listo|No se pudo publicar/i)).toBeVisible({ timeout: 30_000 });

  // Empezar otra tanda y cortar red al subir
  const repetirBtn = page.getByRole('button', { name: /Repetir foto|Otra foto|Nueva/i }).first();
  await expect(repetirBtn).toBeVisible({ timeout: 15_000 });
  await repetirBtn.click();
  await page.route('**/*', (route) => {
    if (route.request().method() === 'POST') return route.abort();
    return route.continue();
  });
  await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('boton-sacar-foto')).toBeEnabled({ timeout: 20_000 });
  await page.getByTestId('boton-sacar-foto').click();
  await expect(page.locator('img[alt="Captura Final"]')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('[data-testid="aviso-foto-pendiente"]')).toHaveCount(0);
});
