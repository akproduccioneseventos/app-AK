// @ts-nocheck -- isolated real canvas probe, not an approval of a fallback photo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.cwd() !== path.join(os.homedir(), 'Documents', 'Codex', 'ak-codex88', 'ak-entorno-aislado-103')) throw new Error('Isolated only');
test('la reunion muestra una escena WebGL real, no solo su reemplazo', async ({ context, page, baseURL }, info) => {
  test.setTimeout(120000);
  await ponerSesionDelEquipo(context, baseURL);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const response = await page.goto('/empresa/configurador-reunion', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await page.waitForTimeout(8000);
  const webglAvailable = await page.evaluate(() => {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  });
  const result = { url: page.url(), text: await page.locator('body').innerText(), canvases: await page.locator('canvas').count(), webglAvailable, errors };
  await info.attach('3d-real.json', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
  await info.attach('3d-real.png', { body: await page.screenshot(), contentType: 'image/png' });
  expect(result.text).not.toMatch(/Algo sali[oó] mal/i);
  expect(webglAvailable, 'el navegador de QA debe ofrecer WebGL antes de juzgar la escena').toBe(true);
  expect(result.canvases, 'una foto o mensaje alternativo no aprueba el salon 3D').toBeGreaterThan(0);
  const canvas = page.locator('canvas').first();
  const size = await canvas.evaluate(c => ({ width: c.width, height: c.height, rect: c.getBoundingClientRect().toJSON() }));
  expect(size.width).toBeGreaterThan(100); expect(size.height).toBeGreaterThan(100);
  const pixels = await canvas.screenshot();
  await info.attach('canvas.png', { body: pixels, contentType: 'image/png' });
  const sample = await canvas.evaluate(c => {
    const copy = document.createElement('canvas'); copy.width = c.width; copy.height = c.height;
    const ctx = copy.getContext('2d')!; ctx.drawImage(c, 0, 0);
    const data = ctx.getImageData(0, 0, copy.width, copy.height).data, colors = new Set();
    for (let i = 0; i < data.length; i += 64) colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
    return { colors: colors.size, image: c.toDataURL('image/png') };
  });
  expect(sample.colors, 'un canvas uniforme no acredita una escena dibujada').toBeGreaterThan(20);
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 20, { steps: 12 });
  await page.mouse.up(); await page.waitForTimeout(600);
  expect(await canvas.evaluate(c => c.toDataURL('image/png')), 'la escena debe moverse al interactuar').not.toBe(sample.image);
});
