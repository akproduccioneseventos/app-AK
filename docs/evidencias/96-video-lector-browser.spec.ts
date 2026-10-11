// @ts-nocheck -- Actual public page and emulators, no real Google signer/clients.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.basename(process.cwd())!=='ak-entorno-aislado-96'||
  process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||process.env.FIREBASE_STORAGE_EMULATOR_HOST!=='127.0.0.1:9195')throw new Error('Only TEMP96');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'qa96-'+process.pid);
const db=app.firestore(),bucket=app.storage().bucket();db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>app.delete());
for(const stored of [false,true])test('video lector '+(stored?'no inventa cero cuando no firma':'vacio genuino se muestra como cero'),async({page,context},info)=>{
  test.setTimeout(120000);const id='e2e_96_video_'+process.pid+'_'+Date.now(),fiesta=crearFiestaDeEstaNoche({id});
  fiesta.videoVida={...fiesta.videoVida,galleryEnabled:true,photoCount:2,photosUploaded:stored};
  const ref=db.collection('fiestas').doc(id),name='video-vida-photos/'+id+'/01.png',file=bucket.file(name);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV2kAAAAASUVORK5CYII=','base64');
  try {
    guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
    if(stored){await file.save(png,{resumable:false,metadata:{contentType:'image/png'}});
      const r=await page.request.get('http://127.0.0.1:9195/v0/b/demo-ak-producciones.appspot.com/o/'+encodeURIComponent(name)+'?alt=media');
      expect(r.status()).toBe(200);expect(await r.body()).toEqual(png);}
    await page.goto('/video-vida/'+id,{waitUntil:'domcontentloaded'});
    await expect(page.getByText('Tu Galer\u00eda (0 de 2)',{exact:true})).toBeVisible({timeout:60000});
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    const objects=(await bucket.getFiles({prefix:'video-vida-photos/'+id+'/'}))[0].map(f=>f.name);
    const evidence={stored,objects,body:await page.locator('body').innerText(),inputs:await page.locator('input[type=file]').count(),
      images:await page.locator('img[alt="Foto 1"]').count(),environment:'Native browser/emulators; no Google signer credentials'};
    await info.attach('lector-final.json',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
    await info.attach('lector-final.png',{body:await page.screenshot(),contentType:'image/png'});
    if(stored){expect(objects).toEqual([name]);expect(evidence.body).toMatch(/no pudimos|no se pudo|error al cargar/i);}
    else expect(objects).toEqual([]);
  }finally{if((await file.exists())[0])await file.delete();await ref.delete();borrarFiesta(id);}
});
