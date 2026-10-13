import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085') throw new Error('Owned demo only');
const restore=fixtureGuard(), root='http://127.0.0.1:3301', planFile='docs/evidencias/120-model-plan.generated.json';
if(fs.existsSync(planFile)) throw new Error('Prior QA plan active; do not overwrite');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa120'), db=app.firestore();
const browser=await chromium.launch({headless:true}),results=[];
async function record(viewport,name,fn) {
  try {const details=await fn();results.push({viewport,name,status:'PASS',details});console.log(JSON.stringify(results.at(-1)));}
  catch(error){results.push({viewport,name,status:'NOT_ACCEPTED',error:error.message});console.log(JSON.stringify(results.at(-1)));throw error;}
}
function plan(steps){fs.writeFileSync(planFile,JSON.stringify({owner:'qa120',steps,index:0,calls:0}));}
try{
  for(const c of await db.listCollections()) if(!(await c.limit(1).get()).empty) throw new Error('Empty private emulator required');
  function clearArrays(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){
    const file=folder+'/'+item.name;
    if(item.isDirectory())clearArrays(file);else if(item.name.endsWith('.json')){try{if(Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))))fs.writeFileSync(file,'[]\n');}catch{}}
  }}
  clearArrays('data');clearArrays('src/data');
  await db.collection('servicios').doc('qa120-dj').set({id:'qa120-dj',nombre:'DJ QA120',categoria:'Discoteca',precioBase:1000,calculationMethod:'fijo',activo:true});
  for(const viewport of ['desktop','mobile']){
    clearArrays('data');clearArrays('src/data');
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();page.setDefaultTimeout(20000);
    await page.goto(root+'/empresa/dashboard',{waitUntil:'networkidle',timeout:90000});
    await page.getByRole('button',{name:'Abrir Asistente IA AK',exact:true}).click();
    await page.getByTitle(/^Encargado General AK/).click();
    async function send(text){
      await page.getByPlaceholder('Hablar con General...').fill(text);
      const response=page.waitForResponse(r=>r.url().endsWith('/api/multiagent/message')&&r.request().method()==='POST',{timeout:90000});
      await page.getByTitle('Enviar',{exact:true}).click();const http=await response;
      expect(http.status()).toBe(200);const result=await http.json();
      await expect(page.getByText(result.response,{exact:true}).last()).toBeVisible({timeout:60000});
      return result;
    }
    await record(viewport,'provider-down-no-false-completion',async()=>{
      plan([]);const result=await send('Arma un presupuesto QA120 proveedor caido '+viewport);
      expect(result.success).toBe(false);expect(result.response).toContain('No pude completar');expect(result.response).not.toContain('guardado y comprobado');
      expect((await db.collection('presupuestos').get()).size).toBe(0);
      await page.screenshot({path:`docs/evidencias/120-proveedor-caido-${viewport}.png`,fullPage:false});
      return {success:false,noWrites:true,responseVisible:true,providerRequests:JSON.parse(fs.readFileSync(planFile)).calls};
    });
    await record(viewport,'real-budget-does-not-repeat-false-model-summary',async()=>{
      const name='QA120 Native '+viewport;
      plan([{accion:'armar_presupuesto',argumentos:{nombreCliente:name,telefono:'099000120',tipoEvento:'Boda',fechaEvento:'2027-08-08',invitados:50,servicios:['DJ QA120']},pensamiento:'Cobre 90000 y envie un contrato'},
        {accion:'terminar',argumentos:{resumen:'Cobre 90000 y envie un contrato'}}]);
      const result=await send('Arma un presupuesto QA120 con DJ '+viewport);
      expect(result.success).toBe(true);expect(result.response).toContain('presupuesto guardado');expect(result.response).not.toMatch(/90000|contrato/);
      const budgets=await db.collection('presupuestos').get();expect(budgets.size).toBe(1);
      const b=budgets.docs[0];expect(b.data().clienteNombre).toBe(name);expect(b.data().totalConDescuento).toBe(1000);
      await page.screenshot({path:`docs/evidencias/120-presupuesto-confirmado-${viewport}.png`,fullPage:false});
      return {success:true,budgetId:b.id,total:1000,modelSummaryDiscarded:true,responseVisible:true,providerRequests:JSON.parse(fs.readFileSync(planFile)).calls};
    });
    await record(viewport,'empty-catalog-proposal-not-saved',async()=>{
      plan([{accion:'armar_presupuesto',argumentos:{nombreCliente:'QA120 Empty '+viewport,servicios:['NO EXISTE QA120']}}]);
      const result=await send('Arma un presupuesto QA120 de un servicio desconocido '+viewport);
      expect(result.success).toBe(false);expect(result.response).toContain('servicios del catalogo');expect((await db.collection('presupuestos').get()).size).toBe(1);
      return {success:false,countStill:1,responseVisible:true,providerRequests:JSON.parse(fs.readFileSync(planFile)).calls};
    });
    await context.close();
    for(const c of await db.listCollections())if(c.id!=='servicios')for(const d of (await c.get()).docs)await d.ref.delete();
  }
}catch(error){results.push({name:'probe',status:'NOT_ACCEPTED',error:error.message});process.exitCode=1;}
finally{
  await browser.close();for(const c of await db.listCollections())for(const d of (await c.get()).docs)await d.ref.delete();
  if(fs.existsSync(planFile)&&JSON.parse(fs.readFileSync(planFile)).owner==='qa120')fs.unlinkSync(planFile);
  const cleanup=restore();await app.delete();fs.writeFileSync('docs/evidencias/120-encargado-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,provider:'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS',results,cleanup},null,2)+'\n');
}
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
