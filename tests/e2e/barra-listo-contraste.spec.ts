import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 223 y Orden 227: Contraste de pantallas oscuras autónomas y panel claro.
 * Mide el contraste real rasterizado de píxeles mediante screenshot.
 */

const sharp = createRequire(process.cwd() + '/package.json')('sharp');

function calcularLuminancia(rgb: number[]): number {
  const [r, g, b] = rgb.map(val => {
    const c = val / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calcularRatioContraste(rgb1: number[], rgb2: number[]): number {
  const l1 = calcularLuminancia(rgb1);
  const l2 = calcularLuminancia(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const PANTALLAS_AUTONOMAS: Array<{ ruta: string; titulo?: RegExp }> = [
  { ruta: '/evento/barra/fiesta-demo/listo' },
  { ruta: '/evento/buzon/fiesta-demo' },
  { ruta: '/evento/en-vivo/fiesta-demo' },
  { ruta: '/experiencia', titulo: /Viví la experiencia/i },
  { ruta: '/tecnologia', titulo: /tecnologías en tu fiesta/i },
  { ruta: '/catalogo/bodas' },
];

test.describe('Contraste por píxeles rasterizados (Orden 227)', () => {
  for (const { ruta, titulo } of PANTALLAS_AUTONOMAS) {
    test(`pantalla ${ruta} mantiene contraste legible mayor a 4.5:1`, async ({ page }) => {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      const heading = titulo
        ? page.getByRole('heading', { name: titulo }).first()
        : page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 20000 });

      const foregroundRgb = await heading.evaluate(el => {
        const color = window.getComputedStyle(el).color;
        const matches = color.match(/[\d.]+/g) || ['255', '255', '255'];
        return matches.slice(0, 3).map(Number);
      });

      const png = await heading.screenshot();
      const raw = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const w = raw.info.width;
      const h = raw.info.height;

      // Muestrear píxeles de fondo en las esquinas y borde superior
      const samples: number[][] = [];
      const puntos = [
        [Math.min(2, w - 1), Math.min(2, h - 1)],
        [Math.floor(w / 2), Math.min(1, h - 1)],
        [Math.max(0, w - 3), Math.min(2, h - 1)],
      ];
      for (const [px, py] of puntos) {
        const offset = (py * w + px) * raw.info.channels;
        samples.push([raw.data[offset], raw.data[offset + 1], raw.data[offset + 2]]);
      }
      const backgroundRgb = [0, 1, 2].map(c => Math.round(samples.reduce((sum, p) => sum + p[c], 0) / samples.length));

      const ratio = calcularRatioContraste(backgroundRgb, foregroundRgb);
      expect(ratio, `Contraste en ${ruta}`).toBeGreaterThanOrEqual(4.5);
    });
  }

  test('pantalla del panel interno conserva contraste claro', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/empresa', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 20000 });

    const foregroundRgb = await heading.evaluate(el => {
      const color = window.getComputedStyle(el).color;
      const matches = color.match(/[\d.]+/g) || ['15', '23', '42'];
      return matches.slice(0, 3).map(Number);
    });

    const png = await heading.screenshot();
    const raw = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = raw.info.width;
    const h = raw.info.height;

    const offset = (Math.min(2, h - 1) * w + Math.min(2, w - 1)) * raw.info.channels;
    const backgroundRgb = [raw.data[offset], raw.data[offset + 1], raw.data[offset + 2]];

    const ratio = calcularRatioContraste(backgroundRgb, foregroundRgb);
    expect(ratio, 'Contraste en panel interno').toBeGreaterThanOrEqual(4.5);
  });
});
