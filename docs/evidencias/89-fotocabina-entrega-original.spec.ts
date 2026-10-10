// @ts-nocheck -- Copy into tests/e2e in the reserved, fake-data runtime only.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import * as zxing from 'html5-qrcode/third_party/zxing-js.umd';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';

if (process.env.AK_ENTORNO_AISLADO !== 'true'
  || path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88')
  || process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones'
  || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085'
  || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9195') {
  throw new Error('Requires reserved TEMP and demo emulators.');
}
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'foto89-' + process.pid);
const db = app.firestore();
db.settings({ ignoreUndefinedProperties: true });
const bucket = app.storage().bucket('demo-ak-producciones.appspot.com');
test.afterAll(async () => { await app.delete(); });

async function decodeQr(page, png) {
  const pixels = await page.evaluate(async (base64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + base64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0);
    const rgba = ctx.getImageData(0, 0, c.width, c.height).data;
    const gray = [];
    for (let i = 0; i < rgba.length; i += 4) gray.push(Math.round(.299 * rgba[i] + .587 * rgba[i + 1] + .114 * rgba[i + 2]));
    return { width: c.width, height: c.height, gray };
  }, png.toString('base64'));
  return new zxing.QRCodeReader().decode(new zxing.BinaryBitmap(new zxing.HybridBinarizer(
    new zxing.RGBLuminanceSource(Uint8ClampedArray.from(pixels.gray), pixels.width, pixels.height)
  ))).getText();
}

test('dos tandas distintas entregan dos recuerdos, QR real y descarga sin cuenta del equipo', async ({ page, context, browser }, info) => {
  test.setTimeout(240000);
  const fiesta = crearFiestaDeEstaNoche({ id: 'e2e_foto89_' + Date.now() + '_' + process.pid });
  fiesta.others = { ...fiesta.others, entretenimiento: { ...fiesta.others?.entretenimiento,
    modules: { ...fiesta.others?.entretenimiento?.modules, fotocabina: {
      enabled: true, fotosPorTanda: 1, segundosCuentaRegresiva: 2, countdownSeconds: 2,
      autoPublish: true, reviewSeconds: 120, deliveryChannels: ['qr', 'galeria'],
      allowGuestRetake: true, maxRetakes: 2,
    } } } };
  const ref = db.collection('fiestas').doc(fiesta.id);
  const prefix = 'entertainment/' + fiesta.id + '/';
  const reception = await browser.newContext();
  const receiver = await reception.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    guardarFiesta(fiesta); await ref.set(JSON.parse(JSON.stringify(fiesta)));
    await page.addInitScript(() => {
      window.__foto89color = '#195fac';
      const c = document.createElement('canvas'); c.width = 640; c.height = 480;
      const ctx = c.getContext('2d');
      const draw = () => { ctx.fillStyle = window.__foto89color; ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 40px sans-serif'; ctx.fillText('RECUERDO QA', 100, 240); };
      draw(); setInterval(draw, 50);
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
        getUserMedia: async () => c.captureStream(30),
        enumerateDevices: async () => [{ deviceId: 'qa', kind: 'videoinput', label: 'QA', groupId: 'g' }],
        addEventListener() {}, removeEventListener() {},
      } });
    });
    const access = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
    await page.goto('/evento/fotocabina/' + fiesta.id + '?access=' + access, { waitUntil: 'domcontentloaded' });
    expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
    const delivered = [];
    for (let cycle = 1; cycle <= 2; cycle++) {
      if (cycle === 2) {
        await page.getByRole('button', { name: 'Repetir foto', exact: true }).click();
        await page.evaluate(() => { window.__foto89color = '#b3264e'; });
      }
      const capture = page.getByTestId('boton-sacar-foto');
      await expect(capture).toBeEnabled({ timeout: 60000 }); await capture.click();
      await expect(page.locator('img[alt="Captura Final"]')).toBeVisible({ timeout: 60000 });
      await expect.poll(async () => ((await ref.get()).data()?.others?.entretenimiento?.modules?.fotocabina?.media || []).length,
        { timeout: 75000 }).toBe(cycle);
      const rows = (await ref.get()).data().others.entretenimiento.modules.fotocabina.media;
      const row = rows.find(r => !delivered.some(previous => previous.id === r.id));
      expect(row?.url).toMatch(/^http:\/\/127\.0\.0\.1:9195\//);
      const u = new URL(row.url);
      const objectName = decodeURIComponent(u.pathname.split('/o/')[1]);
      expect(objectName).toContain(prefix);
      const object = bucket.file(objectName);
      const bytes = (await object.download())[0];
      expect(bytes.length).toBeGreaterThan(1000);
      expect((await object.getMetadata())[0].contentType).toBe('image/jpeg');
      const qr = page.locator('svg[width="180"][height="180"]');
      await expect(qr).toBeVisible({ timeout: 20000 });
      const png = await qr.locator('..').screenshot({ path: info.outputPath('qr-' + cycle + '.png') });
      const decoded = await decodeQr(page, png); expect(decoded).toBe(row.url);
      const result = await receiver.goto(decoded, { waitUntil: 'load' });
      expect(result.status()).toBe(200); expect((await result.body()).equals(bytes)).toBe(true);
      expect((await reception.cookies()).some(c => c.name === 'ak_session')).toBe(false);
      await expect.poll(() => receiver.locator('img').first().evaluate(img => img.naturalWidth)).toBeGreaterThan(100);
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Guardar en el celular', exact: true }).click();
      const download = await downloadPromise;
      expect(await download.failure()).toBeNull();
      const local = fs.readFileSync(await download.path());
      expect(local[0]).toBe(0xff); expect(local[1]).toBe(0xd8); expect(local.length).toBeGreaterThan(1000);
      await info.attach('entrega-' + cycle + '.json', { body: JSON.stringify({ id: row.id, url: row.url,
        storageBytes: bytes.length, downloadedBytes: local.length, qr: decoded, noTeamSession: true }), contentType: 'application/json' });
      delivered.push({ id: row.id, bytes });
    }
    expect(delivered[0].id).not.toBe(delivered[1].id);
    expect(delivered[0].bytes.equals(delivered[1].bytes)).toBe(false);
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect((await ref.get()).data().others.entretenimiento.modules.fotocabina.media).toHaveLength(2);
    const [files] = await bucket.getFiles({ prefix }); expect(files).toHaveLength(2);
    await info.attach('persistencia-final.json', { body: JSON.stringify({ ids: delivered.map(d => d.id), objects: files.map(f => f.name), errors }), contentType: 'application/json' });
    expect(errors).toEqual([]);
  } finally {
    await reception.close();
    const [files] = await bucket.getFiles({ prefix }); await Promise.all(files.map(f => f.delete()));
    const posts = await db.collection('social_gallery_posts').where('fiestaId', '==', fiesta.id).get();
    await Promise.all(posts.docs.map(p => p.ref.delete()));
    await ref.delete(); borrarFiesta(fiesta.id);
  }
});
