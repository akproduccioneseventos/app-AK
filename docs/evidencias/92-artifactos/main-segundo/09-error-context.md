# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 92-album-pendientes.spec.ts >> album excluye enlace caducado sin falso ZIP exitoso
- Location: tests\e2e\92-album-pendientes.spec.ts:49:5

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /Descarga incompleta/
Received string:  ""
```

# Test source

```ts
  1   | // @ts-nocheck -- Retest QA aislado; no usa credenciales reales ni modifica producto.
  2   | import fs from 'node:fs';
  3   | import os from 'node:os';
  4   | import path from 'node:path';
  5   | import { test, expect } from '@playwright/test';
  6   | import admin from 'firebase-admin';
  7   | import JSZip from 'jszip';
  8   | import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
  9   | 
  10  | const host = '127.0.0.1';
  11  | const bucketName = 'demo-ak-producciones.appspot.com';
  12  | if (process.env.AK_ENTORNO_AISLADO !== 'true' || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-') ||
  13  |     path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88') ||
  14  |     process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones') throw new Error('Solo TEMP/demo de QA');
  15  | if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('Falta Storage emulado para registrar el fixture');
  16  | const app = admin.initializeApp({ projectId: 'demo-ak-producciones', storageBucket: bucketName }, `album92-${process.pid}`);
  17  | const db = app.firestore(); db.settings({ ignoreUndefinedProperties: true });
  18  | const bucket = app.storage().bucket(bucketName);
  19  | test.afterAll(async () => app.delete());
  20  | 
  21  | function storageUrl(name: string, query = 'alt=media') {
  22  |   return `http://${host}:9195/v0/b/${bucketName}/o/${encodeURIComponent(name)}?${query}`;
  23  | }
  24  | 
  25  | async function registrarFixture(id: string, count: number, page: any, includeExpired = false) {
  26  |   const fiesta = crearFiestaDeEstaNoche({ id });
  27  |   fiesta.configuracion.nombreEvento = 'Album QA 92';
  28  |   const ref = db.collection('fiestas').doc(id);
  29  |     const names = Array.from({ length: count }, (_, i) => `qa92/${id}/medio-${String(i).padStart(3, '0')}.png`);
  30  |   try {
  31  |     guardarFiesta(fiesta);
  32  |     await ref.set(JSON.parse(JSON.stringify(fiesta)));
  33  |     const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  34  |     const audio = Buffer.from(await page.evaluate(async () => { const ctx = new AudioContext(); const dest = ctx.createMediaStreamDestination(); const osc = ctx.createOscillator(); osc.connect(dest); osc.start(); const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' }); const chunks: Blob[] = []; const stopped = new Promise<void>(resolve => { rec.onstop = () => resolve(); }); rec.ondataavailable = e => chunks.push(e.data); rec.start(); await new Promise(r => setTimeout(r, 250)); osc.stop(); rec.stop(); await stopped; ctx.close(); return btoa(String.fromCharCode(...new Uint8Array(await new Blob(chunks, { type: 'audio/webm' }).arrayBuffer()))); }), 'base64');
  35  |     await Promise.all(names.map(name => bucket.file(name).save(png, { metadata: { contentType: 'image/png', metadata: { qaFixture: id } } })));
  36  |     const audioName = `dedications-audio/${id}/qa92.webm`;
  37  |     await bucket.file(audioName).save(audio, { metadata: { contentType: 'audio/webm', metadata: { qaFixture: id } } });
  38  |     const posts = names.map((name, i) => ({ id: `${id}_${i}`, fiestaId: id, imageUrl: storageUrl(name), mediaType: 'image', moderationStatus: 'approved', authorName: `QA92 ${i}`, timestamp: new Date(Date.now() - i).toISOString(), likes: 0, comments: [], sourceModule: 'fotocabina', dedication: `Dedicatoria QA92 ${i}` }));
  39  |     if (includeExpired) posts.push({ id: `${id}_expired`, fiestaId: id, imageUrl: storageUrl(names[0], 'alt=media&token=expired-qa92'), mediaType: 'image', moderationStatus: 'approved', authorName: 'QA92 CADUCADO', timestamp: new Date().toISOString(), likes: 0, comments: [], sourceModule: 'fotocabina', dedication: 'Dedicatoria caducada QA92' });
  40  |     await Promise.all(posts.map(post => db.collection('social_gallery_posts').doc(post.id).set(post)));
  41  |     const dedication = { id: `${id}_dedication`, fiestaId: id, message: 'Dedicatoria de audio QA92', authorName: 'QA92', timestamp: new Date().toISOString(), audioUrl: storageUrl(audioName), visibility: 'public' };
  42  |     await db.collection('social_dedications').doc(dedication.id).set(dedication);
  43  |     return { fiesta, ref, names, audioName, posts, dedication };
  44  |   } catch (error) {
  45  |     throw new Error(`No fue posible registrar fixture ${id}: ${error}`);
  46  |   }
  47  | }
  48  | 
  49  | test('album excluye enlace caducado sin falso ZIP exitoso', async ({ page, context }, info) => {
  50  |   test.setTimeout(180000);
  51  |   const id = `e2e_album92_expired_${process.pid}_${Date.now()}`;
  52  |   const fixture = await registrarFixture(id, 2, page, true);
  53  |   try {
  54  |     const expiredResponses: number[] = [];
  55  |     await page.route('**/v0/b/**', route => route.request().url().includes('expired-qa92')
  56  |       ? route.fulfill({ status: 403, contentType: 'text/plain', body: 'expired fixture' })
  57  |       : route.continue());
  58  |     page.on('response', response => { if (response.url().includes('expired-qa92')) expiredResponses.push(response.status()); });
  59  |     await page.goto(`/evento/album/${id}`, { waitUntil: 'domcontentloaded' });
  60  |     await expect(page.getByText(/4 recuerdos seleccionados/)).toBeVisible({ timeout: 45000 });
  61  |     expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
  62  |     await page.getByRole('button', { name: /Galer.a Completa/ }).click();
  63  |     await expect(page.getByText('QA92 CADUCADO', { exact: true })).toBeVisible();
  64  |     await page.getByRole('button',{name:/Mensajes \(1\)/}).click();
  65  |     await expect(page.getByText('Dedicatoria de audio QA92',{exact:false})).toBeVisible();
  66  |     const audioControl=await page.locator('audio[src*="127.0.0.1:9195"]').first().evaluate(async(a)=>{await a.play();return {paused:a.paused,duration:a.duration};});
  67  |     expect(audioControl.paused).toBe(false);
  68  |     await info.attach('dedicatoria-audio-real.json',{body:JSON.stringify(audioControl),contentType:'application/json'});
  69  |     const downloadPromise = page.waitForEvent('download');
  70  |     await page.getByTestId('boton-descargar-album').click();
  71  |     const download = await downloadPromise;
  72  |     const zip = await JSZip.loadAsync(fs.readFileSync(await download.path()));
  73  |     const items = Object.values(zip.files).filter(file => !file.dir && !file.name.endsWith('info-evento.txt'));
  74  |     const aviso = (await page.getByRole('status').allTextContents()).join(' ');
  75  |     await info.attach('album92-expired.json', { body: JSON.stringify({ selected: 3, expiredStatus: expiredResponses, partialItems: items.map(i => i.name), aviso, avisoPresente: Boolean(aviso.trim()), filename: download.suggestedFilename() }, null, 2), contentType: 'application/json' });
  76  |     expect(expiredResponses).toContain(403);
  77  |     expect(items).toHaveLength(2);
> 78  |     expect(aviso).toMatch(/Descarga incompleta/);
      |                   ^ Error: expect(received).toMatch(expected)
  79  |     expect(aviso).toMatch(/Se empaquetaron 2 de 3 recuerdos/);
  80  |     await expect(page.getByTestId('boton-reintentar-descarga')).toBeVisible();
  81  |   } finally { await cleanup(id, fixture); }
  82  | });
  83  | 
  84  | test('album limita el recorrido real a 200 medios aprobados', async ({ page }, info) => {
  85  |   test.setTimeout(240000);
  86  |   const id = `e2e_album92_volume_${process.pid}_${Date.now()}`;
  87  |   const fixture = await registrarFixture(id, 200, page);
  88  |   try {
  89  |     await page.goto(`/evento/album/${id}`, { waitUntil: 'domcontentloaded' });
  90  |     await expect(page.getByText(/40 recuerdos seleccionados/)).toBeVisible({ timeout: 60000 });
  91  |     const downloadPromise = page.waitForEvent('download');
  92  |     await page.getByTestId('boton-descargar-album').click();
  93  |     const download = await downloadPromise;
  94  |     const zip = await JSZip.loadAsync(fs.readFileSync(await download.path()));
  95  |     const items = Object.values(zip.files).filter(file => !file.dir && !file.name.endsWith('info-evento.txt'));
  96  |     await info.attach('album92-volume.json', { body: JSON.stringify({ requestedMedia: 200, dedicationVisibleInAlbum: true, dedicationIncludedByHandleDownloadAll: false, itemCount: items.length, filename: download.suggestedFilename() }, null, 2), contentType: 'application/json' });
  97  |     expect(items).toHaveLength(200);
  98  |     const esperado=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
  99  |     for(const item of items)expect(await item.async('nodebuffer')).toEqual(esperado);
  100 |   } finally { await cleanup(id, fixture); }
  101 | });
  102 | 
  103 | async function cleanup(id: string, fixture: any) {
  104 |   await Promise.all(fixture.posts.map((post: any) => db.collection('social_gallery_posts').doc(post.id).delete()));
  105 |   await db.collection('social_dedications').doc(fixture.dedication.id).delete();
  106 |   await fixture.ref.delete(); borrarFiesta(id);
  107 |   const [files] = await bucket.getFiles({ prefix: `qa92/${id}/` });
  108 |   await Promise.all(files.map(file => file.delete()));
  109 |   const [audioFiles] = await bucket.getFiles({ prefix: `dedications-audio/${id}/` });
  110 |   await Promise.all(audioFiles.map(file => file.delete()));
  111 | }
  112 | 
```