import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Private emulator only');
const restore=fixtureGuard(),root='http://127.0.0.1:3301',results=[];
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa112-fallos'),db=app.firestore();db.settings({ignoreUndefinedProperties:true});
for(const col of await db.listCollections())if(!(await col.limit(1).get()).empty)throw new Error('Empty owned emulator required');
const browser=await chromium.launch({headless:true});
async function record(viewport,name,fn){const r={viewport,name};try{r.details=await fn();r.status=r.details.acceptance;}catch(e){r.status='NOT_ACCEPTED';r.error=e.message;}results.push(r);console.log(JSON.stringify(r));}
try{
  for(const viewport of ['desktop','mobile']){
    const marker='QA112 '+viewport+' '+crypto.randomUUID().slice(0,8),id='qa112_ack_'+viewport,today=new Date().toISOString().slice(0,10);
    const seed=async assetId=>db.collection('activos_fijos').doc(assetId).set({id:assetId,nombre:marker+' Laser',tipoItem:'Activo Fijo',categoria:'Discoteca',unidad:'Unidad',cantidadDisponible:1,valorUnitarioEstimado:500,calculationMethod:'fijo',precioVenta:1,mantenimiento:{cadaDias:30,ultimoAt:today,historial:[]}});
    await seed(id);
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    let drop=false,ack;
    await context.route('**/*',async r=>{
      if(drop&&r.request().headers()['next-action']==='60d1fc7d1c0cd726b1d4f0ff53b270f6162d4d7cb0'){
        drop=false;const response=await r.fetch();await response.body();ack={status:response.status(),serverCompleted:true};return r.abort('failed');
      }return r.fallback();
    });
    const fill=async(page,assetId,note,cost)=>{
      page.setDefaultTimeout(18000);await page.goto(root+'/empresa/activos-fijos/'+assetId+'/editar',{waitUntil:'networkidle',timeout:60000});
      await page.getByRole('button',{name:'Anotar un mantenimiento',exact:true}).click();const d=page.getByRole('dialog');
      await d.locator('#maint-fecha').fill(today);await d.locator('#maint-nota').fill(note);await d.locator('#maint-costo').fill(cost);return d;
    };
    const state=async assetId=>(await db.collection('activos_fijos').doc(assetId).get()).data();
    const expenses=async assetId=>(await db.collection('gastos_generales').get()).docs.filter(d=>d.data().notas?.includes('('+assetId+')')).map(d=>({id:d.id,...d.data()}));
    await record(viewport,'lost-confirmation-retry-must-not-double-charge',async()=>{
      const page=await context.newPage(),d=await fill(page,id,marker+' Lampara','123.45');drop=true;
      await d.getByRole('button',{name:'Anotar mantenimiento',exact:true}).click();await expect(page.getByText('Error al registrar mantenimiento',{exact:true})).toBeVisible();
      const first={history:(await state(id)).mantenimiento.historial,expenses:await expenses(id)};expect(first.history.length).toBe(1);expect(first.expenses.length).toBe(1);expect(ack.status).toBe(200);
      await page.screenshot({path:`docs/evidencias/112-ack-lost-${viewport}.png`,fullPage:true});
      await d.getByRole('button',{name:'Anotar mantenimiento',exact:true}).click();await expect(d).not.toBeVisible();
      const after={history:(await state(id)).mantenimiento.historial,expenses:await expenses(id)};
      await page.screenshot({path:`docs/evidencias/112-ack-retry-${viewport}.png`,fullPage:true});await page.close();
      return{ack,first,after,acceptance:after.history.length===1&&after.expenses.length===1?'PASS':'FAIL_DUPLICATE_AFTER_LOST_ACK'};
    });
    await record(viewport,'two-operators-must-preserve-both-maintenance-records',async()=>{
      const assetId=id+'_concurrent';await seed(assetId);const a=await context.newPage(),b=await context.newPage();
      const da=await fill(a,assetId,marker+' Operador A','10.25'),dbb=await fill(b,assetId,marker+' Operador B','20.50');
      await Promise.all([da.getByRole('button',{name:'Anotar mantenimiento',exact:true}).click(),dbb.getByRole('button',{name:'Anotar mantenimiento',exact:true}).click()]);
      await Promise.all([expect(da).not.toBeVisible(),expect(dbb).not.toBeVisible()]);
      const after={history:(await state(assetId)).mantenimiento.historial,expenses:await expenses(assetId)};
      await a.screenshot({path:`docs/evidencias/112-concurrent-${viewport}.png`,fullPage:true});await a.close();await b.close();
      return{after,acceptance:after.history.length===2&&after.expenses.length===2?'PASS':'FAIL_LOST_CONCURRENT_MAINTENANCE'};
    });
    await context.close();
  }
}finally{
  await browser.close();let deleted=0;for(const col of await db.listCollections())for(const doc of(await col.get()).docs){await doc.ref.delete();deleted++;}
  let documentsRemaining=0;for(const col of await db.listCollections())documentsRemaining+=(await col.get()).size;
  fs.writeFileSync('docs/evidencias/112-mantenimiento-fallos-resultado.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,results,cleanup:{deleted,documentsRemaining,...restore()}},null,2)+'\n');await app.delete();
}
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
