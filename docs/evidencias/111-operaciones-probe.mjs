import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Private emulator only');
const root='http://127.0.0.1:3301',restore=fixtureGuard(),results=[];
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa111-operaciones'),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});
const before=new Map();
for(const col of await db.listCollections())for(const doc of(await col.get()).docs)before.set(doc.ref.path,doc.data());
if(before.size)throw new Error('Fresh owned emulator required');
const cache=new Map();
function fixtureModule(file){
  if(!/^src\/lib\/(fiesta-defaults|public-contact|social-wall-defaults|zona-digital-adolescentes)\.ts$/.test(file))throw new Error('Unexpected fixture dependency');
  if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require:s=>s.startsWith('@/')?fixtureModule('src/'+s.slice(2)+'.ts'):createRequire(path.resolve(file))(s),process,console});
  return module.exports;
}
const base=fixtureModule('src/lib/fiesta-defaults.ts').initialFiestaActualData;
const browser=await chromium.launch({headless:true});
const ids={create:'7f9d417334e17babfbdf1ce278fdb8c1a62a7b2759',update:'7f33f73f1dc7007b8d16e46b8b6dbede9799792f43',resolve:'7fdbc97e127bad56fa718411de8f5835fae290b8ac',apply:'70a2e0da2e5a4aa586d8012aeeeceb25c013a528c4'};
async function record(viewport,name,fn){
  const r={viewport,name};try{r.details=await fn();r.status=r.details?.acceptance?.startsWith('FAIL')?'FAIL':'PASS';}catch(error){r.status='NOT_ACCEPTED';r.error=error.message;}
  results.push(r);console.log(JSON.stringify({viewport,name,status:r.status,error:r.error}));
}
try {
  for(const viewport of ['desktop','mobile']){
    const marker='QA111_'+viewport+'_'+crypto.randomUUID(),fiestaId=marker+'_fiesta';
    await db.collection('fiestas').doc(fiestaId).set({...JSON.parse(JSON.stringify(base)),id:fiestaId,configuracion:{...base.configuracion,nombreEvento:marker,fechaEvento:new Date(Date.now()+86400000*60).toISOString()},tareas:[],documentosRequeridos:[],comprasSugeridas:[]});
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    let blocked=null;
    await context.route('**/*',async r=>{
      if(blocked&&r.request().headers()['next-action']===blocked)return r.abort('failed');
      return r.fallback();
    });
    const page=await context.newPage();page.setDefaultTimeout(18000);
    const go=url=>page.goto(root+url,{waitUntil:'networkidle',timeout:60000});
    const ownInc=async()=>(await db.collection('incidentes').get()).docs.filter(d=>d.data().fiestaId===fiestaId);
    let incidentId;
    await record(viewport,'incident-failed-create-keeps-draft-then-recovers',async()=>{
      await go('/incidentes?fiestaId='+fiestaId);await page.getByRole('button',{name:'Nueva Incidencia',exact:true}).click();
      const dialog=page.getByRole('dialog');
      await expect(dialog.getByPlaceholder('fiesta_1234...')).toHaveValue(fiestaId);
      await dialog.getByPlaceholder('T\u00edtulo del incidente').fill(marker+' Cable');
      await dialog.getByPlaceholder('Nombre del responsable').fill(marker+' Operador');
      await dialog.getByPlaceholder('Describ\u00ed el incidente...').fill(marker+' Detalle');
      blocked=ids.create;await dialog.getByRole('button',{name:'Registrar Incidente',exact:true}).click();
      await expect(page.getByText('Error al guardar',{exact:true})).toBeVisible();
      await expect(dialog.getByPlaceholder('T\u00edtulo del incidente')).toHaveValue(marker+' Cable');
      expect((await ownInc()).length).toBe(0);blocked=null;
      await dialog.getByRole('button',{name:'Registrar Incidente',exact:true}).click();
      await expect(dialog).not.toBeVisible();const docs=await ownInc();expect(docs.length).toBe(1);incidentId=docs[0].id;
      return{draftKept:true,errorVisible:true,createdAfterRetry:1,incidentId};
    });
    await record(viewport,'incident-new-dialog-after-success-is-new',async()=>{
      if(!incidentId)throw new Error('Prerequisite not accepted');
      await page.getByRole('button',{name:'Nueva Incidencia',exact:true}).click();
      const dialog=page.getByRole('dialog'),title=await dialog.getByPlaceholder('T\u00edtulo del incidente').inputValue();
      const responsible=await dialog.getByPlaceholder('Nombre del responsable').inputValue();
      const description=await dialog.getByPlaceholder('Describ\u00ed el incidente...').inputValue();
      const unchanged=title===marker+' Cable'&&description===marker+' Detalle';
      await page.screenshot({path:`docs/evidencias/111-new-incident-${viewport}.png`,fullPage:true});
      await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
      return{title,responsible,description,unchangedPreviousIncident:unchanged,acceptance:unchanged?'FAIL_PREVIOUS_RECORD_IN_NEW_DIALOG':'PASS'};
    });
    await record(viewport,'incident-failed-update-keeps-note-and-recovers',async()=>{
      if(!incidentId)throw new Error('Prerequisite not accepted');
      const card=page.locator('[class*="border-l-4"]').filter({has:page.getByText(marker+' Cable',{exact:true})});
      await card.getByRole('button',{name:'Ver Detalles',exact:true}).click();
      await card.getByRole('button',{name:'A\u00f1adir Actualizaci\u00f3n',exact:true}).click();
      const dialog=page.getByRole('dialog'),note=marker+' Repuesto listo';
      await dialog.getByPlaceholder('Texto de la actualizaci\u00f3n...').fill(note);
      blocked=ids.update;await dialog.getByRole('button',{name:'Guardar',exact:true}).click();
      await expect(page.getByText('Error al guardar',{exact:true})).toBeVisible();
      await expect(dialog.getByPlaceholder('Texto de la actualizaci\u00f3n...')).toHaveValue(note);
      expect((await db.collection('incidentes').doc(incidentId).get()).data().actualizaciones.length).toBe(0);blocked=null;
      await dialog.getByRole('button',{name:'Guardar',exact:true}).click();await expect(dialog).not.toBeVisible();
      const state=(await db.collection('incidentes').doc(incidentId).get()).data();expect(state.actualizaciones.length).toBe(1);expect(state.actualizaciones[0].texto).toBe(note);
      return{noteKeptOnFailure:true,storedExactlyOnce:true};
    });
    await record(viewport,'playbook-dialog-context-cancel-and-missing-event',async()=>{
      await go('/playbooks?fiestaId='+fiestaId);await page.getByRole('button',{name:'Aplicar',exact:true}).first().click();
      const dialog=page.getByRole('dialog'),input=dialog.getByPlaceholder('ej: fiesta_1234567890');
      await expect(input).toHaveValue(fiestaId);await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
      expect((await db.collection('fiestas').doc(fiestaId).get()).data().tareas.length).toBe(0);
      await page.getByRole('button',{name:'Aplicar',exact:true}).first().click();await input.fill(marker+'_missing');
      await dialog.getByRole('button',{name:'Aplicar Playbook',exact:true}).click();
      await expect(page.getByText('Evento no encontrado.',{exact:true})).toBeVisible();await expect(dialog).toBeVisible();
      expect((await db.collection('fiestas').doc(fiestaId).get()).data().tareas.length).toBe(0);
      await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();return{queryContextKept:true,cancelDidNotWrite:true,missingEventErrorVisible:true,realEventUnchanged:true};
    });
    await record(viewport,'playbook-failed-apply-keeps-target-without-writing',async()=>{
      await page.getByRole('button',{name:'Aplicar',exact:true}).first().click();const dialog=page.getByRole('dialog');
      blocked=ids.apply;await dialog.getByRole('button',{name:'Aplicar Playbook',exact:true}).click();
      await expect(page.getByText('Ocurri\u00f3 un error inesperado.',{exact:true})).toBeVisible();
      await expect(dialog.getByPlaceholder('ej: fiesta_1234567890')).toHaveValue(fiestaId);await expect(dialog.getByRole('button',{name:'Aplicar Playbook',exact:true})).toBeEnabled();
      const state=(await db.collection('fiestas').doc(fiestaId).get()).data();expect(state.tareas.length).toBe(0);expect(state.documentosRequeridos.length).toBe(0);expect(state.comprasSugeridas.length).toBe(0);
      blocked=null;await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();return{errorVisible:true,targetKept:true,noTaskDocumentOrPurchaseCreated:true};
    });
    await context.close();
  }
}finally{
  await browser.close();const removed=[];
  for(const col of await db.listCollections())for(const doc of(await col.get()).docs){if(!before.has(doc.ref.path)){await doc.ref.delete();removed.push(doc.ref.path);}}
  for(const[p,data]of before)await db.doc(p).set(data);
  fs.writeFileSync('docs/evidencias/111-operaciones-restauracion.json',JSON.stringify({...restore(),removedEmulatorDocuments:removed,initialDocuments:before.size},null,2));
  fs.writeFileSync('docs/evidencias/111-operaciones.json',JSON.stringify(results,null,2));await app.delete();
}
