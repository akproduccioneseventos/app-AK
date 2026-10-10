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
test.use({ launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });
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
    const access = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
    await page.goto('/evento/fotocabina/' + fiesta.id + '?access=' + access, { waitUntil: 'domcontentloaded' });
    expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
    const delivered = [];
    for (let cycle = 1; cycle <= 2; cycle++) {
      if (cycle === 2) {
        await page.getByRole('button', { name: 'Repetir foto', exact: true }).click();
      }
      const capture = page.getByTestId('boton-sacar-foto');
      await expect(capture).toBeEnabled({ timeout: 60000 });
      const frame = () => page.evaluate(() => {
        const v = document.querySelector('video');
        const c = document.createElement('canvas'); c.width = 640; c.height = 480;
        const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0, 640, 480);
        const pixels = ctx.getImageData(0, 0, 640, 480).data;
        let nonblack = 0;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 30) nonblack++;
        return { nonblack,
          src: c.toDataURL('image/png'), width: v.videoWidth, readyState: v.readyState,
          playing: !v.paused, trackState: v.srcObject?.getVideoTracks()[0]?.readyState };
      });
      const beforePoll = await frame();
      await info.attach('diagnostico-camara-' + cycle + '.json', { body: JSON.stringify({ ...beforePoll, src: undefined }), contentType: 'application/json' });
      const independent = await page.evaluate(async () => {
        const original = document.querySelector('video');
        const v = document.createElement('video'); v.muted = true; v.autoplay = true; v.playsInline = true;
        v.style.cssText = 'position:fixed;left:0;top:0;width:160px;height:120px;opacity:0;pointer-events:none';
        document.body.appendChild(v); v.srcObject = original.srcObject; await v.play();
        await new Promise(resolve => setTimeout(resolve, 500));
        const c = document.createElement('canvas'); c.width = 640; c.height = 480;
        const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0, 640, 480);
        const rgba = ctx.getImageData(0, 0, 640, 480).data;
        let nonblack = 0; for (let i = 0; i < rgba.length; i += 4) if (rgba[i] + rgba[i + 1] + rgba[i + 2] > 30) nonblack++;
        const result = { nonblack, playing: !v.paused, width: v.videoWidth, src: c.toDataURL('image/png') };
        v.pause(); v.srcObject = null; v.remove(); return result;
      });
      await info.attach('control-independiente-' + cycle + '.json', { body: JSON.stringify({ ...independent, src: undefined }), contentType: 'application/json' });
      await info.attach('control-independiente-' + cycle + '.png', { body: Buffer.from(independent.src.split(',')[1], 'base64'), contentType: 'image/png' });
      expect(independent.nonblack, 'la MISMA senal trae imagen en un reproductor independiente').toBeGreaterThan(10000);
      const before = await frame();
      await info.attach('camara-antes-' + cycle + '.json', { body: JSON.stringify({ ...before, src: undefined }), contentType: 'application/json' });
      await info.attach('camara-antes-' + cycle + '.png', { body: Buffer.from(before.src.split(',')[1], 'base64'), contentType: 'image/png' });
      await capture.click();
      await expect(page.locator('img[alt="Captura Final"]')).toBeVisible({ timeout: 60000 });
      const individual = await page.locator('img[alt="Captura Final"]').getAttribute('src');
      await info.attach('recuerdo-compuesto-' + cycle + '.jpg', { body: Buffer.from(individual.split(',')[1], 'base64'), contentType: 'image/jpeg' });
      const individualPixels = await page.evaluate(async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        // Sample inside the photograph, excluding decoration/footer which can mask a blank capture.
        const pixels = ctx.getImageData(200, 300, 800, 350).data;
        let nonblack = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 30) nonblack++;
        return { width: c.width, height: c.height, nonblack, total: pixels.length / 4 };
      }, individual);
      await info.attach('pixeles-captura-' + cycle + '.json', { body: JSON.stringify(individualPixels), contentType: 'application/json' });
      expect(individualPixels.nonblack / individualPixels.total, 'captura incluye la senal de camara, no solo el marco').toBeGreaterThan(.1);
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
      // Storage delivers attachment: navigation initiates a download, not an inline image.
      const receivedDownloadPromise = receiver.waitForEvent('download');
      await receiver.goto(decoded, { waitUntil: 'load' }).catch(error => {
        if (!String(error.message).includes('Download is starting')) throw error;
      });
      const receivedDownload = await receivedDownloadPromise;
      expect(await receivedDownload.failure()).toBeNull();
      expect(fs.readFileSync(await receivedDownload.path()).equals(bytes)).toBe(true);
      const result = await reception.request.get(decoded);
      expect(result.status()).toBe(200); expect((await result.body()).equals(bytes)).toBe(true);
      expect((await reception.cookies()).some(c => c.name === 'ak_session')).toBe(false);
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
