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

async function camara(page: Page) {
  return page.locator('canvas').first().evaluate((node: HTMLCanvasElement & { __akViewMatrix?: number[] }) => node.__akViewMatrix || []);
}

function movimientoCamara(before: number[], after: number[]) {
  expect(before).toHaveLength(16);
  expect(after).toHaveLength(16);
  expect([...before, ...after].every(Number.isFinite)).toBe(true);
  return Math.max(...before.map((value, i) => Math.abs(value - after[i])));
}

test.beforeEach(async ({ page, context, baseURL }) => {
  test.setTimeout(120000);
  await ponerSesionDelEquipo(context, baseURL);
  // Sonda solo del navegador de prueba: observa la matriz enviada al WebGL real.
  // La pista sigue animada al pausar; sus pixeles no representan movimiento de camara.
  await page.addInitScript(() => {
    const locations = new WeakSet<WebGLUniformLocation>();
    const framebuffers = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, WebGLFramebuffer | null>();
    for (const Constructor of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Constructor) continue;
      const proto = Constructor.prototype;
      const getLocation = proto.getUniformLocation;
      const sendMatrix = proto.uniformMatrix4fv;
      const bindFramebuffer = proto.bindFramebuffer;
      proto.bindFramebuffer = function (target: number, buffer: WebGLFramebuffer | null) {
        if (target === this.FRAMEBUFFER || target === (this as WebGL2RenderingContext).DRAW_FRAMEBUFFER) framebuffers.set(this, buffer);
        return bindFramebuffer.call(this, target, buffer);
      };
      proto.getUniformLocation = function (program, name) {
        const location = getLocation.call(this, program, name);
        if (location && name === 'viewMatrix') locations.add(location);
        return location;
      };
      proto.uniformMatrix4fv = function (location: WebGLUniformLocation | null, transpose: boolean, value: Float32List, ...rest: number[]) {
        if (location && locations.has(location) && (framebuffers.get(this) ?? null) === null) {
          (this.canvas as HTMLCanvasElement & { __akViewMatrix?: number[] }).__akViewMatrix = Array.from(value);
        }
        return Reflect.apply(sendMatrix, this, [location, transpose, value, ...rest]);
      };
    }
  });
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
  const cameraBefore = await camara(page);
  await page.waitForTimeout(1600);
  const moving = await imagen(page);
  const cameraMoving = await camara(page);
  const rotating = cambio(before, moving);
  const cameraRotating = movimientoCamara(cameraBefore, cameraMoving);
  await info.attach('recorrido-automatico.json', { body: JSON.stringify({ rotating, cameraRotating, cameraBefore, cameraMoving }), contentType: 'application/json' });
  expect(rotating, 'Recorrer debe mover la camara, no solo su icono').toBeGreaterThan(0.02);
  expect(cameraRotating, 'La matriz de la camara real cambia al recorrer').toBeGreaterThan(0.001);
  const pause = page.getByRole('button', { name: 'Pausar recorrido', exact: true });
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await pause.click();
  await page.locator('canvas').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  const stopped = await imagen(page);
  const cameraStopped = await camara(page);
  await page.waitForTimeout(1000);
  const paused = cambio(stopped, await imagen(page));
  const cameraPaused = movimientoCamara(cameraStopped, await camara(page));
  await info.attach('recorrido-pausado.json', { body: JSON.stringify({ rotating, paused, cameraRotating, cameraPaused, cameraStopped }), contentType: 'application/json' });
  expect(cameraPaused, 'Pausar detiene la camara aunque la pista siga animada').toBeLessThan(0.000001);
  await expect(page.getByRole('button', { name: 'Recorrer', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('titulo legible y colores LED circulares sin controles comprimidos', async ({ page }, info) => {
  const title = page.getByText('Salón Interactivo 3D', { exact: true });
  const colors = await title.evaluate(node => {
    const foreground = getComputedStyle(node).color;
    const background = getComputedStyle(node.parentElement!.parentElement!).backgroundColor;
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const a = luminance(foreground), b = luminance(background);
    return { foreground, background, contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });
  expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
  for (const name of ['Dorado', 'Fucsia', 'Azul', 'Violeta', 'Esmeralda']) {
    const swatch = page.getByRole('button', { name: `Color ${name}`, exact: true });
    const box = await swatch.boundingBox();
    if (!box) throw new Error('Color sin medidas');
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(box.width - box.height)).toBeLessThan(1);
  }
  await info.attach('titulo-colores.json', { body: JSON.stringify(colors), contentType: 'application/json' });
  await info.attach('salon-con-mesas.png', { body: await page.screenshot(), contentType: 'image/png' });
});

test('LED y cantidad de invitados cambian la escena real', async ({ page }, info) => {
  await expect(page.getByText('12 Mesas distribuidas · 120 Invitados', { exact: true })).toBeVisible();
  const before = await imagen(page);
  const blue = page.getByRole('button', { name: 'Color Azul', exact: true });
  await blue.click();
  await page.locator('canvas').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const colored = await imagen(page);
  const ledChanged = cambio(before, colored);
  expect(ledChanged, 'El LED seleccionado cambia el lienzo, no solo el boton').toBeGreaterThan(0.02);
  await expect(blue).toHaveAttribute('aria-pressed', 'true');
  const adults = page.getByText('Adultos', { exact: true }).locator('..');
  await adults.getByRole('button', { name: '+', exact: true }).click();
  await expect(page.getByText('13 Mesas distribuidas · 125 Invitados', { exact: true })).toBeVisible();
  await page.locator('canvas').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const layoutChanged = cambio(colored, await imagen(page));
  expect(layoutChanged, 'Cambiar invitados cambia las mesas dibujadas').toBeGreaterThan(0.02);
  await info.attach('layout-led.json', { body: JSON.stringify({ ledChanged, layoutChanged }), contentType: 'application/json' });
  await info.attach('salon-azul-13-mesas.png', { body: await page.screenshot(), contentType: 'image/png' });
});
