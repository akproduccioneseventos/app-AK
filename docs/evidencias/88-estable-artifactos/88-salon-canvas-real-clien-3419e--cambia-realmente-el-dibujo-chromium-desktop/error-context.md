# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 88-salon-canvas-real.spec.ts >> cliente ve canvas no vacio y girar cambia realmente el dibujo
- Location: tests\e2e\88-salon-canvas-real.spec.ts:15:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('seccion-salon-3d').locator('canvas')
Expected: visible
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 25000ms
  - waiting for getByTestId('seccion-salon-3d').locator('canvas')

```

```yaml
- banner:
  - link "Portal":
    - /url: /portal-cliente/e2e_salon88_1791636696533_9276
    - img
    - text: Portal
  - paragraph: Ambientación y Estilo
  - paragraph: Fiesta de esta noche
- main:
  - img
  - text: Propuesta de Decoración
  - heading "Así va a quedar tu fiesta" [level=1]
  - paragraph: Diseñamos la ambientación especialmente para vos, cuidando los colores, la iluminación y cada rincón del salón.
  - img
  - text: ¿Qué te parece la propuesta? Tu opinión nos ayuda a afinar los detalles de montaje antes de la fecha.
  - button "Me gusta así":
    - img
    - text: Me gusta así
  - button "Quiero cambiar algo":
    - img
    - text: Quiero cambiar algo
  - heading "Tu Salón en 3D" [level=2]:
    - img
    - text: Tu Salón en 3D
  - paragraph: Girá el salón con el dedo para recorrer la distribución de mesas, pista y sectores.
  - img "Visualización del Salón"
  - text: Vista en foto
  - heading "Paleta de Colores de tu Evento" [level=2]:
    - img
    - text: Paleta de Colores de tu Evento
  - paragraph: Principal
  - paragraph: "#dc2626"
  - paragraph: Secundario
  - paragraph: "#111827"
  - paragraph: Acento
  - paragraph: "#ffffff"
  - heading "Tablero de Inspiración" [level=2]:
    - img
    - text: Tablero de Inspiración
  - link "Ver tablero completo":
    - /url: /portal/e2e_salon88_1791636696533_9276/moodboard
  - img "Inspiración"
  - img "Inspiración"
  - heading "Tus Fotos e Ideas de Referencia (0/6)" [level=2]:
    - img
    - text: Tus Fotos e Ideas de Referencia (0/6)
  - paragraph: Subí hasta 6 fotos de referencia (lo que viste en internet, tu vestido, colores, ambientaciones que te gusten) para que el equipo de diseño las tenga en cuenta.
  - button "Subir idea":
    - img
    - text: Subir idea
  - paragraph:
    - text: Usamos tus datos sólo para contestarte y para tu evento (Ley 18.331).
    - link "Privacidad":
      - /url: /privacidad
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | // @ts-nocheck -- Se exige canvas real y pixeles; una foto de respaldo NO aprueba 3D.
  2  | import os from 'node:os';
  3  | import path from 'node:path';
  4  | import crypto from 'node:crypto';
  5  | import {test,expect} from '@playwright/test';
  6  | import admin from 'firebase-admin';
  7  | import {createPortalSession} from '../../src/lib/security/portal-session';
  8  | import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
  9  | if(process.env.AK_ENTORNO_AISLADO!=='true'||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')
  10 |   ||!path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  11 |   ||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Solo TEMP demo');
  12 | const app=admin.initializeApp({projectId:'demo-ak-producciones'},'salon88-'+process.pid);
  13 | const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
  14 | test.afterAll(async()=>{await app.delete();});
  15 | test('cliente ve canvas no vacio y girar cambia realmente el dibujo',async({page,context,baseURL},info)=>{
  16 |   test.setTimeout(180000);const id='e2e_salon88_'+Date.now()+'_'+process.pid;const clave='clave-'+id;
  17 |   const fiesta=crearFiestaDeEstaNoche({id,clavePortal:clave});
  18 |   fiesta.decoracion={...fiesta.decoracion,salonWidth:20,salonHeight:15,pixelsPerMeter:40,
  19 |     salonElements:[
  20 |       {id:'mesa88',type:'element',category:'Mesa Redonda',name:'Mesa 88',x:200,y:200,width:80,height:80,rotation:0},
  21 |       {id:'pista88',type:'area',category:'Pista de Baile',name:'Pista 88',x:400,y:300,width:150,height:150,rotation:0},
  22 |       {id:'barra88',type:'area',category:'Barra',name:'Barra 88',x:50,y:200,width:160,height:60,rotation:90}]};
  23 |   const ref=db.collection('fiestas').doc(id);
  24 |   const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  25 |   try{
  26 |     guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
  27 |     await context.addCookies([{name:'ak_portal_session',value:createPortalSession(id,clave),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
  28 |     await page.goto('/portal/'+id+'/decoracion',{waitUntil:'domcontentloaded'});
  29 |     const section=page.getByTestId('seccion-salon-3d');
  30 |     await expect(section).toBeVisible({timeout:30000});
  31 |     const webgl=await page.evaluate(()=>!!document.createElement('canvas').getContext('webgl'));
  32 |     await info.attach('capacidad-y-errores.json',{body:JSON.stringify({webgl,errors},null,2),contentType:'application/json'});
  33 |     test.skip(!webgl,'Navegador sin WebGL: no acepta ni refuta el dibujo real.');
> 34 |     const canvas=section.locator('canvas');await expect(canvas).toBeVisible({timeout:25000});
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  35 |     const box=await canvas.boundingBox();expect(box.width).toBeGreaterThan(200);expect(box.height).toBeGreaterThan(200);
  36 |     await page.waitForTimeout(1500);
  37 |     const before=await canvas.screenshot();
  38 |     const colorCount=await page.evaluate(async(encoded)=>{
  39 |       const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  40 |       const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
  41 |       const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;
  42 |       const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);
  43 |       const data=ctx.getImageData(0,0,c.width,c.height).data;const colors=new Set();
  44 |       for(let i=0;i<data.length;i+=16)colors.add(data[i]+','+data[i+1]+','+data[i+2]);
  45 |       bitmap.close();return colors.size;
  46 |     },before.toString('base64'));
  47 |     expect(colorCount,'canvas de un solo color no prueba el salon').toBeGreaterThan(30);
  48 |     await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  49 |     await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+20,{steps:12});await page.mouse.up();
  50 |     await page.waitForTimeout(1000);const after=await canvas.screenshot();
  51 |     await info.attach('salon-antes.png',{body:before,contentType:'image/png'});
  52 |     await info.attach('salon-girado.png',{body:after,contentType:'image/png'});
  53 |     expect(crypto.createHash('sha256').update(after).digest('hex')).not.toBe(crypto.createHash('sha256').update(before).digest('hex'));
  54 |     await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByTestId('seccion-salon-3d').locator('canvas')).toBeVisible({timeout:25000});
  55 |     expect((await ref.get()).data().decoracion.salonElements).toEqual(fiesta.decoracion.salonElements);
  56 |   }finally{await ref.delete();borrarFiesta(id);}
  57 | });
  58 |
```
