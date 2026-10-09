// @ts-nocheck -- evidencia para copiar a tests/e2e dentro del runner aislado.
// No ejecutar contra datos reales ni proveedores externos.
import { expect, test, type Page } from '@playwright/test';
import admin from 'firebase-admin';
import fs from 'node:fs';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  crearPermisoDeEstacion,
  leerFiesta,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

const DEMO_PROJECT = 'demo-ak-producciones';
if (process.env.FIREBASE_PROJECT_ID !== DEMO_PROJECT
  || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== DEMO_PROJECT
  || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085'
  || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9195') {
  throw new Error('Sonda 83: exige runner 81 sanitizado y emuladores locales demo.');
}

const app = admin.initializeApp({ projectId: DEMO_PROJECT, storageBucket: 'demo-ak-producciones.appspot.com' }, `audit83-${process.pid}`);
const db = app.firestore();
const bucket = app.storage().bucket();
const EVENTS = [
  { label: 'Plataforma 360', route: 'plataforma-360', module: 'plataforma360' },
  { label: 'Bogue', route: 'bogue', module: 'bogue' },
  { label: 'Buzon', route: 'buzon', module: 'capsulaTiempo' },
];
const fiestaIds: string[] = [];

test.afterAll(async () => {
  for (const fiestaId of fiestaIds) {
    const messages = await db.collection('buzon_messages').where('fiestaId', '==', fiestaId).get();
    await Promise.all(messages.docs.map((item) => item.ref.delete()));
    const [files] = await bucket.getFiles({ prefix: `fiestas/${fiestaId}/` });
    await Promise.all(files.map((file) => file.delete().catch(() => undefined)));
    const [mediaFiles] = await bucket.getFiles({ prefix: `entertainment/${fiestaId}/` });
    await Promise.all(mediaFiles.map((file) => file.delete().catch(() => undefined)));
    borrarFiesta(fiestaId);
  }
  await app.delete();
});

async function fixture(fiestaId: string, module: string) {
  fiestaIds.push(fiestaId);
  const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
  const modules = {
    ...(fiesta.others?.entretenimiento?.modules || {}),
    [module]: { enabled: true, segundosCuentaRegresiva: 1, countdownSeconds: 1, autoPublish: true },
  };
  fiesta.others = { ...fiesta.others, entretenimiento: { ...fiesta.others?.entretenimiento, modules } };
  if (module === 'capsulaTiempo') fiesta.buzonConfig = { ...fiesta.buzonConfig, enabled: true };
  guardarFiesta(fiesta);
}

async function simularGrabacion(page: Page, route: string, fiestaId: string, module: string) {
  await enchufarCamaraFalsa(page);
  const access = crearPermisoDeEstacion(fiestaId, module);
  const response = await page.goto(`/evento/${route}/${fiestaId}?access=${access}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${route} abre en localhost`).toBeLessThan(400);

  if (route === 'buzon') {
    await page.getByRole('button', { name: /Grabar Video/i }).first().click();
    await page.getByRole('button', { name: /Comenzar a Grabar/i }).click();
    await expect(page.getByRole('button', { name: /Detener Grabación/i })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1_000);
    await page.getByRole('button', { name: /Detener Grabación/i }).click();
    await expect(page.getByText('Video Grabado')).toBeVisible({ timeout: 30_000 });
    const review = page.locator('video[src^="blob:"]').first();
    await expect(review).toBeVisible();
    await expect.poll(() => review.evaluate(async (video: HTMLVideoElement) =>
      (await (await fetch(video.src)).blob()).size)).toBeGreaterThan(0);
    await page.getByLabel(/Tu Nombre y Apellido/i).fill('Sonda AK 83');
    await page.getByRole('button', { name: /Enviar Recuerdo/i }).click();
    await expect(page.getByText('¡Mensaje guardado!')).toBeVisible({ timeout: 60_000 });
    return;
  }

  const record = route === 'plataforma-360'
    ? page.getByRole('button', { name: 'Grabar video', exact: true })
    : page.getByRole('button', { name: 'Grabar loop', exact: true });
  await expect(record, `${route}: control de grabacion del invitado`).toBeVisible({ timeout: 30_000 });
  await record.click();
  // La estación finaliza su propio MediaRecorder/procesamiento; no se sustituye
  // ese resultado por un Blob fabricado por la prueba.
}

for (const station of EVENTS) {
  test(`${station.label}: archivo final persistido y descargable desde emuladores`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const baseURL = new URL(testInfo.project.use.baseURL);
    expect(['localhost', '127.0.0.1', '::1']).toContain(baseURL.hostname);
    const fiestaId = `e2e_83_${station.route}_${Date.now()}`;
    await fixture(fiestaId, station.module);
    await simularGrabacion(page, station.route, fiestaId, station.module);

    let storagePath = '';
    let downloadUrl = '';
    if (station.route === 'buzon') {
      await expect.poll(async () => (await db.collection('buzon_messages')
        .where('fiestaId', '==', fiestaId).get()).size, { timeout: 60_000 }).toBe(1);
      const snap = await db.collection('buzon_messages').where('fiestaId', '==', fiestaId).get();
      const row = snap.docs[0].data();
      expect(row.mediaType).toBe('video');
      storagePath = row.storagePath;
      downloadUrl = row.mediaUrl;
    } else {
      await expect.poll(() => {
        const current = leerFiesta(fiestaId);
        return current?.others?.entretenimiento?.modules?.[station.module]?.media
          ?.filter((item: any) => item.type === 'video').length || 0;
      }, { timeout: 150_000 }).toBe(1);
      const current = leerFiesta(fiestaId);
      const row = current.others.entretenimiento.modules[station.module].media
        .find((item: any) => item.type === 'video');
      expect(row.type).toBe('video');
      storagePath = new URL(row.url).pathname.split('/o/').pop() || '';
      storagePath = decodeURIComponent(storagePath.split('?')[0]);
      downloadUrl = row.url;
    }

    expect(storagePath).toContain(fiestaId);
    const storedFile = bucket.file(storagePath);
    const [storedBytes] = await storedFile.download();
    const [metadata] = await storedFile.getMetadata();
    expect(storedBytes.byteLength, 'SDK Admin lee el archivo del emulador Storage').toBeGreaterThan(0);
    expect(metadata.contentType).toMatch(/^video\/(webm|mp4)/i);
    const parsedDownloadUrl = new URL(downloadUrl);
    expect(['http:', 'https:']).toContain(parsedDownloadUrl.protocol);
    expect(['localhost', '127.0.0.1', '::1']).toContain(parsedDownloadUrl.hostname);
    expect(parsedDownloadUrl.port).toBe('9195');
    const response = await page.request.get(downloadUrl);
    expect(response.status(), 'URL persistida descargable en localhost/emulador').toBe(200);
    const downloadedBytes = await response.body();
    const downloadedMime = response.headers()['content-type']?.split(';')[0].toLowerCase();
    expect(downloadedMime).toBe(metadata.contentType.toLowerCase());
    expect(downloadedBytes.byteLength).toBeGreaterThan(0);
    expect(downloadedBytes.equals(storedBytes), 'GET devuelve exactamente los bytes leídos por el SDK').toBe(true);
    fs.writeFileSync(testInfo.outputPath(`${station.route}-recuerdo-final${metadata.contentType === 'video/mp4' ? '.mp4' : '.webm'}`), downloadedBytes);
  });
}
