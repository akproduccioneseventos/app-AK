// @ts-nocheck -- diagnostics on preserved downloads, not product acceptance.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import * as zxing from 'html5-qrcode/third_party/zxing-js.umd';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.basename(process.cwd()) !== 'ak-entorno-aislado-99' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Demo99 only');
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'qr99-fixed-' + process.pid), db = app.firestore();
db.settings({ ignoreUndefinedProperties: true }); test.afterAll(async () => app.delete());
for (const n of [3, 4]) test('Same downloaded file mobile failure and width control: ' + n, async ({ page, context, browser, baseURL }, info) => {
  test.setTimeout(150000);
  const bytes = fs.readFileSync(path.join(process.cwd(), 'qa99-file-' + n + '.png'));
  const pixels = await page.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); const d = ctx.getImageData(0,0,c.width,c.height).data;
    const gray = []; for(let i=0;i<d.length;i+=4) gray.push(Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]));
    return { width:c.width,height:c.height,gray };
  }, bytes.toString('base64'));
  let decoded = null, decoderError = null;
  try { decoded = new zxing.QRCodeReader().decode(new zxing.BinaryBitmap(new zxing.HybridBinarizer(new zxing.RGBLuminanceSource(Uint8ClampedArray.from(pixels.gray),pixels.width,pixels.height)))).getText(); }
  catch(e) { decoderError = String(e); }
  // Provenance is the original runtime GET, not an invented QR payload.
  const source = n === 3 ? '/invitacion/e2e_99_qr_corto_1791695521018/invitado/g99?token=qa99corto' : '/invitacion/e2e_99_qr_uuid_1791695586308/invitado/g99uuid?token=11111111-2222-4333-8444-555555555555';
  const url = new URL(source,baseURL), parts = url.pathname.split('/'), id = parts[2], gid = parts[4], token = url.searchParams.get('token');
  expect(id.startsWith('e2e_99_')).toBe(true); expect(gid).toBeTruthy(); expect(token).toBeTruthy();
  const fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.invitados = [{ id:gid,nombre:'Invitado ficticio archivo preservado99',rsvp:'Confirmado',categoria:'Adulto',partySize:2,guestAccessToken:token,checkedIn:false }];
  const ref = db.collection('fiestas').doc(id); expect((await ref.get()).exists).toBe(false);
  guardarFiesta(fiesta); await ref.set(JSON.parse(JSON.stringify(fiesta)));
  const results = [], payload = { name:'unchanged-download.png',mimeType:'image/png',buffer:bytes };
  try {
    await ponerSesionDelEquipo(context,baseURL); await enchufarCamaraFalsa(page);
    await page.setViewportSize({ width:412,height:839 });
    await page.goto('/evento/accesos/' + id,{waitUntil:'domcontentloaded'});
    const change = page.locator('#html5-qrcode-anchor-scan-type-change');
    await expect(change).toBeVisible({timeout:60000}); await change.click();
    const input = page.locator('#qr-acceso-reader input[type=file]');
    for (const width of [412,1280]) {
      await page.setViewportSize({width,height:839}); await input.setInputFiles([]); await input.setInputFiles(payload);
      await expect.poll(async () => (await page.locator('body').innerText()).includes('NotFoundException') || (await ref.get()).data().invitados[0].checkedIn,{timeout:30000}).toBe(true);
      const state = (await ref.get()).data().invitados[0];
      const geometry = await page.locator('#qr-acceso-reader').evaluate(e => ({width:e.getBoundingClientRect().width,canvas:[...e.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,cssWidth:c.getBoundingClientRect().width}))}));
      results.push({width,geometry,state,text:await page.locator('body').innerText()});
      await info.attach('reader-width-'+width+'.png',{body:await page.screenshot(),contentType:'image/png'});
    }
    await info.attach('unchanged-file-controls.json',{body:JSON.stringify({source,decoded,decoderError,dimensions:{width:pixels.width,height:pixels.height},results},null,2),contentType:'application/json'});
    expect(results[0].state.checkedIn,'same PNG really fails on narrow reader').toBe(false);
    expect(results[0].text).toContain('NotFoundException');
    // Wider viewport is measured without assuming it repairs this file.
    const densityControls = [];
    await page.setViewportSize({width:412,height:839});
    for (const scale of [1,2]) {
      const cx = await browser.newContext({baseURL,viewport:{width:412,height:839},deviceScaleFactor:scale,isMobile:true,hasTouch:true});
      try {
        const guest = await cx.newPage(); await guest.goto(source,{waitUntil:'domcontentloaded'});
        const button = guest.getByRole('button',{name:/Guardar QR/}); await expect(button).toBeVisible({timeout:60000});
        const [file] = await Promise.all([guest.waitForEvent('download'),button.click()]);
        const control = fs.readFileSync((await file.path())!);
        await info.attach('density-'+scale+'-download.png',{body:control,contentType:'image/png'});
        await ref.update({invitados:fiesta.invitados}); guardarFiesta(fiesta);
        await input.setInputFiles([]); await input.setInputFiles({name:'density-control.png',mimeType:'image/png',buffer:control});
        await expect.poll(async () => (await page.locator('body').innerText()).includes('NotFoundException') || (await ref.get()).data().invitados[0].checkedIn,{timeout:30000}).toBe(true);
        densityControls.push({scale,width:control.readUInt32BE(16),state:(await ref.get()).data().invitados[0],text:await page.locator('body').innerText()});
        await info.attach('density-'+scale+'-reader.png',{body:await page.screenshot(),contentType:'image/png'});
        await page.waitForTimeout(7000);
      } finally { await cx.close(); }
    }
    await info.attach('density-controls.json',{body:JSON.stringify({source,densityControls},null,2),contentType:'application/json'});
    expect(densityControls.some(c=>c.state.checkedIn),'diagnostic integer-density browser, not acceptance of original download').toBe(true);
  } finally { await ref.delete(); borrarFiesta(id); }
});
