# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 92-entrada-pendientes.spec.ts >> QR reentrada con lector real y pagina abierta
- Location: tests\e2e\92-entrada-pendientes.spec.ts:10:48

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/ACCESO PERMITIDO/)
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for getByText(/ACCESO PERMITIDO/)

```

```yaml
- img
- text: Control de Acceso Fiesta de esta noche
- img "Info icon"
- text: "NotFoundException: No MultiFormat Readers were able to detect the code."
- button "Choose Another - credenci....rada.png"
- text: Or drop an image to scan Scan using camera directly
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | // @ts-nocheck -- Credencial real en navegador, revocacion solo fixture demo.
  2  | import os from 'node:os';import path from 'node:path';import admin from 'firebase-admin';
  3  | import {test,expect} from '@playwright/test';
  4  | import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
  5  | import {enchufarCamaraFalsa} from './helpers/camara-falsa';
  6  | if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  7  |   ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88'))throw new Error('Solo TEMP demo');
  8  | const app=admin.initializeApp({projectId:'demo-ak-producciones'},'entrada92-'+process.pid),db=app.firestore();
  9  | db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
  10 | for(const modo of ['reentrada','revocada'])test('QR '+modo+' con lector real y pagina abierta',async({page,context,browser,baseURL},info)=>{
  11 |   test.setTimeout(180000);const id='e2e_entrada92_'+modo+'_'+process.pid+'_'+Date.now(),gid='guest_'+id,token='tok_'+id;
  12 |   const fiesta=crearFiestaDeEstaNoche({id});fiesta.invitados=[{id:gid,nombre:'Invitado ficticio A92',rsvp:'Confirmado',categoria:'Adulto',partySize:2,guestAccessToken:token,checkedIn:false}];
  13 |   const ref=db.collection('fiestas').doc(id);let cx;
  14 |   try{
  15 |     guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
  16 |     await page.goto('/invitacion/'+id+'/invitado/'+gid+'?token='+token,{waitUntil:'domcontentloaded'});
  17 |     await expect(page.getByTestId('guest-portal-qr')).toBeVisible({timeout:60000});
  18 |     expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
  19 |     const descargaP=page.waitForEvent('download');await page.getByRole('button',{name:'Guardar QR',exact:true}).click();
  20 |     const descarga=await descargaP;const png=info.outputPath('credencial-'+modo+'.png');await descarga.saveAs(png);
  21 |     cx=await browser.newContext({baseURL});await ponerSesionDelEquipo(cx,baseURL);const op=await cx.newPage();
  22 |     await enchufarCamaraFalsa(op);await op.goto('/evento/accesos/'+id,{waitUntil:'domcontentloaded'});
  23 |     const cambiar=op.locator('#html5-qrcode-anchor-scan-type-change');await expect(cambiar).toBeVisible({timeout:60000});await cambiar.click();
  24 |     const input=op.locator('#qr-acceso-reader input[type=file]');await expect(input).toBeAttached();
  25 |     if(modo==='revocada'){
  26 |       // Revocar DESPUES de cargar tanto invitado como operador; no recargarlos.
  27 |       fiesta.invitados[0].guestAccessToken='nuevo_'+token;guardarFiesta(fiesta);await ref.update({invitados:fiesta.invitados});
  28 |       const antes=(await ref.get()).data();await input.setInputFiles(png);
  29 |       await expect.poll(async()=>await op.getByText(/ACCESO PERMITIDO|ACCESO DENEGADO|QR INV/).count()).toBeGreaterThan(0);
  30 |       const despues=(await ref.get()).data();
  31 |       await info.attach('qr-revocado.json',{body:JSON.stringify({antes,despues,lector:await op.locator('body').innerText()},null,2),contentType:'application/json'});
  32 |       await op.screenshot({path:info.outputPath('qr-revocado-lector.png')});
  33 |       expect(despues.invitados[0].checkedIn).toBe(false);expect(despues.invitados[0].checkInTimestamp).toBeUndefined();
  34 |       await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByTestId('guest-portal-qr')).toHaveCount(0);
  35 |     }else{
> 36 |       await input.setInputFiles(png);await expect(op.getByText(/ACCESO PERMITIDO/)).toBeVisible({timeout:30000});
     |                                                                                     ^ Error: expect(locator).toBeVisible() failed
  37 |       const first=(await ref.get()).data();expect(first.invitados[0].checkedIn).toBe(true);expect(first.invitados[0].checkInTimestamp).toBeTruthy();
  38 |       await expect(op.getByText(/ACCESO PERMITIDO/)).toBeHidden({timeout:15000});
  39 |       await input.setInputFiles([]);await input.setInputFiles(png);
  40 |       await expect(op.getByText(/Este QR ya fue utilizado anteriormente/)).toBeVisible({timeout:30000});
  41 |       const second=(await ref.get()).data();expect(second.invitados).toHaveLength(1);expect(second.invitados[0].checkInTimestamp).toBe(first.invitados[0].checkInTimestamp);
  42 |       await info.attach('qr-reentrada.json',{body:JSON.stringify({primera:first.invitados,segunda:second.invitados},null,2),contentType:'application/json'});
  43 |       await op.screenshot({path:info.outputPath('qr-reentrada-lector.png')});
  44 |     }
  45 |   }finally{await cx?.close();await ref.delete();borrarFiesta(id);}
  46 | });
  47 | 
```