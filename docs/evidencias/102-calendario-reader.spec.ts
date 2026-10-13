// @ts-nocheck -- real budget wizard, no budgets saved and no money moved.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.basename(process.cwd())!=='ak-entorno-aislado-102'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Demo102 only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'dates102-'+process.pid),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
const flag=path.join(process.cwd(),'.qa102-fail-fiesta-reads'),log=path.join(process.cwd(),'qa102-read-faults.jsonl');
const clear=()=>{if(fs.existsSync(flag))fs.unlinkSync(flag);};
test('Budget wizard warns instead of silently assuming no occupied dates',async({page,context,baseURL},info)=>{
  test.setTimeout(240000);clear();
  const id='e2e_102_dates_'+process.pid+'_'+Date.now(),fiesta=crearFiestaDeEstaNoche({id,fechaEvento:'2027-08-08'});borrarFiesta(id);
  const ref=db.collection('fiestas').doc(id);expect((await ref.get()).exists).toBe(false);await ref.set(JSON.parse(JSON.stringify(fiesta)));
  const responses=[];page.on('response',async r=>{if(r.request().method()==='POST'&&r.request().headers()['next-action'])responses.push({url:r.url(),status:r.status(),body:(await r.text().catch(()=>''))});});
  try{
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto('/presupuestos/nuevo/crear',{waitUntil:'domcontentloaded'});
    const wizard=page.getByTestId('presupuesto-wizard');
    await expect(wizard.locator('input').first()).toBeVisible({timeout:120000});
    await expect(wizard.getByText(/No pudimos leer las fechas ocupadas/)).toHaveCount(0);
    const offset=fs.existsSync(log)?fs.readFileSync(log,'utf8').length:0,startResponses=responses.length;
    fs.writeFileSync(flag,'isolated dates read outage');await page.reload({waitUntil:'domcontentloaded'});
    await expect(wizard.locator('input').first()).toBeVisible({timeout:120000});
    await page.waitForTimeout(2000);
    const faultText=fs.existsSync(log)?fs.readFileSync(log,'utf8').slice(offset):'';
    const warning=await wizard.getByText(/No pudimos leer las fechas ocupadas/).count();
    const before=(await ref.get()).data();
    await info.attach('dates-outage.json',{body:JSON.stringify({id,date:before.configuracion.fechaEvento,warning,body:await wizard.innerText(),faultText,responses:responses.slice(startResponses)},null,2),contentType:'application/json'});
    await info.attach('dates-outage.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(faultText).toContain('"filters":0');
    clear();await page.reload({waitUntil:'domcontentloaded'});await expect(wizard.locator('input').first()).toBeVisible({timeout:60000});
    expect((await ref.get()).data()).toEqual(before);
    await info.attach('dates-recovered.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(warning,'reader failure must reach the existing warning in the wizard').toBe(1);
  }finally{clear();await ref.delete();borrarFiesta(id);}
});
