// @ts-nocheck -- Browser upload, real SDK against demo Storage, only owned fixtures.
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== path.join(os.tmpdir(),'ak-codex88')
  || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9195') throw new Error('Solo TEMP/emulador');
const app = admin.initializeApp({projectId:'demo-ak-producciones'},'vida87-'+process.pid);
const db=app.firestore();
db.settings({ignoreUndefinedProperties:true});
const bucket=app.storage().bucket('demo-ak-producciones.appspot.com');
test.afterAll(async()=>{await app.delete();});

test('reemplazar la foto 1 PNG por JPEG conserva UNA foto para ese recuadro',async({page,context},info)=>{
  test.setTimeout(180000);
  const fiesta=crearFiestaDeEstaNoche({id:'e2e_vida87_'+Date.now()+'_'+process.pid});
  fiesta.videoVida={...fiesta.videoVida,galleryEnabled:true,photoCount:2};
  const prefix='video-vida-photos/'+fiesta.id+'/';
  const ref=db.collection('fiestas').doc(fiesta.id);
  try {
    guardarFiesta(fiesta);
    await ref.set(JSON.parse(JSON.stringify(fiesta)));
    await page.goto('/video-vida/'+fiesta.id,{waitUntil:'domcontentloaded'});
    await expect(page.getByText('Tu Galería (0 de 2)',{exact:true})).toBeVisible({timeout:25000});
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    const buffers={};
    for(const [mime,extension,color] of [['image/png','png','#346ab5'],['image/jpeg','jpg','#dfbc21']]) {
      const encoded=await page.evaluate(({mime,color})=>{
        const c=document.createElement('canvas'); c.width=100; c.height=100;
        const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,100,100);
        return c.toDataURL(mime).split(',')[1];
      },{mime,color});
      const buffer=Buffer.from(encoded,'base64');buffers[extension]=buffer;
      await page.locator('#upload-1').setInputFiles({name:'foto-sonda87.'+extension,mimeType:mime,buffer});
      await expect(page.getByText('¡Foto Subida!',{exact:true})).toBeVisible({timeout:60000});
      await expect(page.getByText('Tu Galería (1 de 2)',{exact:true})).toBeVisible();
      const stored=bucket.file(prefix+'01.'+extension);
      await expect.poll(async()=>(await stored.exists())[0],{timeout:15000}).toBe(true);
      expect((await stored.download())[0]).toEqual(buffer);
      expect((await stored.getMetadata())[0].contentType).toBe(mime);
      // Wait for each toast to retire, so a stale success cannot satisfy next upload.
      await expect(page.getByText('¡Foto Subida!',{exact:true})).toBeHidden({timeout:15000});
    }
    const [files]=await bucket.getFiles({prefix});
    const names=files.map(f=>f.name);
    await info.attach('fotos-real-storage.json',{body:JSON.stringify({names,slot:1,expected:1},null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath('reemplazo-foto-1.png')});
    expect(names.filter(n=>/\/01\./.test(n)),'un recuadro reemplazado no debe entregar dos fotos').toHaveLength(1);
  } finally {
    const [files]=await bucket.getFiles({prefix});
    await Promise.all(files.map(f=>f.delete()));
    await ref.delete();borrarFiesta(fiesta.id);
  }
});

test('deshabilitar la carga impide subir desde una pantalla que quedo abierta',async({page,context},info)=>{
  test.setTimeout(180000);
  const fiesta=crearFiestaDeEstaNoche({id:'e2e_vida87_revocada_'+Date.now()+'_'+process.pid});
  fiesta.videoVida={...fiesta.videoVida,galleryEnabled:true,photoCount:2};
  const prefix='video-vida-photos/'+fiesta.id+'/';
  const ref=db.collection('fiestas').doc(fiesta.id);
  try {
    guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
    await page.goto('/video-vida/'+fiesta.id,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#upload-1')).toBeAttached({timeout:60000});
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    fiesta.videoVida.galleryEnabled=false;
    guardarFiesta(fiesta);await ref.update({'videoVida.galleryEnabled':false});
    expect((await ref.get()).data().videoVida.galleryEnabled).toBe(false);
    const png=await page.evaluate(()=>{
      const c=document.createElement('canvas');c.width=80;c.height=80;
      c.getContext('2d').fillRect(0,0,80,80);return c.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#upload-1').setInputFiles({name:'revocada.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    // Observe actual write OR visible rejection, not the lifetime of the Next response stream.
    await expect.poll(async()=>{
      const [files]=await bucket.getFiles({prefix});
      return files.length>0 || await page.getByText('Error al subir',{exact:true}).isVisible();
    },{timeout:20000}).toBe(true);
    const [files]=await bucket.getFiles({prefix});
    await info.attach('carga-desactivada-storage.json',{body:JSON.stringify({galleryEnabled:false,files:files.map(f=>f.name)},null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath('carga-desactivada.png')});
    expect(files,'carga deshabilitada no debe aceptar una foto desde pantalla vieja').toHaveLength(0);
  } finally {
    const [files]=await bucket.getFiles({prefix});await Promise.all(files.map(f=>f.delete()));
    await ref.delete();borrarFiesta(fiesta.id);
  }
});
