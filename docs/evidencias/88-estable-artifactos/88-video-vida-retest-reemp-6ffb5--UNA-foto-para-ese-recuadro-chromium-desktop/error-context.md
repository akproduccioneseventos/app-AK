# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 88-video-vida-retest.spec.ts >> reemplazar la foto 1 PNG por JPEG conserva UNA foto para ese recuadro
- Location: tests\e2e\88-video-vida-retest.spec.ts:16:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Tu Galería (1 de 2)', { exact: true })
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByText('Tu Galería (1 de 2)', { exact: true })

```

```yaml
- img
- text: ¡Ups! Algo salió mal Ocurrió un error inesperado. No te preocupes, tus datos están seguros.
- button "Reintentar":
  - img
  - text: Reintentar
- button "Volver al Inicio":
  - img
  - text: Volver al Inicio
- button "Ver detalles técnicos":
  - img
  - text: Ver detalles técnicos
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | // @ts-nocheck -- Browser upload, real SDK against demo Storage, only owned fixtures.
  2  | import os from 'node:os';
  3  | import path from 'node:path';
  4  | import { test, expect } from '@playwright/test';
  5  | import admin from 'firebase-admin';
  6  | import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
  7  | if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== path.join(os.tmpdir(),'ak-codex88')
  8  |   || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  9  |   || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9195') throw new Error('Solo TEMP/emulador');
  10 | const app = admin.initializeApp({projectId:'demo-ak-producciones'},'vida87-'+process.pid);
  11 | const db=app.firestore();
  12 | db.settings({ignoreUndefinedProperties:true});
  13 | const bucket=app.storage().bucket('demo-ak-producciones.appspot.com');
  14 | test.afterAll(async()=>{await app.delete();});
  15 |
  16 | test('reemplazar la foto 1 PNG por JPEG conserva UNA foto para ese recuadro',async({page,context},info)=>{
  17 |   test.setTimeout(180000);
  18 |   const fiesta=crearFiestaDeEstaNoche({id:'e2e_vida87_'+Date.now()+'_'+process.pid});
  19 |   fiesta.videoVida={...fiesta.videoVida,galleryEnabled:true,photoCount:2};
  20 |   const prefix='video-vida-photos/'+fiesta.id+'/';
  21 |   const ref=db.collection('fiestas').doc(fiesta.id);
  22 |   try {
  23 |     guardarFiesta(fiesta);
  24 |     await ref.set(JSON.parse(JSON.stringify(fiesta)));
  25 |     await page.goto('/video-vida/'+fiesta.id,{waitUntil:'domcontentloaded'});
  26 |     await expect(page.getByText('Tu Galería (0 de 2)',{exact:true})).toBeVisible({timeout:25000});
  27 |     expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
  28 |     const buffers={};
  29 |     for(const [mime,extension,color] of [['image/png','png','#346ab5'],['image/jpeg','jpg','#dfbc21']]) {
  30 |       const encoded=await page.evaluate(({mime,color})=>{
  31 |         const c=document.createElement('canvas'); c.width=100; c.height=100;
  32 |         const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,100,100);
  33 |         return c.toDataURL(mime).split(',')[1];
  34 |       },{mime,color});
  35 |       const buffer=Buffer.from(encoded,'base64');buffers[extension]=buffer;
  36 |       await page.locator('#upload-1').setInputFiles({name:'foto-sonda87.'+extension,mimeType:mime,buffer});
  37 |       await expect(page.getByText('¡Foto Subida!',{exact:true})).toBeVisible({timeout:60000});
> 38 |       await expect(page.getByText('Tu Galería (1 de 2)',{exact:true})).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  39 |       const stored=bucket.file(prefix+'01.'+extension);
  40 |       await expect.poll(async()=>(await stored.exists())[0],{timeout:15000}).toBe(true);
  41 |       expect((await stored.download())[0]).toEqual(buffer);
  42 |       expect((await stored.getMetadata())[0].contentType).toBe(mime);
  43 |       // Wait for each toast to retire, so a stale success cannot satisfy next upload.
  44 |       await expect(page.getByText('¡Foto Subida!',{exact:true})).toBeHidden({timeout:15000});
  45 |     }
  46 |     const [files]=await bucket.getFiles({prefix});
  47 |     const names=files.map(f=>f.name);
  48 |     await info.attach('fotos-real-storage.json',{body:JSON.stringify({names,slot:1,expected:1},null,2),contentType:'application/json'});
  49 |     await page.screenshot({path:info.outputPath('reemplazo-foto-1.png')});
  50 |     expect(names.filter(n=>/\/01\./.test(n)),'un recuadro reemplazado no debe entregar dos fotos').toHaveLength(1);
  51 |   } finally {
  52 |     const [files]=await bucket.getFiles({prefix});
  53 |     await Promise.all(files.map(f=>f.delete()));
  54 |     await ref.delete();borrarFiesta(fiesta.id);
  55 |   }
  56 | });
  57 |
  58 | test('deshabilitar la carga impide subir desde una pantalla que quedo abierta',async({page,context},info)=>{
  59 |   test.setTimeout(180000);
  60 |   const fiesta=crearFiestaDeEstaNoche({id:'e2e_vida87_revocada_'+Date.now()+'_'+process.pid});
  61 |   fiesta.videoVida={...fiesta.videoVida,galleryEnabled:true,photoCount:2};
  62 |   const prefix='video-vida-photos/'+fiesta.id+'/';
  63 |   const ref=db.collection('fiestas').doc(fiesta.id);
  64 |   try {
  65 |     guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
  66 |     await page.goto('/video-vida/'+fiesta.id,{waitUntil:'domcontentloaded'});
  67 |     await expect(page.locator('#upload-1')).toBeAttached({timeout:60000});
  68 |     expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
  69 |     fiesta.videoVida.galleryEnabled=false;
  70 |     guardarFiesta(fiesta);await ref.update({'videoVida.galleryEnabled':false});
  71 |     expect((await ref.get()).data().videoVida.galleryEnabled).toBe(false);
  72 |     const png=await page.evaluate(()=>{
  73 |       const c=document.createElement('canvas');c.width=80;c.height=80;
  74 |       c.getContext('2d').fillRect(0,0,80,80);return c.toDataURL('image/png').split(',')[1];
  75 |     });
  76 |     await page.locator('#upload-1').setInputFiles({name:'revocada.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  77 |     // Observe actual write OR visible rejection, not the lifetime of the Next response stream.
  78 |     await expect.poll(async()=>{
  79 |       const [files]=await bucket.getFiles({prefix});
  80 |       return files.length>0 || await page.getByText('Error al subir',{exact:true}).isVisible();
  81 |     },{timeout:20000}).toBe(true);
  82 |     const [files]=await bucket.getFiles({prefix});
  83 |     await info.attach('carga-desactivada-storage.json',{body:JSON.stringify({galleryEnabled:false,files:files.map(f=>f.name)},null,2),contentType:'application/json'});
  84 |     await page.screenshot({path:info.outputPath('carga-desactivada.png')});
  85 |     expect(files,'carga deshabilitada no debe aceptar una foto desde pantalla vieja').toHaveLength(0);
  86 |   } finally {
  87 |     const [files]=await bucket.getFiles({prefix});await Promise.all(files.map(f=>f.delete()));
  88 |     await ref.delete();borrarFiesta(fiesta.id);
  89 |   }
  90 | });
  91 |
```
