// @ts-nocheck -- diagnostic repetition of the exact downloaded file, not product acceptance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.basename(process.cwd())!=='ak-entorno-aislado-101'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw Error('Demo101 only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qrcontrol101-'+process.pid),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
test('Diagnostic: exact UUID PNG repeats decoder failure and never checks guest in',async({page,context,baseURL},info)=>{
  test.setTimeout(120000);
  const id='e2e_99_qr_uuid_1791695586308',gid='g99uuid',token='11111111-2222-4333-8444-555555555555',fiesta=crearFiestaDeEstaNoche({id});
  fiesta.invitados=[{id:gid,nombre:'Invitado ficticio QA101',rsvp:'Confirmado',categoria:'Adulto',partySize:2,guestAccessToken:token,checkedIn:false}];
  const ref=db.collection('fiestas').doc(id);expect((await ref.get()).exists).toBe(false);
  guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
  const before=(await ref.get()).data(),bytes=fs.readFileSync('qa101-uuid.png'),hash=crypto.createHash('sha256').update(bytes).digest('hex');
  try{
    await ponerSesionDelEquipo(context,baseURL);await enchufarCamaraFalsa(page);
    await page.goto('/evento/accesos/'+id,{waitUntil:'domcontentloaded'});
    const change=page.locator('#html5-qrcode-anchor-scan-type-change');await expect(change).toBeVisible({timeout:60000});await change.click();
    const input=page.locator('#qr-acceso-reader input[type=file]');
    await input.setInputFiles({name:'exact-uuid.png',mimeType:'image/png',buffer:bytes});
    await expect(page.getByText(/NotFoundException: No MultiFormat Readers/)).toBeVisible({timeout:20000});
    const after=(await ref.get()).data();
    const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
    await info.attach('exact-uuid-failure-sdk.json',{body:JSON.stringify({id,hash,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),beforeGuest:before.invitados[0],afterGuest:after.invitados[0],beforeDocHash:digest(before),afterDocHash:digest(after),body:await page.locator('body').innerText()},null,2),contentType:'application/json'});
    await info.attach('exact-uuid-failure.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(after).toEqual(before);expect(after.invitados[0].checkedIn).toBe(false);await expect(page.getByText(/ACCESO PERMITIDO/)).toHaveCount(0);
  }finally{await ref.delete();borrarFiesta(id);}
});
