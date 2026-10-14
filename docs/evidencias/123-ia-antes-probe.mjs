import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Owned demo only');
const restore=fixtureGuard(),root='http://127.0.0.1:3301',planFile='docs/evidencias/123-model-plan.generated.json';
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa123-before'),db=app.firestore(),browser=await chromium.launch({headless:true}),results=[];
function clearArrays(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){
  const file=folder+'/'+item.name;if(item.isDirectory())clearArrays(file);else if(item.name.endsWith('.json')){try{if(Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))))fs.writeFileSync(file,'[]\n');}catch{}}
}}
function plan(services,name,guests=150){fs.writeFileSync(planFile,JSON.stringify({owner:'qa123',index:0,calls:0,steps:[
  {accion:'armar_presupuesto',argumentos:{nombreCliente:name,telefono:'099000123',tipoEvento:'Boda',fechaEvento:'2027-08-08',invitados:guests,servicios:services}},
  {accion:'terminar',argumentos:{resumen:'Fin'}}
]}));}
try{
  for(const c of await db.listCollections())if(!(await c.limit(1).get()).empty)throw new Error('Empty emulator required');
  if(fs.existsSync(planFile))throw new Error('Prior QA plan active');clearArrays('data');clearArrays('src/data');
  const catalog=[
    {id:'qa123-personas',nombre:'Menu QA123 Base',categoria:'Catering',calculationMethod:'porPersona',precioBase:500},
    {id:'qa123-tramos',nombre:'Servicio QA123 Tramos',categoria:'Tecnologia',calculationMethod:'tramos',precioBase:9000,tramosDePrecio:[{id:'a',desde:1,hasta:100,precio:8000},{id:'b',desde:101,hasta:200,precio:12000}]},
    {id:'qa123-ratio',nombre:'Personal QA123 Ratio',categoria:'Personal',calculationMethod:'ratio',precioBase:500,invitadosPorUnidad:25},
    {id:'qa123-dj',nombre:'DJ QA123',categoria:'Discoteca',calculationMethod:'fijo',precioBase:1000},
  ];
  for(const s of catalog)await db.collection('servicios').doc(s.id).set({...s,activo:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
  await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
  const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
  await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
  const page=await context.newPage();await page.goto(root+'/empresa/dashboard',{waitUntil:'networkidle',timeout:90000});
  await page.getByRole('button',{name:'Abrir Asistente IA AK',exact:true}).click();await page.getByTitle(/^Encargado General AK/).click();
  async function send(text){await page.getByPlaceholder('Hablar con General...').fill(text);const wait=page.waitForResponse(r=>r.url().endsWith('/api/multiagent/message')&&r.request().method()==='POST',{timeout:90000});
    await page.getByTitle('Enviar',{exact:true}).click();const response=await wait;expect(response.status()).toBe(200);const result=await response.json();await expect(page.getByText(result.response,{exact:true}).last()).toBeVisible({timeout:60000});return result;}
  for(const row of [
    {key:'por-persona-base',services:['Menu QA123 Base'],expected:75000},
    {key:'tramos',services:['Servicio QA123 Tramos'],expected:12000},
    {key:'ratio',services:['Personal QA123 Ratio'],expected:3000},
    {key:'partial-catalog',services:['DJ QA123','NO EXISTE QA123'],expected:null},
    {key:'duplicate-service',services:['DJ QA123','DJ QA123'],expected:1000},
  ].filter(row=>!process.argv.includes('--tramos-only')||row.key==='tramos')){
    plan(row.services,'QA123 '+row.key);const reply=await send('Arma presupuesto QA123 '+row.key);const docs=(await db.collection('presupuestos').get()).docs.filter(d=>d.data().clienteNombre==='QA123 '+row.key);
    const actual=docs.length?docs[0].data().totalConDescuento:null;
    results.push({case:row.key,expected:row.expected,actual,budgetCount:docs.length,success:reply.success,response:reply.response,status:actual===row.expected?'PASS':'DEFECT_REPRODUCED'});
    console.log(JSON.stringify(results.at(-1)));
  }
  await context.close();
}catch(error){results.push({status:'QA_NOT_ACCEPTED',error:error.stack});process.exitCode=1;}
finally{await browser.close();for(const c of await db.listCollections())for(const d of(await c.get()).docs)await d.ref.delete();if(fs.existsSync(planFile)&&JSON.parse(fs.readFileSync(planFile)).owner==='qa123')fs.unlinkSync(planFile);
  const cleanup=restore();await app.delete();fs.writeFileSync(process.argv.includes('--tramos-only')?'docs/evidencias/123-ia-tramos-validos-resultados.json':'docs/evidencias/123-ia-antes-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,provider:'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS',results,cleanup},null,2)+'\n');}
