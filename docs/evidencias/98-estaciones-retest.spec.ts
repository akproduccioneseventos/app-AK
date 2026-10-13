// @ts-nocheck -- QA owned fixtures and real actions, demo emulators only.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.basename(process.cwd()) !== 'ak-entorno-aislado-98' ||
    path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88') ||
    process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085' || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9195') throw new Error('TEMP98 demo only');
test.use({ launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });
const app = admin.initializeApp({ projectId: 'demo-ak-producciones', storageBucket: 'demo-ak-producciones.appspot.com' }, 'station98-' + process.pid);
const db = app.firestore(), bucket = app.storage().bucket();
db.settings({ ignoreUndefinedProperties: true });
test.afterAll(async () => app.delete());

async function seed(module) {
  const id = 'e2e_98_station_' + process.pid + '_' + Date.now();
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.socialWallEnabled = true;
  fiesta.others = { ...fiesta.others, entretenimiento: { ...fiesta.others?.entretenimiento,
    modules: { ...fiesta.others?.entretenimiento?.modules, [module]: {
      enabled: true, countdownSeconds: 1, segundosCuentaRegresiva: 1, reviewSeconds: 180,
      allowGuestRetake: true, maxRetakes: 3, consentRequired: false, autoPublish: false,
    } } } };
  guardarFiesta(fiesta);
  await db.collection('fiestas').doc(id).set(JSON.parse(JSON.stringify(fiesta)));
  return { id, access: crearPermisoDeEstacion(id, module) };
}
async function clean(id) {
  const posts = await db.collection('social_gallery_posts').where('fiestaId', '==', id).get();
  await Promise.all(posts.docs.map(d => d.ref.delete()));
  const [files] = await bucket.getFiles();
  await Promise.all(files.filter(f => f.name.includes('/' + id + '/')).map(f => f.delete()));
  await db.collection('fiestas').doc(id).delete();
  borrarFiesta(id);
}
async function colorCamera(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: async () => {
        const c = document.createElement('canvas'); c.width = 640; c.height = 480;
        const x = c.getContext('2d'); let frame = 0;
        const clock = setInterval(() => {
          x.fillStyle = frame++ % 2 ? '#27ad78' : '#2586cc'; x.fillRect(0, 0, 640, 480);
          x.fillStyle = '#ffd447'; x.fillRect((frame * 9) % 500, 100, 100, 100);
        }, 33);
        const stream = c.captureStream(30);
        for (const t of stream.getTracks()) t.addEventListener('ended', () => clearInterval(clock));
        return stream;
      }, enumerateDevices: async () => [{ deviceId: 'qa98', kind: 'videoinput', label: 'QA colors', groupId: 'qa98' }],
      addEventListener() {}, removeEventListener() {},
    } });
  });
}
async function captureTouch(page, fixture) {
  await page.goto('/evento/touchpix/' + fixture.id + '?access=' + fixture.access, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('touchpix-tab-foto')).toBeVisible({ timeout: 60000 });
  const open = page.getByRole('button', { name: 'Abrir Cámara', exact: true });
  if (await open.isVisible()) await open.click();
  const capture = page.getByRole('button', { name: 'Sacar foto', exact: true });
  await expect(capture).toBeVisible({ timeout: 30000 }); await capture.click();
}
async function photoPixels(page, colors) {
  const src = await page.locator('img[alt="Captura Touchpix"]').getAttribute('src');
  return page.evaluate(async ({ src, colors }) => {
    const img = await createImageBitmap(await (await fetch(src)).blob());
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const data = x.getImageData(0, 0, c.width, c.height - 80).data; let count = 0;
    for (let i = 0; i < data.length; i += 4)
      if (colors ? data[i + 2] > 100 && data[i + 1] > 70 && data[i] < 80 : data[i] + data[i + 1] + data[i + 2] > 30) count++;
    img.close(); return { width: c.width, height: c.height, count, total: data.length / 4 };
  }, { src, colors });
}
for (const mode of ['native', 'colors', 'no-frame']) test('Touchpix camera ' + mode, async ({ page, context }, info) => {
  test.setTimeout(240000); const fixture = await seed('espejoMagicoIA');
  try {
    if (mode === 'colors') await colorCamera(page);
    if (mode === 'no-frame') await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return this.classList.contains('hidden') ? Promise.reject(new DOMException('QA blocked', 'NotAllowedError')) : play.call(this);
      };
      Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get: () => true });
    });
    await captureTouch(page, fixture);
    expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
    if (mode === 'no-frame') {
      await expect(page.getByText('La camara no esta entregando imagen').first()).toBeVisible({ timeout: 30000 });
      await expect(page.getByTestId('boton-reintentar-camara')).toBeVisible();
      await expect(page.locator('img[alt="Captura Touchpix"]')).toHaveCount(0);
      expect((await db.collection('social_gallery_posts').where('fiestaId', '==', fixture.id).get()).size).toBe(0);
    } else {
      await expect(page.locator('img[alt="Captura Touchpix"]')).toBeVisible({ timeout: 30000 });
      const first = await photoPixels(page, mode === 'colors');
      if (mode === 'colors') expect(first.count).toBeGreaterThan(500); else expect(first.count / first.total).toBeGreaterThan(0.1);
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Guardar', exact: true }).click()]);
      const bytes = fs.readFileSync(await download.path()); expect(bytes.length).toBeGreaterThan(2000);
      await info.attach('photo-bytes.json', { body: JSON.stringify({ first, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }), contentType: 'application/json' });
      if (mode === 'colors') {
        await captureTouch(page, fixture);
        await expect(page.locator('img[alt="Captura Touchpix"]')).toBeVisible({ timeout: 30000 });
        const second = await photoPixels(page, true); expect(second.count).toBeGreaterThan(500);
        await info.attach('photo-second.json', { body: JSON.stringify(second), contentType: 'application/json' });
      }
    }
    await info.attach('screen.png', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('screen.txt', { body: await page.locator('body').innerText(), contentType: 'text/plain' });
  } finally { await clean(fixture.id); }
});

test('Mirror failed image review creates one pending post and truthful notice', async ({ page, context }, info) => {
  test.setTimeout(240000); const fixture = await seed('espejoMagicoFoto');
  try {
    await page.goto('/evento/espejo-magico/' + fixture.id + '?access=' + fixture.access + '&mode=foto', { waitUntil: 'domcontentloaded' });
    const tap = page.getByRole('button', { name: 'Tocar para foto', exact: true });
    await expect(tap).toBeVisible({ timeout: 60000 });
    const consent = page.getByRole('checkbox'); if (await consent.count()) await consent.check();
    await tap.click();
    await expect(page.getByRole('button', { name: 'Guardar en el celular', exact: true })).toBeVisible({ timeout: 90000 });
    expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
    const posts = () => db.collection('social_gallery_posts').where('fiestaId', '==', fixture.id).get();
    await expect.poll(async () => (await posts()).size, { timeout: 30000 }).toBe(1);
    const row = (await posts()).docs[0].data(); expect(row.moderationStatus).toBe('pending');
    await expect(page.getByTestId('aviso-foto-pendiente')).toContainText('aprobación del equipo');
    await info.attach('mirror-pending.json', { body: JSON.stringify(row, null, 2), contentType: 'application/json' });
    await info.attach('mirror-notice.png', { body: await page.screenshot(), contentType: 'image/png' });
    const wall = await context.newPage();
    const wallResponse = await wall.goto('/evento/muro-en-vivo/' + fixture.id, { waitUntil: 'domcontentloaded' });
    expect(wallResponse?.status()).toBe(200);
    await expect(wall.getByTestId('live-wall-empty')).toBeVisible({ timeout: 60000 });
    await expect(wall.getByText('Cargando muro…')).toHaveCount(0);
    await info.attach('mirror-public-wall.png', { body: await wall.screenshot(), contentType: 'image/png' });
    await info.attach('mirror-public-wall.txt', { body: await wall.locator('body').innerText(), contentType: 'text/plain' });
    const html = await wall.content(); const url = String(row.imageUrl).split('?')[0];
    expect(url.length).toBeGreaterThan(10); expect(html).not.toContain(url);
    expect(html).not.toContain(String(row.id)); await wall.close();
    await page.reload({ waitUntil: 'domcontentloaded' }); expect((await posts()).size).toBe(1);
    await info.attach('mirror-final.json', { body: JSON.stringify({ postCount: (await posts()).size, publicImageAbsent: true, publicWallReady: true, reloadOnly: true }), contentType: 'application/json' });
  } finally { await clean(fixture.id); }
});
