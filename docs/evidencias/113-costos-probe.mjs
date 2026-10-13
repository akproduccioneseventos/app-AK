import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Private demo only');
const restore=fixtureGuard(),root='http://127.0.0.1:3301',results=[],onlyConsumer=process.argv.includes('--consumer-only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa113-costs'),db=app.firestore();db.settings({ignoreUndefinedProperties:true});
for(const col of await db.listCollections())if(!(await col.limit(1).get()).empty)throw new Error('Empty owned emulator required');
const insumo={id:'qa113_carne',nombre:'QA113 Carne',categoria:'Carnes',unidad:'kg',valorUnitarioEstimado:100,cantidadDisponible:2};
const dish=(id,name,quantity,unit,origenId='qa113_carne')=>({id,name,type:'Plato Principal',ingredients:[{id:id+'_ing',origenId,name:'QA113 Carne',quantityPerPerson:quantity,unit,costoUnitario:100,costoTotalReceta:25}],totalDishCost:25,profitMargin:100,suggestedSellingPrice:50});
const menu={id:'qa113_menu',name:'QA113 Menu',description:'Fixture privado',items:[dish('qa113_kg','QA113 Plato kg','0.25','kg'),dish('qa113_g','QA113 Plato gramos','250','g')]};
const control={id:'qa113_control',name:'QA113 Control sin carne',description:'Fixture privado',items:[dish('qa113_control_plato','QA113 Control','0.25','kg','qa113_otro')]};
const browser=await chromium.launch({headless:true});
async function record(viewport,name,fn){const r={viewport,name};try{r.details=await fn();r.status=r.details?.acceptance?.startsWith('FAIL')?'FAIL':'PASS';}catch(e){r.status='NOT_ACCEPTED';r.error=e.message;}results.push(r);console.log(JSON.stringify(r));}
try{
  await db.collection('insumos').doc(insumo.id).set(insumo);await db.collection('menus_catering').doc(menu.id).set(menu);await db.collection('menus_catering').doc(control.id).set(control);
  const ir=db.collection('insumos').doc(insumo.id),mr=db.collection('menus_catering').doc(menu.id),cr=db.collection('menus_catering').doc(control.id);
  const state=async()=>({insumo:(await ir.get()).data(),menu:(await mr.get()).data(),control:(await cr.get()).data()});
  for(const viewport of ['desktop','mobile']){
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const p=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;await context.addCookies([{name:'ak_session',value:`${p}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(p).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    let mode=null,ack;
    await context.route('**/*',async r=>{if(mode&&r.request().headers()['next-action']==='7fbfcc131a7fb8bd4c8edc7a63c449b8b71a60d4c9'){
      const selected=mode;mode=null;if(selected==='before')return r.abort('failed');const response=await r.fetch();await response.body();ack={status:response.status(),serverCompleted:true};return r.abort('failed');
    }return r.fallback();});
    const page=await context.newPage();page.setDefaultTimeout(18000);
    const go=url=>page.goto(root+url,{waitUntil:'networkidle',timeout:60000});
    const adjust=async percent=>{await page.locator('#cost-percentage-adjust').fill(String(percent));await page.getByRole('button',{name:'Ajustar Costos',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Aplicar ajuste del '+(percent>0?'+':'')+percent+'%',exact:true}).click();};
    await go('/empresa/insumos');const before=await state();let expectedCost=before.insumo.valorUnitarioEstimado;
    if(!onlyConsumer){
    await record(viewport,'cancel-global-adjustment-preserves-inventory-and-menus',async()=>{
      await page.locator('#cost-percentage-adjust').fill('10');await page.getByRole('button',{name:'Ajustar Costos',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Cancelar',exact:true}).click();
      expect(await state()).toEqual(before);return{noWrite:true};
    });
    await record(viewport,'failed-send-keeps-percentage-without-writing',async()=>{
      mode='before';await adjust(10);await expect(page.getByText('Error al ajustar costos',{exact:true})).toBeVisible();await expect(page.locator('#cost-percentage-adjust')).toHaveValue('10');expect(await state()).toEqual(before);return{noWrite:true,percentageKept:true};
    });
    await record(viewport,'retry-adjusts-ingredient-and-linked-kg-recipe',async()=>{
      await adjust(10);await expect(page.getByText('Costos de Insumos Ajustados',{exact:true})).toBeVisible();const after=await state();expectedCost=Number((expectedCost*1.1).toFixed(2));
      expectedCost=Math.round(before.insumo.valorUnitarioEstimado*1.1);expect(after.insumo.valorUnitarioEstimado).toBeCloseTo(expectedCost,6);expect(after.insumo.cantidadDisponible).toBe(2);
      expect(after.menu.items[0].ingredients[0].costoUnitario).toBeCloseTo(expectedCost,6);expect(after.menu.items[0].totalDishCost).toBeCloseTo(expectedCost*0.25,6);
      return{inventory:after.insumo,kgDish:after.menu.items[0],stockUnchanged:true};
    });
    await record(viewport,'grams-recipe-retains-quantity-unit-and-equivalent-cost',async()=>{
      const after=await state(),grams=after.menu.items.find(x=>x.id==='qa113_g'),expected=expectedCost*0.25;
      return{grams,expectedCost:expected,acceptance:grams.ingredients[0].unit==='g'&&grams.ingredients[0].quantityPerPerson==='250'&&Math.abs(grams.totalDishCost-expected)<0.001?'PASS':'FAIL_RECIPE_UNIT_OR_COST_CHANGED'};
    });
    await record(viewport,'unrelated-menu-and-selling-price-are-not-overwritten',async()=>{
      const after=await state();expect(after.control).toEqual(before.control);expect(after.menu.items[0].suggestedSellingPrice).toBe(50);return{unrelatedMenuUnchanged:true,explicitSellingPricePreserved:50};
    });
    }
    if(onlyConsumer){await adjust(10);await expect(page.getByText('Costos de Insumos Ajustados',{exact:true})).toBeVisible();expectedCost=Math.round(before.insumo.valorUnitarioEstimado*1.1);expect((await state()).insumo.valorUnitarioEstimado).toBe(expectedCost);}
    await record(viewport,'reload-shows-updated-ingredient-and-menu-consumer',async()=>{
      await go('/empresa/insumos/'+insumo.id+'/editar');await expect(page.locator('#item-costo')).toHaveValue(String(expectedCost));
      await go('/empresa/menus');await expect(page.getByText(menu.name,{exact:true})).toBeVisible();
      const href='/empresa/menus/'+menu.id+'/editar';await page.locator('a[href="'+href+'"]').click();await expect(page).toHaveURL(root+href,{timeout:30000});await expect(page.getByRole('heading',{name:'Editar Men\u00fa: '+menu.name,exact:true})).toBeVisible({timeout:30000});await page.waitForLoadState('networkidle');
      const text=await page.locator('body').innerText(),inputs=await page.locator('input').evaluateAll(ns=>ns.map(n=>({id:n.id,value:n.value})));
      fs.writeFileSync(`docs/evidencias/113-menu-consumer-${viewport}.json`,JSON.stringify({url:page.url(),text,inputs},null,2)+'\n');await page.screenshot({path:`docs/evidencias/113-menu-consumer-${viewport}.png`,fullPage:true});await expect(page.getByText('QA113 Plato kg',{exact:true})).toBeVisible();await expect(page.getByText('QA113 Plato gramos',{exact:true})).toBeVisible();
      return{ingredientReloaded:true,actualMenuLinkUsed:href,menuConsumerOpened:true};
    });
    if(!onlyConsumer)await record(viewport,'lost-success-response-retry-applies-percentage-only-once',async()=>{
      await go('/empresa/insumos');const old=await state();mode='after';await adjust(5);await expect(page.getByText('Error al ajustar costos',{exact:true})).toBeVisible();const first=await state();
      expect(ack.status).toBe(200);expect(first.insumo.valorUnitarioEstimado).toBe(Math.round(old.insumo.valorUnitarioEstimado*1.05));
      await page.screenshot({path:`docs/evidencias/113-response-lost-${viewport}.png`,fullPage:true});await adjust(5);await expect(page.getByText('Costos de Insumos Ajustados',{exact:true})).toBeVisible();const after=await state();
      return{ack,costBefore:old.insumo.valorUnitarioEstimado,costAfterFirst:first.insumo.valorUnitarioEstimado,costAfterRetry:after.insumo.valorUnitarioEstimado,acceptance:Math.abs(after.insumo.valorUnitarioEstimado-first.insumo.valorUnitarioEstimado)<0.001?'PASS':'FAIL_PERCENTAGE_APPLIED_TWICE_AFTER_LOST_ACK'};
    });
    await context.close();
  }
}finally{
  await browser.close();let deleted=0;for(const col of await db.listCollections())for(const doc of(await col.get()).docs){await doc.ref.delete();deleted++;}
  let documentsRemaining=0;for(const col of await db.listCollections())documentsRemaining+=(await col.get()).size;
  fs.writeFileSync(onlyConsumer?'docs/evidencias/113-costos-consumer-resultado.json':'docs/evidencias/113-costos-resultado.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,results,cleanup:{deleted,documentsRemaining,...restore()}},null,2)+'\n');await app.delete();
}
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
