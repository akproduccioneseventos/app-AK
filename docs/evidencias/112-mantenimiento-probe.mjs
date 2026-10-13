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
const restore=fixtureGuard(),root='http://127.0.0.1:3301',results=[];
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa112'),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});
for(const col of await db.listCollections())if(!(await col.limit(1).get()).empty)throw new Error('Empty owned emulator required');
const cache=new Map();
function fixtureModule(file){
  if(!/^src\/lib\/(fiesta-defaults|public-contact|social-wall-defaults|zona-digital-adolescentes)\.ts$/.test(file))throw new Error('Unexpected fixture dependency');
  if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require:s=>s.startsWith('@/')?fixtureModule('src/'+s.slice(2)+'.ts'):createRequire(path.resolve(file))(s),process,console});return module.exports;
}
const base=fixtureModule('src/lib/fiesta-defaults.ts').initialFiestaActualData;
const browser=await chromium.launch({headless:true});
async function record(viewport,name,fn){const r={viewport,name};try{r.details=await fn();r.status=r.details?.acceptance?.startsWith('FAIL')?'FAIL':'PASS';}catch(e){r.status='NOT_ACCEPTED';r.error=e.message;}results.push(r);console.log(JSON.stringify(r));}
try{
  for(const viewport of ['desktop','mobile']){
    const marker='QA112 '+viewport+' '+crypto.randomUUID().slice(0,8),id='qa112_'+viewport,fiestaId=id+'_fiesta';
    const today=new Date().toISOString().slice(0,10),old=new Date(Date.now()-86400000*60).toISOString().slice(0,10);
    const asset={id,nombre:marker+' Laser',tipoItem:'Activo Fijo',categoria:'Discoteca',unidad:'Unidad',cantidadDisponible:1,valorUnitarioEstimado:500,calculationMethod:'fijo',precioVenta:1,mantenimiento:{cadaDias:30,ultimoAt:old,historial:[]}};
    await db.collection('activos_fijos').doc(id).set(asset);
    await db.collection('fiestas').doc(fiestaId).set({...JSON.parse(JSON.stringify(base)),id:fiestaId,configuracion:{...base.configuracion,nombreEvento:marker,fechaEvento:new Date(Date.now()+86400000*4).toISOString()},listaDeCargaOperativa:{categorias:[{nombre:'Discoteca',items:[{id:id+'_carga',origenId:id,nombre:asset.nombre,cantidadRequerida:1,cantidadCargada:0,cargado:false,retornado:false}]}]}});
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    let blocked=false;
    await context.route('**/*',r=>blocked&&r.request().headers()['next-action']==='60d1fc7d1c0cd726b1d4f0ff53b270f6162d4d7cb0'?r.abort('failed'):r.fallback());
    const page=await context.newPage();page.setDefaultTimeout(18000);
    const go=url=>page.goto(root+url,{waitUntil:'networkidle',timeout:60000});
    const ref=db.collection('activos_fijos').doc(id),state=async()=>(await ref.get()).data();
    const ownGastos=async()=>(await db.collection('gastos_generales').get()).docs.filter(d=>d.data().notas?.includes('('+id+')'));
    const alertText=async()=>{await go('/alertas');return page.locator('body').innerText();};
    const edit=()=>go('/empresa/activos-fijos/'+id+'/editar');
    await record(viewport,'expired-assigned-equipment-has-visible-alert',async()=>{
      const text=await alertText();fs.writeFileSync(`docs/evidencias/112-alert-before-${viewport}.txt`,text);
      await page.screenshot({path:`docs/evidencias/112-alert-before-${viewport}.png`,fullPage:true});
      expect(text).toMatch(/mantenimiento vencido/i);expect(text).toContain(marker);
      return{equipment:asset.nombre,party:fiestaId,date:new Date(Date.now()+86400000*4).toISOString(),visible:true};
    });
    await record(viewport,'cancel-maintenance-does-not-write',async()=>{
      await edit();await page.getByRole('button',{name:'Anotar un mantenimiento',exact:true}).click();
      const d=page.getByRole('dialog');await d.locator('#maint-nota').fill(marker+' Cancelado');await d.locator('#maint-costo').fill('99');
      await d.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(d).not.toBeVisible();
      expect((await state()).mantenimiento.historial.length).toBe(0);expect((await ownGastos()).length).toBe(0);return{noHistory:true,noExpense:true};
    });
    await record(viewport,'connection-failure-keeps-draft-and-does-not-write',async()=>{
      await page.getByRole('button',{name:'Anotar un mantenimiento',exact:true}).click();const d=page.getByRole('dialog');
      await d.locator('#maint-fecha').fill(today);await d.locator('#maint-nota').fill(marker+' Lampara');await d.locator('#maint-costo').fill('123.45');
      blocked=true;await d.getByRole('button',{name:'Anotar mantenimiento',exact:true}).click();
      await expect(page.getByText('Error al registrar mantenimiento',{exact:true})).toBeVisible();
      await expect(d.locator('#maint-nota')).toHaveValue(marker+' Lampara');await expect(d.locator('#maint-costo')).toHaveValue('123.45');
      expect((await state()).mantenimiento.historial.length).toBe(0);expect((await ownGastos()).length).toBe(0);blocked=false;return{draftKept:true,noExpense:true,noHistory:true};
    });
    await record(viewport,'retry-saves-one-maintenance-and-one-exact-expense',async()=>{
      blocked=false;const d=page.getByRole('dialog');await d.getByRole('button',{name:'Anotar mantenimiento',exact:true}).click();await expect(d).not.toBeVisible();
      await expect(page.getByText('Mantenimiento registrado',{exact:true})).toBeVisible();
      const a=await state(),g=await ownGastos();expect(a.mantenimiento.historial.length).toBe(1);expect(a.mantenimiento.ultimoAt).toBe(today);expect(g.length).toBe(1);
      expect(g[0].data().monto).toBe(123.45);expect(g[0].data().categoria).toBe('Reparaciones y Mantenimiento');expect(a.mantenimiento.historial[0].gastoPendiente).toBe(false);
      return{history:a.mantenimiento.historial,expense:{id:g[0].id,...g[0].data()}};
    });
    await record(viewport,'history-and-expense-are-visible-after-reload',async()=>{
      await edit();await expect(page.getByText(marker+' Lampara',{exact:true})).toBeVisible();await expect(page.locator('#item-mantenimiento-ultimo')).toHaveValue(today);
      await page.screenshot({path:`docs/evidencias/112-history-${viewport}.png`,fullPage:true});
      await go('/empresa/contabilidad/gastos');const text=await page.locator('body').innerText();fs.writeFileSync(`docs/evidencias/112-expenses-${viewport}.txt`,text);
      expect(text).toContain('Mantenimiento: '+asset.nombre);expect(text).toContain('123');await page.screenshot({path:`docs/evidencias/112-expenses-${viewport}.png`,fullPage:true});
      return{historyReloaded:true,accountingExpenseVisible:true};
    });
    await record(viewport,'current-maintenance-removes-only-its-preventive-alert',async()=>{
      const text=await alertText();fs.writeFileSync(`docs/evidencias/112-alert-after-${viewport}.txt`,text);expect(text).not.toMatch(/mantenimiento vencido/i);
      expect((await state()).mantenimiento.historial.length).toBe(1);expect((await ownGastos()).length).toBe(1);return{expiredEquipmentAlertGone:true,historyPreserved:true,expenseCount:1};
    });
    await record(viewport,'existing-pending-expense-retry-clears-flag',async()=>{
      const pending={id:id+'_pending',fecha:today,nota:marker+' Revision pendiente',costo:45.67,gastoPendiente:true};
      const a=await state();await ref.update({'mantenimiento.historial':[pending,...a.mantenimiento.historial]});await edit();
      await expect(page.getByText('Gasto pendiente',{exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Reintentar',exact:true}).click();await expect(page.getByText('Mantenimiento registrado',{exact:true})).toBeVisible();
      const after=await state(),g=await ownGastos();expect(after.mantenimiento.historial.length).toBe(2);expect(after.mantenimiento.historial[0].gastoPendiente).toBe(false);expect(g.length).toBe(2);
      expect(g.filter(d=>d.data().monto===45.67).length).toBe(1);await edit();await expect(page.getByRole('button',{name:'Reintentar',exact:true})).toHaveCount(0);
      return{fixture:'Existing pending history simulated directly; NOT an induced mid-server failure',expenseCount:2,pendingCleared:true,historyCount:2,retryRemovedAfterReload:true};
    });
    await context.close();
  }
}finally{
  await browser.close();let deleted=0;for(const col of await db.listCollections())for(const doc of(await col.get()).docs){await doc.ref.delete();deleted++;}
  let documentsRemaining=0;for(const col of await db.listCollections())documentsRemaining+=(await col.get()).size;
  const restored=restore();fs.writeFileSync('docs/evidencias/112-mantenimiento-resultado.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,results,cleanup:{deleted,documentsRemaining,...restored},scope:'Private emulator UI; no production data, real equipment or Hosting certification'},null,2)+'\n');await app.delete();
}
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
