import { test, expect, type Page, type Locator } from '@playwright/test';
import path from 'node:path';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';

const { PNG } = require(path.join(path.dirname(require.resolve('playwright-core/package.json')), 'lib/utilsBundle.js'));
const id = `e2e_buzon_titulo_${process.pid}`;

async function assertContrast(page: Page, locator: Locator, minimum = 3, inside = false) {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('El texto no tiene dimensiones visibles.');
  const text = await locator.evaluate(el => getComputedStyle(el).color);
  const components = text.match(/[\d.]+/g);
  if (!components) throw new Error(`Color no reconocido: ${text}`);
  const png = PNG.sync.read(await page.screenshot({ scale: 'css' }));
  const x = Math.max(0, Math.floor(inside ? box.x + 8 : box.x - 3));
  const y = Math.floor(inside ? box.y + 8 : box.y + box.height / 2);
  const offset = (png.width * y + x) * 4;
  const background = Array.from(png.data.subarray(offset, offset + 3)) as number[];
  const foreground = components.slice(0, 3).map(Number);
  const luminance = (rgb: number[]) => rgb.map(v => v / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const fg = luminance(foreground), bg = luminance(background);
  expect((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)).toBeGreaterThanOrEqual(minimum);
}

test.beforeAll(() => {
  if (process.env.AK_ENTORNO_AISLADO !== 'true' && process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
    throw new Error('Esta prueba requiere el entorno ficticio aislado.');
  }
  const fixture = crearFiestaDeEstaNoche({ id });
  fixture.buzonConfig = { ...fixture.buzonConfig, enabled: true, videoFrameTemplate: 'floral' };
  guardarFiesta(fixture);
});
test.afterAll(() => borrarFiesta(id));

test('el titulo de la capsula tiene contraste sobre su fondo real', async ({ page }) => {
  await page.goto(`/evento/buzon/${id}?access=${crearPermisoDeEstacion(id, 'capsulaTiempo')}`, { waitUntil: 'domcontentloaded' });
  await assertContrast(page, page.getByRole('heading', { name: 'Cápsula de los Recuerdos', exact: true }));
});

test('el formulario, lo escrito y sus botones son legibles al preparar una foto', async ({ page }) => {
  await page.goto(`/evento/buzon/${id}?access=${crearPermisoDeEstacion(id, 'capsulaTiempo')}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Subir foto/i }).click();
  const image = new PNG({ width: 320, height: 240 });
  image.data.fill(255);
  await page.locator('input[type=file][accept="image/*"]').setInputFiles({ name: 'qa-contraste.png', mimeType: 'image/png', buffer: PNG.sync.write(image) });
  await expect(page.getByText('Foto Cargada', { exact: true })).toBeVisible();
  const input = page.getByLabel(/Tu nombre y apellido/i);
  await input.fill('Invitado ficticio');
  await assertContrast(page, page.getByRole('heading', { name: 'Subir Foto', exact: true }), 4.5);
  await assertContrast(page, page.locator('label').filter({ hasText: /Tu nombre y apellido/i }).first(), 4.5);
  await assertContrast(page, input, 4.5, true);
  await assertContrast(page, page.getByRole('button', { name: /Elegir otra/i }), 4.5, true);
  const submit = page.getByRole('button', { name: /Enviar Recuerdo/i });
  await expect(submit).toBeEnabled();
  await assertContrast(page, submit, 4.5, true);
  await assertContrast(page, page.getByText('Experiencia por AK Producciones', { exact: true }), 4.5);
});

test('un buzon no disponible sigue mostrando un error legible', async ({ page }) => {
  const missing = id + '_missing';
  await page.goto(`/evento/buzon/${missing}?access=${crearPermisoDeEstacion(missing, 'capsulaTiempo')}`, { waitUntil: 'domcontentloaded' });
  await assertContrast(page, page.getByRole('heading', { name: 'Buzón no disponible', exact: true }));
});
