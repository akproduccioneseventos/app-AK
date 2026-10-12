import { expect, test, type Page } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo entorno aislado');

async function imagen(page: Page) {
  return page.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const sample = document.createElement('canvas');
    sample.width = 96; sample.height = 96;
    const reader = sample.getContext('2d');
    if (!reader) throw new Error('No hay lector de pixeles');
    reader.drawImage(canvas, 0, 0, 96, 96);
    return Array.from(reader.getImageData(0, 0, 96, 96).data);
  });
}

function cambio(before: number[], after: number[]) {
  let changed = 0;
  for (let i = 0; i < before.length; i += 4) {
    if ([0, 1, 2].some(channel => Math.abs(before[i + channel] - after[i + channel]) > 4)) changed++;
  }
  return changed / (before.length / 4);
}

test.beforeEach(async ({ page, context, baseURL }) => {
  test.setTimeout(120000);
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/empresa/configurador-reunion', { waitUntil: 'domcontentloaded' });
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 60000 });
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width)).toBeGreaterThan(100);
  await page.waitForTimeout(1500);
});

test('la ayuda queda fuera del lienzo y la navegacion no esta tapada', async ({ page }, info) => {
  const help = page.getByText(/Arrastr.*para rotar la c.mara 3D/);
  await expect(help).toBeVisible();
  const helpBox = await help.boundingBox();
  const canvasBox = await page.locator('canvas').first().boundingBox();
  if (!helpBox || !canvasBox) throw new Error('Ayuda/lienzo sin medidas');
  await info.attach('ayuda-lienzo.json', { body: JSON.stringify({ helpBox, canvasBox }), contentType: 'application/json' });
  await info.attach('ayuda-lienzo.png', { body: await page.screenshot(), contentType: 'image/png' });
  expect(helpBox.y + helpBox.height, 'La ayuda no tapa la escena').toBeLessThanOrEqual(canvasBox.y + 1);
  const nav = page.getByRole('navigation', { name: 'Navegacion del modulo' });
  for (const button of await nav.getByRole('button').all()) {
    await expect(button).toBeVisible();
    expect(await button.evaluate(node => {
      const box = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), 'El boton flotante recibe el toque').toBe(true);
  }
});

test('Recorrer mueve la escena sin arrastrar y se puede pausar', async ({ page }, info) => {
  const button = page.getByRole('button', { name: 'Recorrer', exact: true });
  await button.click();
  await page.locator('canvas').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const before = await imagen(page);
  await page.waitForTimeout(1600);
  const moving = await imagen(page);
  const rotating = cambio(before, moving);
  await info.attach('recorrido-automatico.json', { body: JSON.stringify({ rotating }), contentType: 'application/json' });
  expect(rotating, 'Recorrer debe mover la camara, no solo su icono').toBeGreaterThan(0.02);
  const pause = page.getByRole('button', { name: 'Pausar recorrido', exact: true });
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await pause.click();
  await page.locator('canvas').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  const stopped = await imagen(page);
  await page.waitForTimeout(1000);
  const paused = cambio(stopped, await imagen(page));
  await info.attach('recorrido-pausado.json', { body: JSON.stringify({ rotating, paused }), contentType: 'application/json' });
  // OrbitControls frena con amortiguacion: se tolera antialias, no un giro sostenido.
  expect(paused, 'Pausar detiene el giro automatico').toBeLessThan(0.01);
  expect(paused).toBeLessThan(rotating / 10);
  await expect(page.getByRole('button', { name: 'Recorrer', exact: true })).toHaveAttribute('aria-pressed', 'false');
});
