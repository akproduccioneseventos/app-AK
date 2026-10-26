import { test, expect } from '@playwright/test';
import path from 'node:path';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';

const { PNG } = require(path.join(path.dirname(require.resolve('playwright-core/package.json')), 'lib/utilsBundle.js'));
const id = `e2e_buzon_titulo_${process.pid}`;

test.beforeAll(() => {
  if (process.env.AK_ENTORNO_AISLADO !== 'true' && process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
    throw new Error('Esta prueba requiere el entorno ficticio aislado.');
  }
  const fixture = crearFiestaDeEstaNoche({ id });
  fixture.buzonConfig = { ...fixture.buzonConfig, enabled: true, videoFrameTemplate: 'floral' };
  guardarFiesta(fixture);
});

test.afterAll(() => borrarFiesta(id));

test('el titulo de la capsula tiene contraste sobre el fondo que realmente se pinta', async ({ page }) => {
  const access = crearPermisoDeEstacion(id, 'capsulaTiempo');
  await page.goto(`/evento/buzon/${id}?access=${access}`, { waitUntil: 'domcontentloaded' });
  const title = page.getByRole('heading', { name: 'Cápsula de los Recuerdos', exact: true });
  await expect(title).toBeVisible();
  await title.scrollIntoViewIfNeeded();
  const box = await title.boundingBox();
  if (!box) throw new Error('El titulo no tiene dimensiones visibles.');
  const text = await title.evaluate(el => getComputedStyle(el).color);
  const components = text.match(/[\d.]+/g);
  if (!components) throw new Error(`Color de texto no reconocido: ${text}`);
  const png = PNG.sync.read(await page.screenshot({ scale: 'css' }));
  const offset = (png.width * Math.floor(box.y + box.height / 2) + Math.max(0, Math.floor(box.x - 3))) * 4;
  const background = Array.from(png.data.subarray(offset, offset + 3)) as number[];
  const foreground = components.slice(0, 3).map(Number);
  const luminance = (rgb: number[]) => rgb.map(v => v / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const fg = luminance(foreground), bg = luminance(background);
  expect((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)).toBeGreaterThanOrEqual(3);
});
