import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { chromium, devices, expect } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';

if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Owned demo only');
const restore = fixtureGuard(), root = 'http://127.0.0.1:3301';
const app = admin.initializeApp({projectId:'demo-ak-producciones'}, 'qa119'), db = app.firestore();
const browser = await chromium.launch({headless:true});
const results = [];
async function record(viewport,name,fn) {
  try { const details=await fn(); results.push({viewport,name,status:'PASS',details}); console.log(JSON.stringify(results.at(-1))); }
  catch(error) { results.push({viewport,name,status:'NOT_ACCEPTED',error:error.message}); console.log(JSON.stringify(results.at(-1))); throw error; }
}
try {
  for (const col of await db.listCollections()) if (!(await col.limit(1).get()).empty) throw new Error('Empty owned emulator required');
  function clearArrays(folder) {
    for (const item of fs.readdirSync(folder,{withFileTypes:true})) {
      const file = folder + '/' + item.name;
      if (item.isDirectory()) clearArrays(file);
      else if (item.name.endsWith('.json')) {
        try { if (Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')))) fs.writeFileSync(file,'[]\n'); } catch {}
      }
    }
  }
  clearArrays('src/data'); clearArrays('data');
  await db.collection('servicios').doc('qa119-dj').set({id:'qa119-dj',nombre:'DJ QA119',categoria:'Discoteca',precioBase:1000,calculationMethod:'fijo',activo:true});
  for(const viewport of ['desktop','mobile']) {
  clearArrays('src/data'); clearArrays('data');
  const context = await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
  await context.route(/^https:\/\//, route=>route.abort('blockedbyclient'));
  await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  const payload = `v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
  await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage(); page.setDefaultTimeout(20000);
  let loseAck = false, failBefore=false, saveRequests = 0;
  await context.route('**/*',async route=>{
    if(route.request().headers()['next-action'] && route.request().postData()?.includes('QA119 Manual')) {
      saveRequests++;
      if(failBefore) { failBefore=false; return route.abort('failed'); }
      if(loseAck) { loseAck=false; const response=await route.fetch(); await response.body(); return route.abort('failed'); }
    }
    return route.fallback();
  });
  async function prepare(name,{reload=false}={}) {
  if(reload) await page.reload({waitUntil:'networkidle',timeout:90000});
  else await page.goto(root+'/presupuestos/nuevo/crear',{waitUntil:'networkidle',timeout:90000});
  await page.locator('#clienteNombre').fill(name);
  await page.locator('#clienteContacto').fill('099000119');
  await page.getByTestId('btn-siguiente-paso').click();
  if(!(await page.getByText('DJ QA119',{exact:true}).count())) {
  await page.getByRole('button',{name:'A\u00f1adir desde Cat\u00e1logo',exact:true}).click();
  await page.getByPlaceholder('Buscar servicios...').fill('QA119');
  await page.locator('#modal-serv-qa119-dj').click();
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  }
  await page.getByTestId('btn-siguiente-paso').click();
  }
  async function destination(name) {
  await expect(page).toHaveURL(/\/presupuestos\/[^/]+\/ver$/,{timeout:60000});
  const visible=page.locator('#budget-print-area-wrapper').getByText(name,{exact:true}).first();
  await expect(visible).toBeVisible({timeout:60000});
  await page.reload({waitUntil:'networkidle',timeout:90000}); await expect(visible).toBeVisible({timeout:60000});
  }
  async function budgets() { return (await db.collection('presupuestos').get()).docs.map(d=>({id:d.id,numero:d.data().numero,total:d.data().totalConDescuento,leadId:d.data().leadId})); }
  await record(viewport,'before-send-error-retry-one-manual-budget',async()=>{
  await prepare('QA119 Manual control '+viewport); failBefore=true;
  await page.getByTestId('btn-guardar-presupuesto').click();
  await expect(page.getByText('Error al Guardar',{exact:true})).toBeVisible({timeout:60000});
  expect(await budgets()).toHaveLength(0);
  await page.getByTestId('btn-guardar-presupuesto').click();
  await destination('QA119 Manual control '+viewport);
  const saved=await budgets(); expect(saved).toHaveLength(1); expect(saved[0].total).toBe(900);
  expect((await db.collection('prospectos').doc(saved[0].leadId).get()).exists).toBe(true);
  return {count:1,total:900,documentVisibleAfterReload:true};
  });
  await record(viewport,'lost-ack-reload-retry-one-manual-budget',async()=>{
  await prepare('QA119 Manual ACK '+viewport); loseAck=true;
  await page.getByTestId('btn-guardar-presupuesto').click();
  await expect(page.getByText('Error al Guardar',{exact:true})).toBeVisible({timeout:60000});
  const before=await budgets(); expect(before).toHaveLength(2);
  const leadsBefore=(await db.collection('prospectos').get()).docs.map(d=>({id:d.id,timeline:JSON.stringify(d.data().timeline||[])}));
  await page.screenshot({path:`docs/evidencias/119-manual-ack-${viewport}.png`,fullPage:false});
  await prepare('QA119 Manual ACK '+viewport,{reload:true});
  await page.getByTestId('btn-guardar-presupuesto').click();
  await destination('QA119 Manual ACK '+viewport);
  const after=await budgets(); expect(after).toEqual(before);
  const leadsAfter=(await db.collection('prospectos').get()).docs.map(d=>({id:d.id,timeline:JSON.stringify(d.data().timeline||[])}));
  expect(leadsAfter).toEqual(leadsBefore);
  return {before,after,saveRequests,reloadedBeforeRetry:true,noRepeatedCrmTimeline:true,documentVisibleAfterReload:true};
  });
  await record(viewport,'deliberate-identical-quote-remains-a-new-budget',async()=>{
  await prepare('QA119 Manual ACK '+viewport);
  await page.getByTestId('btn-guardar-presupuesto').click(); await destination('QA119 Manual ACK '+viewport);
  const saved=await budgets(); expect(saved).toHaveLength(3);
  expect(new Set(saved.map(d=>d.id)).size).toBe(3); expect(new Set(saved.map(d=>d.numero)).size).toBe(3);
  const matching=(await db.collection('presupuestos').get()).docs.filter(d=>d.data().clienteNombre==='QA119 Manual ACK '+viewport);
  expect(matching).toHaveLength(2); expect(matching.every(d=>d.data().clienteContacto==='099000119')).toBe(true);
  return {count:3,distinctNumbers:3,legitimateIdenticalQuotes:2,documentVisibleAfterReload:true};
  });
  await context.close();
  for(const col of await db.listCollections()) if(col.id!=='servicios') for(const doc of (await col.get()).docs) await doc.ref.delete();
  }
} catch(error) { results.push({name:'manual-probe',status:'NOT_ACCEPTED',error:error.message}); process.exitCode=1; }
finally {
  await browser.close();
  for(const col of await db.listCollections()) for(const doc of (await col.get()).docs) await doc.ref.delete();
  const cleanup=restore(); await app.delete();
  fs.writeFileSync('docs/evidencias/119-manual-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,results,cleanup},null,2)+'\n');
}
if(results.some(r=>r.status!=='PASS')) process.exitCode=1;
