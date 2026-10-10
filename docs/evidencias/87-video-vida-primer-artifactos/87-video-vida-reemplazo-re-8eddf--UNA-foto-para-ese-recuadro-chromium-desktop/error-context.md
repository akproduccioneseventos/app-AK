# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 87-video-vida-reemplazo.spec.ts >> reemplazar la foto 1 PNG por JPEG conserva UNA foto para ese recuadro
- Location: tests\e2e\87-video-vida-reemplazo.spec.ts:16:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Tu Galería (0 de 2)', { exact: true })
Expected: visible
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 25000ms
  - waiting for getByText('Tu Galería (0 de 2)', { exact: true })

```

```yaml
- img "Logo de la Empresa"
- text: Acceso Protegido Ingresa con tu correo y contraseña. Correo electrónico
- textbox "Correo electrónico":
  - /placeholder: nombre@correo.com
- text: Contraseña
- textbox "Contraseña":
  - /placeholder: ••••••••
- button "Ingresar":
  - img
  - text: Ingresar
- text: O
- button "Ingresar con Google"
- link "Olvide mi contraseña":
  - /url: /login?mode=recovery
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
  7  | if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== os.tmpdir()
  8  |   || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  9  |   || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9195') throw new Error('Solo TEMP/emulador');
  10 | const app = admin.initializeApp({projectId:'demo-ak-producciones'},'vida87-'+process.pid);
  11 | const db=app.firestore();
  12 | db.settings({ignoreUndefinedProperties:true});
  13 | const bucket=app.storage().bucket('demo-ak-producciones.appspot.com');
  14 | test.afterAll(async()=>{await app.delete();});
  15 | 
  16 | test('reemplazar la foto 1 PNG por JPEG conserva UNA foto para ese recuadro',async({page,context},info)=>{
  17 |   test.setTimeout(90000);
  18 |   const fiesta=crearFiestaDeEstaNoche({id:'e2e_vida87_'+Date.now()+'_'+process.pid});
  19 |   fiesta.videoVida={...fiesta.videoVida,galleryEnabled:true,photoCount:2};
  20 |   const prefix='video-vida-photos/'+fiesta.id+'/';
  21 |   const ref=db.collection('fiestas').doc(fiesta.id);
  22 |   try {
  23 |     guardarFiesta(fiesta);
  24 |     await ref.set(JSON.parse(JSON.stringify(fiesta)));
  25 |     await page.goto('/evento/video-vida/'+fiesta.id,{waitUntil:'domcontentloaded'});
> 26 |     await expect(page.getByText('Tu Galería (0 de 2)',{exact:true})).toBeVisible({timeout:25000});
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
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
  37 |       await expect(page.getByText('¡Foto Subida!',{exact:true})).toBeVisible({timeout:20000});
  38 |       await expect(page.getByText('Tu Galería (1 de 2)',{exact:true})).toBeVisible();
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
```