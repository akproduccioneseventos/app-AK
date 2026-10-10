# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 92-video-vida-final.spec.ts >> video vida reemplaza hasta el archivo final y deja un solo slot
- Location: tests\e2e\92-video-vida-final.spec.ts:16:5

# Error details

```
Test timeout of 240000ms exceeded.
```

```
Error: locator.setInputFiles: Test timeout of 240000ms exceeded.
Call log:
  - waiting for locator('#upload-1')

```

# Test source

```ts
  1  | // @ts-nocheck -- Retest QA aislado; las escrituras se comprueban en Storage real de prueba.
  2  | import os from 'node:os';
  3  | import path from 'node:path';
  4  | import { test, expect } from '@playwright/test';
  5  | import admin from 'firebase-admin';
  6  | import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
  7  | 
  8  | const bucketName = 'demo-ak-producciones.appspot.com';
  9  | if (process.env.AK_ENTORNO_AISLADO !== 'true' || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-') ||
  10 |     path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88') || process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones') throw new Error('Solo TEMP/demo de QA');
  11 | if (process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9195') throw new Error('Falta Storage 9195 para registrar el fixture');
  12 | const app = admin.initializeApp({ projectId: 'demo-ak-producciones', storageBucket: bucketName }, `vida92-${process.pid}`);
  13 | const db = app.firestore(); const bucket = app.storage().bucket(bucketName);
  14 | test.afterAll(async () => app.delete());
  15 | 
  16 | test('video vida reemplaza hasta el archivo final y deja un solo slot', async ({ page, context }, info) => {
  17 |   test.setTimeout(240000);
  18 |   const id = `e2e_vida92_${Date.now()}_${process.pid}`;
  19 |   const fiesta = crearFiestaDeEstaNoche({ id });
  20 |   fiesta.videoVida = { ...fiesta.videoVida, galleryEnabled: true, photoCount: 2 };
  21 |   const ref = db.collection('fiestas').doc(id);
  22 |   const prefix = `video-vida-photos/${id}/`;
  23 |   try {
  24 |     try { guardarFiesta(fiesta); await ref.set(JSON.parse(JSON.stringify(fiesta))); } catch (error) { throw new Error(`No fue posible registrar fixture ${id}: ${error}`); }
  25 |     await page.goto(`/video-vida/${id}`, { waitUntil: 'domcontentloaded' });
  26 |     await expect(page.locator('#upload-1')).toBeAttached({ timeout: 60000 });
  27 |     expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
  28 |     let ultimo;
  29 |     for (const [mime, extension, color] of [['image/png', 'png', '#346ab5'], ['image/jpeg', 'jpg', '#dfbc21']]) {
  30 |       const encoded = await page.evaluate(({ mime, color }) => { const c = document.createElement('canvas'); c.width = 100; c.height = 100; const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, 100, 100); return c.toDataURL(mime).split(',')[1]; }, { mime, color });
> 31 |       await page.locator('#upload-1').setInputFiles({ name: `qa92.${extension}`, mimeType: mime, buffer: Buffer.from(encoded, 'base64') });
     |       ^ Error: locator.setInputFiles: Test timeout of 240000ms exceeded.
  32 |       await expect(page.getByRole('status').filter({hasText:/Foto Subida/})).toBeVisible({ timeout: 60000 });
  33 |       const final = bucket.file(`${prefix}01.${extension}`);
  34 |       await expect.poll(async () => (await final.exists())[0], { timeout: 30000 }).toBe(true);
  35 |       expect((await final.getMetadata())[0].contentType).toBe(mime);
  36 |       expect((await final.download())[0]).toEqual(Buffer.from(encoded, 'base64'));
  37 |       ultimo=Buffer.from(encoded,'base64');
  38 |       await expect(page.getByRole('status').filter({hasText:/Foto Subida/})).toBeHidden({ timeout: 15000 });
  39 |     }
  40 |     const [files] = await bucket.getFiles({ prefix });
  41 |     await info.attach('video92-final-storage.json', { body: JSON.stringify({ slot: 1, files: files.map(file => file.name), final: '01.jpg' }, null, 2), contentType: 'application/json' });
  42 |     expect(files.map(file => file.name).filter(name => /\/01\./.test(name))).toEqual([`${prefix}01.jpg`]);
  43 |     const url=`http://127.0.0.1:9195/v0/b/${bucketName}/o/${encodeURIComponent(prefix+'01.jpg')}?alt=media`;
  44 |     const respuesta=await page.request.get(url);expect(respuesta.status()).toBe(200);expect(await respuesta.body()).toEqual(ultimo);
  45 |     await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#upload-1')).toBeAttached();
  46 |     await info.attach('video92-lectura-recarga.json',{body:JSON.stringify({httpFinal:respuesta.status(),bytesIguales:true,imagenes:await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({src:i.src,loaded:i.complete&&i.naturalWidth>0})))},null,2),contentType:'application/json'});
  47 |   } finally {
  48 |     const [files] = await bucket.getFiles({ prefix }); await Promise.all(files.map(file => file.delete()));
  49 |     await ref.delete(); borrarFiesta(id);
  50 |   }
  51 | });
  52 | 
```