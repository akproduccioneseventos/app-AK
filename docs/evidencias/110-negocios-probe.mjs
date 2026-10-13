import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import vm from 'node:vm';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||process.env.AK_ENTORNO_AISLADO!=='true') throw new Error('Private emulator only');
const restore=fixtureGuard(),root='http://127.0.0.1:3301',results=[],fixtures=[];
const flag='docs/evidencias/.110-fail-fiesta-reads';
if(fs.existsSync(flag)) throw new Error('Unexpected existing fault flag');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa110-business'),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});
const memoryRef=db.collection('multiagent').doc('memory'),memoryBefore=await memoryRef.get();
const browser=await chromium.launch({headless:true});
// Load the existing defaults only for fixture generation; do not compile or alter the app.
const fixtureCache=new Map();
function loadFixtureModule(file) {
  if(!/^src\/lib\/(fiesta-defaults|public-contact|social-wall-defaults|zona-digital-adolescentes)\.ts$/.test(file)) throw new Error('Unexpected fixture dependency: '+file);
  if(fixtureCache.has(file)) return fixtureCache.get(file).exports;
  const module={exports:{}};fixtureCache.set(file,module);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require:specifier=>specifier.startsWith('@/')?loadFixtureModule('src/'+specifier.slice(2)+'.ts'):createRequire(path.resolve(file))(specifier),process,console});
  return module.exports;
}
const fixtureBase=loadFixtureModule('src/lib/fiesta-defaults.ts').initialFiestaActualData;
function day(offset) {const d=new Date();d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)+'T18:00:00.000Z';}
async function record(viewport,name,fn) {
  if(process.argv.includes('--counts') && !name.startsWith('automations-')) return;
  const r={viewport,name};
  console.log(JSON.stringify({step:'start',viewport,name}));
  try {r.details=await fn();r.status=r.details?.acceptance?.startsWith('FAIL')?'FAIL':'PASS';}
  catch(error) {r.status='NOT_ACCEPTED';r.error=error.message;}
  results.push(r);console.log(JSON.stringify(r));
}
try {
  for(const viewport of ['desktop','mobile']) {
    const marker='QA110_'+viewport+'_'+crypto.randomUUID();
    const future={...JSON.parse(JSON.stringify(fixtureBase)),id:marker+'_future',estado:'En Planificaci\u00f3n',configuracion:{...fixtureBase.configuracion,nombreEvento:marker+' Proxima',clienteNombre:'QA110',fechaEvento:day(4),invitadosEstimados:100},reuniones:[],tareas:[{id:marker+'_task',texto:marker+' Tarea',completada:false,fechaLimite:day(0)}],invitados:[],serviciosContratados:[]};
    const past={...future,id:marker+'_past',configuracion:{...future.configuracion,nombreEvento:marker+' Pasada',fechaEvento:day(-2)},tareas:[]};
    for(const fiesta of [future,past]) {const ref=db.collection('fiestas').doc(fiesta.id);if((await ref.get()).exists) throw new Error('Fixture collision');await ref.set(fiesta);fixtures.push(ref);}
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,route=>route.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();page.setDefaultTimeout(18000);
    const go=url=>page.goto(root+url,{waitUntil:'networkidle',timeout:60000});
    await record(viewport,'tower-real-fiesta-and-task-links',async()=>{
      await go('/control-tower');
      await expect(page.getByText(future.configuracion.nombreEvento+' se acerca',{exact:true})).toBeVisible();
      const related=await page.locator('a').evaluateAll(nodes=>nodes.filter(a=>a.getAttribute('href')?.includes('QA110_')).map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})));
      expect(related.some(a=>a.href==='/fiestas/nueva?fiestaId='+future.id)).toBe(true);
      expect(related.some(a=>a.href==='/fiestas/nueva/tareas?fiestaId='+future.id)).toBe(true);
      return {fiestaId:future.id,related};
    });
    await record(viewport,'preparation-open-correct-fiesta',async()=>{
      await go('/control-tower/preparacion');
      const link=page.locator(`a[href="/fiestas/nueva?fiestaId=${future.id}"]`);
      await expect(link).toBeVisible();await link.click();
      await expect(page).toHaveURL(root+'/fiestas/nueva?fiestaId='+future.id);
      await expect(page.getByRole('heading',{name:future.configuracion.nombreEvento,exact:true})).toBeVisible();
      return {opened:future.id,url:page.url(),body:await page.locator('body').innerText()};
    });
    await record(viewport,'postevent-close-memory-persisted',async()=>{
      await go('/control-tower/post-fiesta');
      const card=page.locator('[class*="rounded-3xl"]').filter({has:page.getByText(past.configuracion.nombreEvento,{exact:true})}).last();
      await card.getByPlaceholder('Notas internas: qu\u00e9 sali\u00f3 bien, qu\u00e9 mejorar, detalles para recordar...').fill(marker+' Aprendizaje');
      await card.getByRole('button',{name:'Guardar cierre',exact:true}).click();
      await expect(page.getByText(`Paquete post-fiesta guardado para ${past.configuracion.nombreEvento}.`,{exact:true})).toBeVisible();
      const state=(await memoryRef.get()).data();
      const profiles=state.profiles.filter(p=>p.learnings.some(l=>l.title.includes(past.configuracion.nombreEvento)));
      expect(profiles.length).toBe(3);
      expect(profiles.map(p=>p.agentType).sort()).toEqual(['fiesta','fiestas_general','marketing'].sort());
      await page.reload({waitUntil:'networkidle'});
      const persisted=(await memoryRef.get()).data().profiles.filter(p=>p.learnings.some(l=>l.title.includes(past.configuracion.nombreEvento)));
      expect(persisted.length).toBe(3);
      return {fiestaId:past.id,memoryProfiles:profiles.map(p=>({id:p.id,agentType:p.agentType})),persistedAfterReload:true};
    });
    await record(viewport,'automations-repeat-without-notification-duplicates',async()=>{
      await go('/control-tower/automatizaciones');
      console.log(JSON.stringify({step:'automation-open',viewport}));
      const button=page.getByRole('button',{name:'Ejecutar revisi\u00f3n inteligente',exact:true});
      await button.click();await expect(page.getByText(/Revisi\u00f3n completa\. Avisos creados:/)).toBeVisible();
      console.log(JSON.stringify({step:'first-run-finished',viewport}));
      const first=(await db.collection('notificaciones').get()).docs.map(d=>d.data()).filter(n=>n.entidadRelacionadaId?.includes(future.id));
      const beforeAll=(await db.collection('notificaciones').get()).size;
      expect(first.length).toBeGreaterThan(0);
      const response=page.waitForResponse(r=>r.request().headers()['next-action']==='00559a3646f2fca0c77707a728f7f06b58701ac9e1');
      await button.click();
      await response;
      await expect(button).toBeEnabled({timeout:30000});
      const second=(await db.collection('notificaciones').get()).docs.map(d=>d.data()).filter(n=>n.entidadRelacionadaId?.includes(future.id));
      const afterAll=(await db.collection('notificaciones').get()).size;
      const status=await page.locator('body').innerText();
      const advertised=Number(status.match(/Avisos creados: (\d+)/)?.[1]);
      const delta=afterAll-beforeAll;
      return {fixtureFiestaId:future.id,first:first.length,second:second.length,beforeAll,afterAll,actualNew:delta,advertised,status,noDuplicates:second.length===first.length,
        acceptance:advertised!==delta?'FAIL_FALSE_CREATED_COUNT':second.length===first.length?'PASS':'FAIL_DUPLICATED_NOTIFICATIONS'};
    });
    for(const route of ['/control-tower','/control-tower/preparacion']) await record(viewport,'provider-read-failure-'+route.slice(1).replaceAll('/','-'),async()=>{
      fs.writeFileSync(flag,'QA110 controlled failure',{flag:'wx'});
      try {
        const before=fs.existsSync('docs/evidencias/110-provider-faults.jsonl')?fs.readFileSync('docs/evidencias/110-provider-faults.jsonl','utf8').trim().split('\n').length:0;
        await go(route);
        const body=await page.locator('body').innerText();
        const after=fs.readFileSync('docs/evidencias/110-provider-faults.jsonl','utf8').trim().split('\n').length;
        expect(after).toBeGreaterThan(before);
        const visibleFailure=/No se pudo|No pudimos|no pueden|Error|Reintentar|lectura fall/i.test(body);
        const fixturePresent=body.includes(future.configuracion.nombreEvento);
        await page.screenshot({path:`docs/evidencias/110-read-${route.slice(1).replaceAll('/','-')}-${viewport}.png`,fullPage:true});
        return {route,faults:after-before,visibleFailure,fixturePresent,body,acceptance:visibleFailure?'PASS':'FAIL_READ_ERROR_HIDDEN'};
      } finally {fs.unlinkSync(flag);}
    });
    await context.close();
  }
} finally {
  if(fs.existsSync(flag)) fs.unlinkSync(flag);
  await browser.close();
  for(const ref of fixtures) await ref.delete();
  const notifications=await db.collection('notificaciones').get();let removedNotifications=0;
  for(const doc of notifications.docs) if(doc.data().entidadRelacionadaId?.includes('QA110_')) {await doc.ref.delete();removedNotifications++;}
  if(memoryBefore.exists) await memoryRef.set(memoryBefore.data());else await memoryRef.delete();
  const suffix=process.argv.includes('--counts')?'counts':'negocios';
  fs.writeFileSync(`docs/evidencias/110-${suffix}-restauracion.json`,JSON.stringify({...restore(),removedFiestas:fixtures.length,removedNotifications,memoryRestored:true},null,2));
  fs.writeFileSync(`docs/evidencias/110-${suffix}.json`,JSON.stringify(results,null,2));
  await app.delete();
}
