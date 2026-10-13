// @ts-nocheck -- actual portal/SDK chain with a controlled provider boundary failure.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, borrarFiesta } from './helpers/fiesta-de-prueba';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.basename(process.cwd()) !== 'ak-entorno-aislado-102' ||
    path.dirname(process.cwd()) !== path.join(os.tmpdir(),'ak-codex88') || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Demo102 only');
const app = admin.initializeApp({projectId:'demo-ak-producciones'},'portal102-'+process.pid), db = app.firestore();
db.settings({ignoreUndefinedProperties:true}); test.afterAll(async()=>app.delete());
const flag = path.join(process.cwd(),'.qa102-fail-fiesta-reads'), log = path.join(process.cwd(),'qa102-read-faults.jsonl');
const removeFlag = () => { if(fs.existsSync(flag)) fs.unlinkSync(flag); };
test('A genuinely missing portal still says not found',async({page,context},info)=>{
  test.setTimeout(120000); removeFlag();
  const key = 'e2e_102_missing_'+process.pid+'_'+Date.now();
  await page.goto('/portal/c/'+key,{waitUntil:'domcontentloaded'});
  await expect(page.getByText('Portal no encontrado',{exact:true})).toBeVisible({timeout:60000});
  await expect(page.getByText('No pudimos cargar tu portal',{exact:true})).toHaveCount(0);
  expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
  await info.attach('missing-portal.png',{body:await page.screenshot(),contentType:'image/png'});
});
test('Existing client portal distinguishes a read outage and recovers without losing data',async({page,context},info)=>{
  test.setTimeout(180000); removeFlag();
  const id = 'e2e_102_portal_'+process.pid+'_'+Date.now(), key = id+'_key';
  const fiesta = crearFiestaDeEstaNoche({id}); borrarFiesta(id); fiesta.presupuestoId = undefined;
  fiesta.clientPortalSettings = {...fiesta.clientPortalSettings,enabled:true,accessKey:key};
  const ref = db.collection('fiestas').doc(id);
  expect((await ref.get()).exists).toBe(false); await ref.set(JSON.parse(JSON.stringify(fiesta)));
  // Deliberately no local JSON copy: production data is not an optional dev fallback.
  const localFiles = ['data/fiestas','src/data/fiestas'].map(dir=>path.join(process.cwd(),dir,id+'.json'));
  expect(localFiles.some(f=>fs.existsSync(f))).toBe(false);
  const route = '/portal/c/'+key;
  try {
    await page.goto(route,{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('button',{name:'Personalizar portada',exact:true})).toBeVisible({timeout:60000});
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    const before = (await ref.get()).data(), logOffset = fs.existsSync(log)?fs.readFileSync(log,'utf8').length:0;
    fs.writeFileSync(flag,'isolated transient read outage');
    await page.reload({waitUntil:'domcontentloaded'});
    await expect.poll(async()=>/Portal no encontrado|No pudimos cargar tu portal/.test(await page.locator('body').innerText()),{timeout:60000}).toBe(true);
    const outage = {body:await page.locator('body').innerText(),url:page.url(),retry:await page.getByRole('button',{name:'Reintentar',exact:true}).count(),faults:fs.existsSync(log)?fs.readFileSync(log,'utf8').slice(logOffset):'',dataExists:(await ref.get()).exists};
    await info.attach('actual-read-outage.json',{body:JSON.stringify(outage,null,2),contentType:'application/json'});
    await info.attach('actual-read-outage.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(outage.faults).toContain('"filters":2');
    expect(outage.faults).toContain('"filters":0');
    expect(outage.dataExists).toBe(true);
    removeFlag();
    // Recovery control does not turn the preceding outage state into a pass.
    if(outage.retry) await page.getByRole('button',{name:'Reintentar',exact:true}).click();
    else await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.getByRole('button',{name:'Personalizar portada',exact:true})).toBeVisible({timeout:60000});
    const after = (await ref.get()).data(); expect(after).toEqual(before);
    await info.attach('after-recovery.json',{body:JSON.stringify({id,key,before,after,recoveryUsed:outage.retry?'visible Retry':'manual reload because Retry absent'},null,2),contentType:'application/json'});
    await info.attach('after-recovery.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(outage.body,'existing portal must not be called invalid or expired').toContain('No pudimos cargar tu portal');
    expect(outage.body).not.toContain('Portal no encontrado'); expect(outage.retry).toBe(1);
  } finally { removeFlag(); await ref.delete(); }
});
