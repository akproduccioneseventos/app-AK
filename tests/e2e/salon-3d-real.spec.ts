import { expect, test, type Page } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo datos ficticios en el entorno aislado');
const id = `e2e_105_salon_${Date.now()}`;

test.beforeAll(() => {
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.decoracion = {
    ...fiesta.decoracion, salonWidth: 20, salonHeight: 15, pixelsPerMeter: 40,
    salonElements: [
      { id: 'mesa105', type: 'element', category: 'mesa', name: 'Mesa', x: 200, y: 200, width: 80, height: 80, rotation: 0 },
      { id: 'pista105', type: 'area', category: 'pista', name: 'Pista', x: 400, y: 300, width: 150, height: 150, rotation: 0 },
    ],
  };
  guardarFiesta(fiesta);
});
test.afterAll(() => borrarFiesta(id));

async function pixels(page: Page) {
  return page.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas');
    copy.width = canvas.width; copy.height = canvas.height;
    const ctx = copy.getContext('2d');
    if (!ctx) throw new Error('No hay lector de pixeles');
    ctx.drawImage(canvas, 0, 0);
    const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
    const colors = new Set<string>();
    for (let i = 0; i < data.length; i += 64) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    return { colors: colors.size, image: canvas.toDataURL(), width: canvas.width, height: canvas.height };
  });
}

for (const route of ['reunion', 'cliente'] as const) {
  test(`${route}: escena real dibujada e interactiva, no foto de respaldo`, async ({ page, context, baseURL, isMobile }, info) => {
    test.setTimeout(240000);
    await ponerSesionDelEquipo(context, baseURL);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
    const response = await page.goto(route === 'reunion' ? '/empresa/configurador-reunion' : `/portal/${id}/decoracion`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    expect(await page.evaluate(() => {
      const probe = document.createElement('canvas');
      return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
    }), 'El navegador de prueba debe ofrecer WebGL').toBe(true);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 60000 });
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await pixels(page)).colors).toBeGreaterThan(20);
    const before = await pixels(page);
    expect(before.width).toBeGreaterThan(100); expect(before.height).toBeGreaterThan(100);
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas sin area visible');
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    if (isMobile) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 12; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + i * 5, y: y + i }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    } else {
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x + 60, y + 20, { steps: 12 }); await page.mouse.up();
    }
    await page.waitForTimeout(600);
    const after = await pixels(page);
    expect(after.image).not.toBe(before.image);
    expect(after.colors).toBeGreaterThan(20);
    expect(errors.filter(e => /ReactCurrentBatchConfig|ReactCurrentOwner|Invalid hook call|Minified React error/.test(e))).toEqual([]);
    await info.attach('salon-real.json', { body: JSON.stringify({ route, isMobile, before: { ...before, image: undefined }, after: { ...after, image: undefined }, errors }), contentType: 'application/json' });
    await info.attach('salon-real.png', { body: await canvas.screenshot(), contentType: 'image/png' });
    } finally {
      await info.attach('errores-de-pagina.json', { body: JSON.stringify({ route, isMobile, errors }), contentType: 'application/json' });
    }
  });
}
