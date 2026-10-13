import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Private emulator only');
const root='http://127.0.0.1:3301',restore=fixtureGuard(),results=[];
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa111-recursos'),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});
const initial=[];
for(const col of await db.listCollections())for(const d of(await col.get()).docs)initial.push(d.ref.path);
if(initial.length)throw new Error('Fresh owned emulator required');
const browser=await chromium.launch({headless:true});
let currentPage;
const kinds=[{name:'asset',route:'activos-fijos',collection:'activos_fijos',type:'Activo Fijo',category:'Mobiliario',unit:'Unidad',save:'Guardar Activo',action:'40113b7317108b7a715966f798883334accc5eab24'},
  {name:'ingredient',route:'insumos',collection:'insumos',type:'Insumo/Ingrediente',category:'Insumos varios',unit:'Kg',save:'Guardar Insumo',action:'7f568694921aaf0a83e2da029a936bb322615d46a1'}];
async function record(viewport,name,fn){
  const r={viewport,name};try{r.details=await fn();r.status=r.details?.acceptance?.startsWith('FAIL')?'FAIL':'PASS';}catch(error){
    r.status='NOT_ACCEPTED';r.error=error.message;
    if(currentPage&&!/Prerequisite/.test(error.message)){
      r.diagnostic={url:currentPage.url(),body:await currentPage.locator('body').innerText()};
      r.diagnostic.fields=await currentPage.locator('input').evaluateAll(ns=>ns.map(n=>({id:n.id,value:n.value,valid:n.validity.valid,message:n.validationMessage})));
      r.diagnostic.viewport=await currentPage.evaluate(()=>({innerWidth,innerHeight,scrollX,scrollY,scrollWidth:document.documentElement.scrollWidth,visual:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale,offsetLeft:visualViewport.offsetLeft,offsetTop:visualViewport.offsetTop}:null}));
      r.diagnostic.buttons=await currentPage.getByRole('button').evaluateAll(ns=>ns.filter(n=>/Guardar/.test(n.textContent)).map(n=>{const b=n.getBoundingClientRect(),at=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{text:n.textContent,disabled:n.disabled,box:{x:b.x,y:b.y,width:b.width,height:b.height},at:at?.outerHTML.slice(0,600)};}));
      await currentPage.screenshot({path:`docs/evidencias/111-${name}-${viewport}-error.png`,fullPage:true});
    }
  }
  results.push(r);console.log(JSON.stringify({viewport,name,status:r.status,error:r.error}));
}
try{
  for(const k of kinds)await db.collection(k.collection).doc('QA111_sentinel_'+k.name).set({id:'QA111_sentinel_'+k.name,nombre:'QA111 Sentinel '+k.name,tipoItem:k.type,categoria:k.category,unidad:k.unit,cantidadDisponible:1,valorUnitarioEstimado:0,calculationMethod:'fijo',cantidad:1});
  for(const viewport of globalThis.__qa111Viewports||['desktop','mobile']){
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');window.__qaPrintCalls=0;window.print=()=>{window.__qaPrintCalls++;};});
    const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    let blocked=null;
    await context.route('**/*',r=>blocked&&r.request().headers()['next-action']===blocked?r.abort('failed'):r.fallback());
    const page=await context.newPage();currentPage=page;page.setDefaultTimeout(15000);
    const go=url=>page.goto(root+url,{waitUntil:'networkidle',timeout:60000});
    const clickSave=async name=>{
      const button=page.getByRole('button',{name,exact:true});
      if(viewport==='mobile'){
        await button.evaluate(n=>n.scrollIntoView({behavior:'instant',block:'center'}));
        await page.waitForTimeout(250);
      }
      await button.click();
    };
    for(const k of kinds){
      const marker='QA111 '+(viewport==='mobile'?'Cel':'PC')+' '+(k.name==='asset'?'Silla':'Harina')+' '+crypto.randomUUID().slice(0,8),base='/empresa/'+k.route;
      const own=async()=>(await db.collection(k.collection).get()).docs.filter(d=>d.data().nombre===marker);
      let id,expectedStock=3;
      await record(viewport,k.name+'-create-and-reopen',async()=>{
        await go(base+'/nuevo');await page.locator('#item-nombre').fill(marker);
        if(k.unit==='Kg'){
          const control=page.locator('#item-unidad');
          if(await control.evaluate(n=>n.tagName)==='SELECT')await control.selectOption('Kg');
          else{await control.click();await page.getByRole('option',{name:'Kg',exact:true}).click();}
        }
        await page.locator('#item-cantidad').fill('3');await page.locator('#item-valor-unitario').fill('0');
        await clickSave(k.save);await expect(page).toHaveURL(root+base,{timeout:30000});
        const docs=await own();expect(docs.length).toBe(1);id=docs[0].id;expect(docs[0].data().cantidadDisponible).toBe(3);expect(docs[0].data().unidad).toBe(k.unit);
        await go(base+'/'+id+'/editar');await expect(page.locator('#item-nombre')).toHaveValue(marker);await expect(page.locator('#item-cantidad')).toHaveValue('3');
        return{id,stock:3,unit:k.unit,cost:0,reopened:true};
      });
      if(k.unit==='Kg')await record(viewport,'ingredient-fractional-stock-in-edit',async()=>{
        if(!id)throw new Error('Prerequisite not accepted');
        await page.locator('#item-cantidad').fill('2.5');
        const validity=await page.locator('#item-cantidad').evaluate(n=>({valid:n.validity.valid,stepMismatch:n.validity.stepMismatch,step:n.getAttribute('step'),message:n.validationMessage}));
        await clickSave('Guardar Cambios');
        await expect(page).toHaveURL(root+base,{timeout:20000});
        const state=(await db.collection(k.collection).doc(id).get()).data();
        await page.screenshot({path:`docs/evidencias/111-ingredient-fraction-${viewport}.png`,fullPage:true});
        expect(state.cantidadDisponible).toBe(2.5);expectedStock=2.5;await go(base+'/'+id+'/editar');
        return{unit:'Kg',requestedStock:2.5,storedStock:state.cantidadDisponible,transientNativeValidity:validity,acceptance:'PASS'};
      });
      await record(viewport,k.name+'-failed-edit-keeps-draft-and-retries',async()=>{
        if(!id)throw new Error('Prerequisite not accepted');
        await go(base+'/'+id+'/editar');await page.locator('#item-cantidad').fill('4');blocked=k.action;
        await clickSave('Guardar Cambios');
        await expect(page.getByText('Error al Guardar',{exact:true})).toBeVisible();await expect(page.locator('#item-cantidad')).toHaveValue('4');
        expect((await db.collection(k.collection).doc(id).get()).data().cantidadDisponible).toBe(expectedStock);blocked=null;
        await clickSave('Guardar Cambios');await expect(page).toHaveURL(root+base,{timeout:20000});
        expect((await db.collection(k.collection).doc(id).get()).data().cantidadDisponible).toBe(4);
        const beforeStock=expectedStock;expectedStock=4;return{errorVisible:true,draftKept:true,beforeRetryStock:beforeStock,afterRetryStock:4};
      });
      blocked=null;
      await record(viewport,k.name+'-stock-report-and-print-command',async()=>{
        if(!id)throw new Error('Prerequisite not accepted');await go(base+'/reporte');
        const row=page.getByRole('row').filter({hasText:marker});await expect(row).toBeVisible();const text=await row.innerText();expect(text).toContain(k.unit);expect(text).toContain(expectedStock+' '+k.unit);
        const buttons=await page.getByRole('button').allTextContents();const print=page.getByRole('button',{name:/Imprimir/i});
        await print.click();expect(await page.evaluate(()=>window.__qaPrintCalls)).toBe(1);
        return{reportRow:text,buttons,printCommandObserved:true,physicalPrintingOrPdfNotTested:true};
      });
    }
    await context.close();
  }
}finally{
  await browser.close();const removed=[];
  for(const col of await db.listCollections())for(const d of(await col.get()).docs){await d.ref.delete();removed.push(d.ref.path);}
  const suffix=globalThis.__qa111Viewports?'recursos-mobile':'recursos';
  fs.writeFileSync('docs/evidencias/111-'+suffix+'-restauracion.json',JSON.stringify({...restore(),removedEmulatorDocuments:removed,initialDocuments:initial.length},null,2));
  fs.writeFileSync('docs/evidencias/111-'+suffix+'.json',JSON.stringify(results,null,2));await app.delete();
}
