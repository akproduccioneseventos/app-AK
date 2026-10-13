import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Private emulator only');
const root='http://127.0.0.1:3301',restore=fixtureGuard(),results=[];
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa111-titulos'),db=app.firestore();
if((await db.listCollections()).length){for(const c of await db.listCollections())if(!(await c.get()).empty)throw new Error('Fresh owned emulator required');}
const browser=await chromium.launch({headless:true});
const kinds=[{name:'asset',route:'activos-fijos',collection:'activos_fijos',type:'Activo Fijo',category:'Mobiliario'},{name:'ingredient',route:'insumos',collection:'insumos',type:'Insumo/Ingrediente',category:'Insumos varios'}];
const names=new Map();
try{
  for(const viewport of ['desktop','mobile'])for(const k of kinds)for(const variant of ['short','long']){
    const id='QA111_titulo_'+viewport+'_'+k.name+'_'+variant;
    const nombre=variant==='short'?'QA111 Silla blanca':`QA111_${viewport}_${k.name}_${crypto.randomUUID()}`;
    names.set(id,nombre);
    await db.collection(k.collection).doc(id).set({id,nombre,tipoItem:k.type,categoria:k.category,unidad:'Unidad',cantidadDisponible:1,valorUnitarioEstimado:0,calculationMethod:'fijo',cantidad:1});
  }
  let warmed=false;
  for(const viewport of ['desktop','mobile']){
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();
    if(!warmed){
      await page.goto(root+'/empresa/insumos/nuevo',{waitUntil:'networkidle'});
      await page.locator('#item-nombre').fill('QA111 Cache fixture '+crypto.randomUUID().slice(0,8));
      await page.getByRole('button',{name:'Guardar Insumo',exact:true}).click();
      await expect(page).toHaveURL(root+'/empresa/insumos',{timeout:30000});warmed=true;
    }
    for(const k of kinds){
      const row={viewport,name:k.name+'-long-title-responsive',samples:[]};
      for(const variant of ['short','long']){
        const id='QA111_titulo_'+viewport+'_'+k.name+'_'+variant,nombre=names.get(id);
        await page.goto(root+'/empresa/'+k.route+'/'+id+'/editar',{waitUntil:'networkidle',timeout:60000});
        await expect(page.locator('#item-nombre')).toHaveValue(nombre);
        const geometry=await page.getByRole('heading',{name:/Editando:/}).evaluate(title=>{
          const box=title.getBoundingClientRect();
          return{innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,visualViewport:{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale},title:box?{x:box.x,width:box.width,right:box.right}:null};
        });
        const button=page.getByRole('button',{name:'Guardar Cambios',exact:true});let clickTrial=true,error=null;
        try{await button.click({trial:true,timeout:5000});}catch(e){clickTrial=false;error=e.message;}
        row.samples.push({variant,nombre,geometry,clickTrial,error});
        if(viewport==='mobile')await page.screenshot({path:`docs/evidencias/111-${k.name}-title-${variant}-mobile.png`,fullPage:true});
      }
      const a=row.samples[0].geometry,b=row.samples[1].geometry;
      row.status=b.scrollWidth>b.clientWidth+4?'FAIL':'PASS';
      row.details={shortOverflow:a.scrollWidth-a.clientWidth,longOverflow:b.scrollWidth-b.clientWidth,readOnly:true,acceptance:row.status==='FAIL'?'FAIL_LONG_TITLE_OVERFLOWS_VIEWPORT':'PASS'};
      results.push(row);console.log(JSON.stringify({viewport,name:row.name,status:row.status,details:row.details}));
    }
    await context.close();
  }
}finally{
  await browser.close();const removed=[];
  for(const c of await db.listCollections())for(const d of(await c.get()).docs){await d.ref.delete();removed.push(d.ref.path);}
  fs.writeFileSync('docs/evidencias/111-titulos-restauracion.json',JSON.stringify({...restore(),initialDocuments:0,removedEmulatorDocuments:removed},null,2));
  fs.writeFileSync('docs/evidencias/111-titulos.json',JSON.stringify(results,null,2));await app.delete();
}
