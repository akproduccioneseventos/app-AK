import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import admin from 'firebase-admin';
import { chromium, devices, expect } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Owned demo only');
const root='http://127.0.0.1:3301',planFile='docs/evidencias/124-model-plan.generated.json';
if(fs.existsSync(planFile))throw new Error('Prior plan active');
const restore=fixtureGuard(),app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa124-ai-final'),db=app.firestore();
const browser=await chromium.launch({headless:true}),results=[];
const resume=process.argv.includes('--remaining-after-voice-redirect');
if(resume){const old=JSON.parse(zlib.gunzipSync(fs.readFileSync('docs/evidencias/124-ia-voz-redirect-124-ia-final-resultados.json.gz')));
  assert.equal(old.applicationSourceSha,process.env.COMMIT_SHA);assert.equal(old.cleanup.bytesRestored,true);
  const passed=old.results.filter(r=>r.status==='PASS');assert.equal(passed.length,16);assert(passed.every(r=>r.viewport==='desktop'));
  assert(old.results.at(-1).error.includes('405 !== 401'));results.push(...passed);}
const uncertain='No llego la confirmacion. El pedido puede haberse guardado.';
function clearArrays(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){
  const file=folder+'/'+item.name;if(item.isDirectory())clearArrays(file);else if(item.name.endsWith('.json')){try{if(Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))))fs.writeFileSync(file,'[]\n');}catch{}}
}}
function budgetPlan(name,services,extra={}){fs.writeFileSync(planFile,JSON.stringify({owner:'qa124',index:0,calls:0,mode:'budget-repeat',budgetStep:
  {accion:'armar_presupuesto',argumentos:{nombreCliente:name,telefono:'099000124',tipoEvento:'Boda',fechaEvento:'2027-08-08',invitados:150,servicios:services,...extra}}
}));}
async function docsFor(name){return(await db.collection('presupuestos').get()).docs.filter(d=>d.data().clienteNombre===name).map(d=>({id:d.id,...d.data()}));}
async function record(viewport,name,fn){const details=await fn();results.push({viewport,name,status:'PASS',details});console.log(JSON.stringify({viewport,name,status:'PASS'}));}
try {
  for(const c of await db.listCollections())if(!(await c.limit(1).get()).empty)throw new Error('Empty emulator required');
  clearArrays('data');clearArrays('src/data');
  const catalog=[
    {id:'qa124-personas',nombre:'Menu QA124 Base',categoria:'Catering',calculationMethod:'porPersona',precioBase:500},
    {id:'qa124-tramos',nombre:'Servicio QA124 Tramos',categoria:'Tecnologia',calculationMethod:'tramos',precioBase:9000,tramosDePrecio:[{id:'a',desde:1,hasta:100,precio:8000},{id:'b',desde:101,hasta:200,precio:12000}]},
    {id:'qa124-ratio',nombre:'Personal QA124 Ratio',categoria:'Personal',calculationMethod:'ratio',precioBase:500,invitadosPorUnidad:25},
    {id:'qa124-dj',nombre:'DJ QA124',categoria:'Discoteca',calculationMethod:'fijo',precioBase:1000},
    {id:'qa124-kids',nombre:'Menu infantil QA124',categoria:'Catering',calculationMethod:'porPersona',precioBase:500},
    {id:'qa124-menu2',nombre:'Menu QA124 Otro',categoria:'Catering',calculationMethod:'porPersona',precioBase:800},
  ];
  for(const s of catalog)await db.collection('servicios').doc(s.id).set({...s,activo:true});
  await db.collection('fiestas').doc('qa124-role-party').set({id:'qa124-role-party',configuracion:{nombreEvento:'Fiesta QA124',clienteNombre:'Cliente QA124',tipoEvento:'Boda',fechaEvento:'2027-08-08',invitadosEstimados:150},tareas:[]});
  for(const viewport of ['desktop','mobile']) {
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage(); page.setDefaultTimeout(20000);
    async function open(){await page.goto(root+'/empresa/dashboard',{waitUntil:'networkidle',timeout:90000});
      if(!(await page.getByPlaceholder('Hablar con General...').isVisible())){await page.getByRole('button',{name:'Abrir Asistente IA AK',exact:true}).click();await page.getByTitle(/^Encargado General AK/).click();}}
    async function send(text,lose=false){await page.getByPlaceholder('Hablar con General...').fill(text);
      if(lose){await page.route('**/api/multiagent/message',async route=>{const response=await route.fetch();expect(response.status()).toBe(200);await route.abort('failed');},{times:1});
        await page.getByTitle('Enviar',{exact:true}).click();await expect(page.getByText(new RegExp(uncertain))).toBeVisible({timeout:90000});return;}
      const wait=page.waitForResponse(r=>r.url().endsWith('/api/multiagent/message')&&r.request().method()==='POST',{timeout:90000});
      await page.getByTitle('Enviar',{exact:true}).click();const response=await wait;expect(response.status()).toBe(200);const reply=await response.json();await expect(page.getByText(reply.response,{exact:true}).last()).toBeVisible({timeout:60000});return reply;}
    await open();
    for(const row of [
      {key:'por-persona-base',services:['Menu QA124 Base'],expected:75000,qty:150},
      {key:'tramos',services:['Servicio QA124 Tramos'],expected:12000,qty:1},
      {key:'ratio',services:['Personal QA124 Ratio'],expected:3000,qty:6},
      {key:'partial-catalog',services:['DJ QA124','NO EXISTE QA124'],expected:null},
      {key:'duplicate-service',services:['DJ QA124','DJ QA124'],expected:1000,qty:1},
      {key:'menu-infantil',services:['Menu infantil QA124'],expected:25000,qty:50,extra:{adultos:100,adolescentes:20,ninos:30}},
      {key:'menu-sin-edades',services:['Menu infantil QA124'],expected:null},
      {key:'categoria-ambigua',services:['Catering'],expected:null},
      {key:'sin-tramo',services:['Servicio QA124 Tramos'],expected:null,extra:{invitados:300}},
    ].filter(()=>!(resume&&viewport==='desktop')))await record(viewport,row.key,async()=>{
      const name=`QA124 ${viewport} ${row.key}`;budgetPlan(name,row.services,row.extra);const reply=await send('Arma presupuesto '+name);
      const saved=await docsFor(name);const actual=saved.length?saved[0].totalConDescuento:null;
      assert.equal(actual,row.expected);assert.equal(saved.length,row.expected===null?0:1);assert.equal(reply.success,row.expected!==null);
      if(saved.length){assert.equal(saved[0].itemsPresupuestados[0].cantidad,row.qty);assert.equal(saved[0].itemsPresupuestados.length,1);}
      return {expected:row.expected,actual,ids:saved.map(d=>d.id),response:reply.response};
    });
    if(!(resume&&viewport==='desktop'))await record(viewport,'uncertain-A-confirmed-B-reload-retry-A',async()=>{
      const a=`QA124 ${viewport} interleaved A`,b=`QA124 ${viewport} interleaved B`,message='Arma presupuesto '+a;
      budgetPlan(a,['DJ QA124']);await send(message,true);const before=await docsFor(a);assert.equal(before.length,1);
      budgetPlan(b,['DJ QA124']);assert.equal((await send('Arma presupuesto '+b)).success,true);assert.equal((await docsFor(b)).length,1);
      await page.unroute('**/api/multiagent/message');await open();budgetPlan(a,['DJ QA124']);await send(message);
      assert.deepEqual(await docsFor(a),before);
      budgetPlan(a,['DJ QA124']);await send(message);assert.equal((await docsFor(a)).length,2);
      return {uncertainId:before[0].id,afterRetry:1,deliberateNewQuote:2,samePhoneAllowed:true};
    });
    const roles=[['Supervisor de Fiestas','Eventos'],['Agente de esta Fiesta','Fiesta'],['Secretaria AK','Agenda'],['Agente Contable AK','Caja'],['Agente Vendedor AK','Ventas'],['Agente Marketing AK','Marketing']];
    for(const [title,short]of roles.filter(()=>!(resume&&viewport==='desktop')))await record(viewport,'role-'+short,async()=>{
      const route=['Eventos','Fiesta','Agenda'].includes(short)?'/empresa/dashboard?fiestaId=qa124-role-party':'/presupuestos';
      await page.goto(root+route,{waitUntil:'networkidle',timeout:90000});
      if(!(await page.locator('textarea[placeholder^="Hablar con"]').isVisible()))await page.getByRole('button',{name:'Abrir Asistente IA AK',exact:true}).click();
      await page.getByTitle(new RegExp('^'+title)).click();const marker=`QA124 ${viewport} ${short} sin acciones`;
      fs.writeFileSync(planFile,JSON.stringify({owner:'qa124',index:0,calls:0,steps:[{response:marker,action:{type:'none'}}]}));
      const count=(await db.collection('presupuestos').get()).size;
      await page.getByPlaceholder(`Hablar con ${short}...`).fill('Resumen de datos QA124');
      const wait=page.waitForResponse(r=>r.url().endsWith('/api/multiagent/message')&&r.request().method()==='POST',{timeout:90000});
      await page.getByTitle('Enviar',{exact:true}).click();const response=await wait;assert.equal(response.status(),200);const reply=await response.json();
      assert(reply.response.includes(marker));await expect(page.getByText(reply.response,{exact:true}).last()).toBeVisible();
      assert.equal((await db.collection('presupuestos').get()).size,count);return{route,visible:true,response:marker,createdBudgets:0,protocolOnly:true};
    });
    await record(viewport,'voice-no-provider-and-no-public-access',async()=>{
      const voice=await context.request.post(root+'/api/asistente/voz-en-vivo');assert.equal(voice.status(),503);const json=await voice.json();assert.match(json.error,/clave.*Gemini/i);assert.equal(json.token,undefined);
      const publicVoice=await browser.newContext();const noAuth=await publicVoice.request.post(root+'/api/asistente/voz-en-vivo',{maxRedirects:0});
      assert([401,307].includes(noAuth.status()));if(noAuth.status()===307)assert(new URL(noAuth.headers().location,root).pathname==='/login');
      assert(!(await noAuth.text()).includes('qa124-no-real-key'));const denied=noAuth.status();await publicVoice.close();
      return{authenticatedNoKey:503,guestDenied:denied,blockedBeforeApi:denied===307,tokenLeaked:false,realVoiceTested:false};
    });
    await context.close();
  }
}catch(error){results.push({status:'QA_NOT_ACCEPTED',error:error.stack});process.exitCode=1;}
finally{await browser.close();for(const c of await db.listCollections())for(const d of(await c.get()).docs)await d.ref.delete();
  if(fs.existsSync(planFile)&&JSON.parse(fs.readFileSync(planFile)).owner==='qa124')fs.unlinkSync(planFile);
  const cleanup=restore();await app.delete();fs.writeFileSync('docs/evidencias/124-ia-final-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,provider:'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS',results,cleanup,
    compositeNative:resume?{reused:16,reusedEvidence:'124-ia-voz-redirect-124-ia-final-resultados.json.gz',newCases:18,note:'Same compiled source; correct middleware-denial expectation, no production or other assertions changed.'}:null},null,2)+'\n');}
