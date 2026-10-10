# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 92-video-vida-final.spec.ts >> video vida reemplaza hasta el archivo final y deja un solo slot
- Location: tests\e2e\92-video-vida-final.spec.ts:16:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Foto Subida/)
Expected: visible
Error: strict mode violation: getByText(/Foto Subida/) resolved to 2 elements:
    1) <div class="text-sm font-semibold break-words">¡Foto Subida!</div> aka getByText('¡Foto Subida!', { exact: true })
    2) <span role="status" aria-live="assertive">Notification ¡Foto Subida!La foto 1 se ha guardad…</span> aka getByText('Notification ¡Foto Subida!La')

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for getByText(/Foto Subida/)

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
  28 |     for (const [mime, extension, color] of [['image/png', 'png', '#346ab5'], ['image/jpeg', 'jpg', '#dfbc21']]) {
  29 |       const encoded = await page.evaluate(({ mime, color }) => { const c = document.createElement('canvas'); c.width = 100; c.height = 100; const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, 100, 100); return c.toDataURL(mime).split(',')[1]; }, { mime, color });
  30 |       await page.locator('#upload-1').setInputFiles({ name: `qa92.${extension}`, mimeType: mime, buffer: Buffer.from(encoded, 'base64') });
> 31 |       await expect(page.getByText(/Foto Subida/)).toBeVisible({ timeout: 60000 });
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  32 |       const final = bucket.file(`${prefix}01.${extension}`);
  33 |       await expect.poll(async () => (await final.exists())[0], { timeout: 30000 }).toBe(true);
  34 |       expect((await final.getMetadata())[0].contentType).toBe(mime);
  35 |       expect((await final.download())[0]).toEqual(Buffer.from(encoded, 'base64'));
  36 |       await expect(page.getByText(/Foto Subida/)).toBeHidden({ timeout: 15000 });
  37 |     }
  38 |     const [files] = await bucket.getFiles({ prefix });
  39 |     await info.attach('video92-final-storage.json', { body: JSON.stringify({ slot: 1, files: files.map(file => file.name), final: '01.jpg' }, null, 2), contentType: 'application/json' });
  40 |     expect(files.map(file => file.name).filter(name => /\/01\./.test(name))).toEqual([`${prefix}01.jpg`]);
  41 |   } finally {
  42 |     const [files] = await bucket.getFiles({ prefix }); await Promise.all(files.map(file => file.delete()));
  43 |     await ref.delete(); borrarFiesta(id);
  44 |   }
  45 | });
  46 | 
```