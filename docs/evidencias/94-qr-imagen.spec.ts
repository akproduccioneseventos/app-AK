// @ts-nocheck -- Diagnose the saved download; controls never replace acceptance.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test, expect} from '@playwright/test';
import * as zxing from 'html5-qrcode/third_party/zxing-js.umd';
import admin from 'firebase-admin';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
import {enchufarCamaraFalsa} from './helpers/camara-falsa';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085'
  || path.basename(process.cwd()) !== 'ak-entorno-aislado-94') throw new Error('Only demo94');
test('QR diagnostico del PNG descargado sin alterar el original', async ({page}, info) => {
  const png = fs.readFileSync(path.join(process.cwd(), 'qa94-qr-original.png'));
  const results = [];
  for (const [scale, border] of [[1,0],[1,32],[3,32]]) {
    const pixels = await page.evaluate(async ({base64,scale,border}) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + base64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth * scale + border * 2;
      c.height = img.naturalHeight * scale + border * 2;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(img,border,border,img.naturalWidth*scale,img.naturalHeight*scale);
      const rgba = ctx.getImageData(0,0,c.width,c.height).data; const gray = [];
      for(let i=0;i<rgba.length;i+=4) gray.push(Math.round(.299*rgba[i]+.587*rgba[i+1]+.114*rgba[i+2]));
      return {width:c.width,height:c.height,gray,png:c.toDataURL('image/png').split(',')[1]};
    }, {base64:png.toString('base64'),scale,border});
    let decoded = null, error = null;
    try { decoded = new zxing.QRCodeReader().decode(new zxing.BinaryBitmap(new zxing.HybridBinarizer(
      new zxing.RGBLuminanceSource(Uint8ClampedArray.from(pixels.gray),pixels.width,pixels.height)))).getText(); }
    catch(e) { error = String(e); }
    results.push({scale,border,width:pixels.width,height:pixels.height,decoded,error});
    await info.attach('qr-control-'+scale+'-'+border+'.png',{body:Buffer.from(pixels.png,'base64'),contentType:'image/png'});
  }
  await info.attach('diagnostico-qr.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
  expect(results.some(r=>r.decoded)).toBe(true);
});
test('QR control mismo PNG mismo lector original y margen', async ({page,context,baseURL}, info) => {
  test.setTimeout(120000);
  const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qr-control94-'+process.pid);
  const db=app.firestore(); db.settings({ignoreUndefinedProperties:true});
  const id='q92rmv2yk9b9',gid='gq92rmv2yk9b9',token='qa92tokenmv2yk9b9';
  const fiesta=crearFiestaDeEstaNoche({id});
  fiesta.invitados=[{id:gid,nombre:'Invitado ficticio A94',rsvp:'Confirmado',categoria:'Adulto',partySize:2,guestAccessToken:token,checkedIn:false}];
  const ref=db.collection('fiestas').doc(id), png=fs.readFileSync('qa94-qr-original.png');
  try {
    guardarFiesta(fiesta); await ref.set(JSON.parse(JSON.stringify(fiesta)));
    await ponerSesionDelEquipo(context,baseURL); await enchufarCamaraFalsa(page);
    await page.goto('/evento/accesos/'+id,{waitUntil:'domcontentloaded'});
    const change=page.locator('#html5-qrcode-anchor-scan-type-change'); await expect(change).toBeVisible({timeout:60000}); await change.click();
    const input=page.locator('#qr-acceso-reader input[type=file]');
    const results=[];
    for(const border of [0,32]) {
      await ref.update({invitados:fiesta.invitados}); guardarFiesta(fiesta);
      const padded=await page.evaluate(async({base64,border})=>{
        const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
        const c=document.createElement('canvas');c.width=img.naturalWidth+2*border;c.height=img.naturalHeight+2*border;
        const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,border,border);
        return c.toDataURL('image/png').split(',')[1];
      },{base64:png.toString('base64'),border});
      await input.setInputFiles([]); await input.setInputFiles({name:'control-'+border+'.png',mimeType:'image/png',buffer:border?Buffer.from(padded,'base64'):png});
      await page.waitForTimeout(8000);
      results.push({border,checkedIn:(await ref.get()).data()?.invitados?.[0]?.checkedIn,body:await page.locator('body').innerText()});
    }
    await info.attach('lector-control.json',{body:JSON.stringify(results,null,2),contentType:'application/json'});
    expect(results.some(r=>r.checkedIn)).toBe(true);
  }finally{await ref.delete();borrarFiesta(id);await app.delete();}
});
