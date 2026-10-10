// @ts-nocheck -- Retest QA aislado; no usa credenciales reales ni modifica producto.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import JSZip from 'jszip';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

const host = '127.0.0.1';
const bucketName = 'demo-ak-producciones.appspot.com';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-') ||
    path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88') ||
    process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones') throw new Error('Solo TEMP/demo de QA');
if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('Falta Storage emulado para registrar el fixture');
const app = admin.initializeApp({ projectId: 'demo-ak-producciones', storageBucket: bucketName }, `album92-${process.pid}`);
const db = app.firestore(); db.settings({ ignoreUndefinedProperties: true });
const bucket = app.storage().bucket(bucketName);
test.afterAll(async () => app.delete());

function storageUrl(name: string, query = 'alt=media') {
  return `http://${host}:9195/v0/b/${bucketName}/o/${encodeURIComponent(name)}?${query}`;
}

async function registrarFixture(id: string, count: number, page: any, includeExpired = false) {
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.configuracion.nombreEvento = 'Album QA 92';
  const ref = db.collection('fiestas').doc(id);
    const names = Array.from({ length: count }, (_, i) => `qa92/${id}/medio-${String(i).padStart(3, '0')}.png`);
  try {
    guardarFiesta(fiesta);
    await ref.set(JSON.parse(JSON.stringify(fiesta)));
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    const audio = Buffer.from(await page.evaluate(async () => { const ctx = new AudioContext(); const dest = ctx.createMediaStreamDestination(); const osc = ctx.createOscillator(); osc.connect(dest); osc.start(); const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' }); const chunks: Blob[] = []; const stopped = new Promise<void>(resolve => { rec.onstop = () => resolve(); }); rec.ondataavailable = e => chunks.push(e.data); rec.start(); await new Promise(r => setTimeout(r, 250)); osc.stop(); rec.stop(); await stopped; ctx.close(); return btoa(String.fromCharCode(...new Uint8Array(await new Blob(chunks, { type: 'audio/webm' }).arrayBuffer()))); }), 'base64');
    await Promise.all(names.map(name => bucket.file(name).save(png, { metadata: { contentType: 'image/png', metadata: { qaFixture: id } } })));
    const audioName = `dedications-audio/${id}/qa92.webm`;
    await bucket.file(audioName).save(audio, { metadata: { contentType: 'audio/webm', metadata: { qaFixture: id } } });
    const posts = names.map((name, i) => ({ id: `${id}_${i}`, fiestaId: id, imageUrl: storageUrl(name), mediaType: 'image', moderationStatus: 'approved', authorName: `QA92 ${i}`, timestamp: new Date(Date.now() - i).toISOString(), likes: 0, comments: [], sourceModule: 'fotocabina', dedication: `Dedicatoria QA92 ${i}` }));
    if (includeExpired) posts.push({ id: `${id}_expired`, fiestaId: id, imageUrl: storageUrl(names[0], 'alt=media&token=expired-qa92'), mediaType: 'image', moderationStatus: 'approved', authorName: 'QA92 CADUCADO', timestamp: new Date().toISOString(), likes: 0, comments: [], sourceModule: 'fotocabina', dedication: 'Dedicatoria caducada QA92' });
    await Promise.all(posts.map(post => db.collection('social_gallery_posts').doc(post.id).set(post)));
    const dedication = { id: `${id}_dedication`, fiestaId: id, message: 'Dedicatoria de audio QA92', authorName: 'QA92', timestamp: new Date().toISOString(), audioUrl: storageUrl(audioName), visibility: 'public' };
    await db.collection('social_dedications').doc(dedication.id).set(dedication);
    return { fiesta, ref, names, audioName, posts, dedication };
  } catch (error) {
    throw new Error(`No fue posible registrar fixture ${id}: ${error}`);
  }
}

test('album excluye enlace caducado sin falso ZIP exitoso', async ({ page, context }, info) => {
  test.setTimeout(180000);
  const id = `e2e_album92_expired_${process.pid}_${Date.now()}`;
  const fixture = await registrarFixture(id, 2, page, true);
  try {
    const expiredResponses: number[] = [];
    await page.route('**/v0/b/**', route => route.request().url().includes('expired-qa92')
      ? route.fulfill({ status: 403, contentType: 'text/plain', body: 'expired fixture' })
      : route.continue());
    page.on('response', response => { if (response.url().includes('expired-qa92')) expiredResponses.push(response.status()); });
    await page.goto(`/evento/album/${id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/4 recuerdos seleccionados/)).toBeVisible({ timeout: 45000 });
    expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
    await page.getByRole('button', { name: /Galer.a Completa/ }).click();
    await expect(page.getByText('QA92 CADUCADO', { exact: true })).toBeVisible();
    await page.getByRole('button',{name:/Mensajes \(1\)/}).click();
    await expect(page.getByText('Dedicatoria de audio QA92',{exact:false})).toBeVisible();
    const audioControl=await page.locator('audio[src*="127.0.0.1:9195"]').first().evaluate(async(a)=>{await a.play();return {paused:a.paused,duration:a.duration};});
    expect(audioControl.paused).toBe(false);
    await info.attach('dedicatoria-audio-real.json',{body:JSON.stringify(audioControl),contentType:'application/json'});
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('boton-descargar-album').click();
    const download = await downloadPromise;
    const zip = await JSZip.loadAsync(fs.readFileSync(await download.path()));
    const items = Object.values(zip.files).filter(file => !file.dir && !file.name.endsWith('info-evento.txt'));
    await expect(page.getByRole('status').filter({hasText:/Descarga incompleta/})).toBeVisible();
    const aviso = (await page.getByRole('status').allTextContents()).join(' ');
    await info.attach('album92-expired.json', { body: JSON.stringify({ selected: 3, expiredStatus: expiredResponses, partialItems: items.map(i => i.name), aviso, avisoPresente: Boolean(aviso.trim()), filename: download.suggestedFilename() }, null, 2), contentType: 'application/json' });
    expect(expiredResponses).toContain(403);
    expect(items).toHaveLength(2);
    expect(aviso).toMatch(/Descarga incompleta/);
    expect(aviso).toMatch(/Se empaquetaron 2 de 3 recuerdos/);
    await expect(page.getByTestId('boton-reintentar-descarga')).toBeVisible();
  } finally { await cleanup(id, fixture); }
});

test('album limita el recorrido real a 200 medios aprobados', async ({ page }, info) => {
  test.setTimeout(240000);
  const id = `e2e_album92_volume_${process.pid}_${Date.now()}`;
  const fixture = await registrarFixture(id, 200, page);
  try {
    await page.goto(`/evento/album/${id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/40 recuerdos seleccionados/)).toBeVisible({ timeout: 60000 });
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('boton-descargar-album').click();
    const download = await downloadPromise;
    const zip = await JSZip.loadAsync(fs.readFileSync(await download.path()));
    const items = Object.values(zip.files).filter(file => !file.dir && !file.name.endsWith('info-evento.txt'));
    await info.attach('album92-volume.json', { body: JSON.stringify({ requestedMedia: 200, dedicationVisibleInAlbum: true, dedicationIncludedByHandleDownloadAll: false, itemCount: items.length, filename: download.suggestedFilename() }, null, 2), contentType: 'application/json' });
    expect(items).toHaveLength(200);
    const esperado=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    for(const item of items)expect(await item.async('nodebuffer')).toEqual(esperado);
  } finally { await cleanup(id, fixture); }
});

async function cleanup(id: string, fixture: any) {
  await Promise.all(fixture.posts.map((post: any) => db.collection('social_gallery_posts').doc(post.id).delete()));
  await db.collection('social_dedications').doc(fixture.dedication.id).delete();
  await fixture.ref.delete(); borrarFiesta(id);
  const [files] = await bucket.getFiles({ prefix: `qa92/${id}/` });
  await Promise.all(files.map(file => file.delete()));
  const [audioFiles] = await bucket.getFiles({ prefix: `dedications-audio/${id}/` });
  await Promise.all(audioFiles.map(file => file.delete()));
}
