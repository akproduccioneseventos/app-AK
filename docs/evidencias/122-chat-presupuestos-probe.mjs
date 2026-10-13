import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Owned demo only');
const root='http://127.0.0.1:3301',planFile='docs/evidencias/122-model-plan.generated.json';
if(fs.existsSync(planFile))throw new Error('Prior plan active');
const restore=fixtureGuard(),app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa122-fixed'),db=app.firestore();
const browser=await chromium.launch({headless:true}),results=[];
const uncertain='No llego la confirmacion. El pedido puede haberse guardado. Si era un presupuesto, reenvia el mismo mensaje para comprobarlo; para otras acciones, revisa su estado antes de repetir.';
function plan(name){fs.writeFileSync(planFile,JSON.stringify({owner:'qa122',index:0,calls:0,mode:'budget-repeat',budgetStep:
  {accion:'armar_presupuesto',argumentos:{nombreCliente:name,telefono:'099000122',tipoEvento:'Boda',fechaEvento:'2027-08-08',invitados:50,servicios:['DJ QA122']}}
}));}
function clearArrays(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){
  const file=folder+'/'+item.name;
  if(item.isDirectory())clearArrays(file);else if(item.name.endsWith('.json')){try{if(Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))))fs.writeFileSync(file,'[]\n');}catch{}}
}}
async function snapshot(){return(await db.collection('presupuestos').get()).docs.map(d=>({id:d.id,numero:d.data().numero,total:d.data().totalConDescuento,client:d.data().clienteNombre,data:d.data()})).sort((a,b)=>a.id.localeCompare(b.id));}
async function crm(){return(await db.collection('prospectos').get()).docs.map(d=>({id:d.id,data:d.data()})).sort((a,b)=>a.id.localeCompare(b.id));}
async function record(viewport,name,fn){const details=await fn();results.push({viewport,name,status:'PASS',details});console.log(JSON.stringify({viewport,name,status:'PASS'}));}
try{
  for(const c of await db.listCollections())if(!(await c.limit(1).get()).empty)throw new Error('Empty emulator required');
  clearArrays('data');clearArrays('src/data');
  await db.collection('servicios').doc('qa122-dj').set({id:'qa122-dj',nombre:'DJ QA122',categoria:'Discoteca',precioBase:1000,calculationMethod:'fijo',activo:true});
  for(const viewport of ['desktop','mobile']){
    clearArrays('data');clearArrays('src/data');
    const context=await browser.newContext(viewport==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,r=>r.abort('blockedbyclient'));
    await context.addInitScript(()=>{localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true');});
    const payload=`v1.${Date.now()+3600000}.${crypto.randomUUID()}`;
    await context.addCookies([{name:'ak_session',value:`${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`,url:root,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();page.setDefaultTimeout(20000);
    async function open(){await page.goto(root+'/empresa/dashboard',{waitUntil:'networkidle',timeout:90000});
      if(!(await page.getByPlaceholder('Hablar con General...').isVisible())){
        if(viewport==='desktop')await page.getByTitle('Abrir asistente activo',{exact:true}).click();
        else await page.getByRole('button',{name:'Abrir Asistente IA AK',exact:true}).click();
      }
      await page.getByTitle(/^Encargado General AK/).click();}
    async function send(text){await page.getByPlaceholder('Hablar con General...').fill(text);
      const response=page.waitForResponse(r=>r.url().endsWith('/api/multiagent/message')&&r.request().method()==='POST',{timeout:90000});
      await page.getByTitle('Enviar',{exact:true}).click();const http=await response;expect(http.status()).toBe(200);const result=await http.json();
      await expect(page.getByText(result.response,{exact:true}).last()).toBeVisible({timeout:60000});return {result,body:http.request().postDataJSON()};}
    await open();const message='Arma el presupuesto QA122 ACK '+viewport;plan('QA122 ACK '+viewport);
    let initialBody;
    await record(viewport,'before-send-failure-and-visible-retry-one-budget',async()=>{
      await page.route('**/api/multiagent/message',async route=>{initialBody=route.request().postDataJSON();await route.abort('failed');},{times:1});
      await page.getByPlaceholder('Hablar con General...').fill(message);await page.getByTitle('Enviar',{exact:true}).click();
      await expect(page.getByText(uncertain,{exact:true}).last()).toBeVisible();expect(await snapshot()).toHaveLength(0);
      expect(JSON.parse(fs.readFileSync(planFile)).calls).toBe(0);
      const {result,body}=await send(message);expect(result.success).toBe(true);expect(body.requestId).toBe(initialBody.requestId);
      const docs=await snapshot();expect(docs).toHaveLength(1);expect(docs[0].total).toBe(1000);expect(docs[0].numero).toBe(1);
      return {budgetId:docs[0].id,total:1000,numero:1,sameAttempt:true,noWriteBeforeSend:true};
    });
    let lostBody,before,crmBefore;
    await record(viewport,'lost-ack-after-save-honest-uncertainty',async()=>{
      let resolveDrop,rejectDrop;const dropped=new Promise((r,j)=>{resolveDrop=r;rejectDrop=j;});
      await page.route('**/api/multiagent/message',async route=>{try{
        lostBody=route.request().postDataJSON();const http=await route.fetch({timeout:90000});expect(http.status()).toBe(200);expect((await http.json()).success).toBe(true);
        before=await snapshot();crmBefore=await crm();expect(before).toHaveLength(2);await route.abort('failed');resolveDrop();
      }catch(error){rejectDrop(error);await route.abort('failed');}},{times:1});
      await page.getByPlaceholder('Hablar con General...').fill(message);await page.getByTitle('Enviar',{exact:true}).click();await dropped;
      await expect(page.getByText(uncertain,{exact:true}).last()).toBeVisible();expect(lostBody.requestId).not.toBe(initialBody.requestId);
      await page.screenshot({path:`docs/evidencias/122-ack-corregido-${viewport}.png`,fullPage:false});
      return {count:2,ids:before.map(b=>b.id),uncertaintyVisible:true,newDeliberateQuote:true};
    });
    await record(viewport,'reload-and-visible-same-attempt-retry-preserves-budget-and-crm',async()=>{
      await open();const {result,body}=await send(message);expect(result.success).toBe(true);expect(body.requestId).toBe(lostBody.requestId);
      expect(await snapshot()).toEqual(before);expect(await crm()).toEqual(crmBefore);
      return {count:2,sameIdsAmountsNumbers:true,crmUnchanged:true,sameAttemptAfterReload:true};
    });
    await record(viewport,'identical-transport-replay-and-two-concurrent-confirmations',async()=>{
      // Real simultaneous HTTP requests; only the model protocol is a double.
      const sends=[context.request.post(root+'/api/multiagent/message',{data:lostBody,timeout:90000}),context.request.post(root+'/api/multiagent/message',{data:lostBody,timeout:90000})];
      for(const pending of sends){const response=await pending;expect(response.status()).toBe(200);expect((await response.json()).success).toBe(true);}
      expect(await snapshot()).toEqual(before);expect(await crm()).toEqual(crmBefore);
      return {count:2,simultaneousRequests:2,sameIdsAmountsNumbers:true,crmUnchanged:true};
    });
    await record(viewport,'new-identical-quotation-still-permitted',async()=>{
      const {result,body}=await send(message);expect(result.success).toBe(true);expect(body.requestId).not.toBe(lostBody.requestId);
      const docs=await snapshot();expect(docs).toHaveLength(3);expect(new Set(docs.map(b=>b.numero)).size).toBe(3);expect(docs.every(b=>b.total===1000)).toBe(true);
      return {count:3,samePhoneAndNameAllowed:true,numbers:docs.map(b=>b.numero),newRequestId:true};
    });
    await record(viewport,'invalid-operation-id-rejected-before-model-and-write',async()=>{
      const docs=await snapshot(),calls=JSON.parse(fs.readFileSync(planFile)).calls;
      const response=await context.request.post(root+'/api/multiagent/message',{data:{...lostBody,requestId:'../not-a-uuid'}});expect(response.status()).toBe(400);
      expect(await snapshot()).toEqual(docs);expect(JSON.parse(fs.readFileSync(planFile)).calls).toBe(calls);
      return {status:400,noModelCall:true,noWrite:true};
    });
    await record(viewport,'two-concurrent-first-confirmations-create-only-one-new-budget',async()=>{
      const prior=await snapshot(),body={...lostBody,requestId:crypto.randomUUID()};
      const sends=[context.request.post(root+'/api/multiagent/message',{data:body,timeout:90000}),context.request.post(root+'/api/multiagent/message',{data:body,timeout:90000})];
      for(const pending of sends){const response=await pending;expect(response.status()).toBe(200);expect((await response.json()).success).toBe(true);}
      const docs=await snapshot();expect(docs).toHaveLength(4);
      expect(docs.filter(b=>prior.some(p=>p.id===b.id))).toEqual(prior);
      const created=docs.filter(b=>!prior.some(p=>p.id===b.id));expect(created).toHaveLength(1);expect(created[0].numero).toBe(4);expect(created[0].total).toBe(1000);
      expect((await db.collection('commercial_counters').doc('presupuestos').get()).data().lastNumber).toBe(4);
      return {countBefore:3,countAfter:4,concurrentFirstWrites:2,newBudgetId:created[0].id,numero:4,total:1000,priorDocumentsUnchanged:true};
    });
    await record(viewport,'saved-budget-document-visible-and-persistent-after-reload',async()=>{
      const doc=(await snapshot())[0],docPage=await context.newPage();
      await docPage.goto(root+'/presupuestos/'+doc.id+'/ver',{waitUntil:'networkidle',timeout:90000});
      const name=docPage.locator('#budget-print-area-wrapper').getByText(doc.client,{exact:true}).first();
      await expect(name).toBeVisible({timeout:60000});await docPage.reload({waitUntil:'networkidle',timeout:90000});await expect(name).toBeVisible({timeout:60000});
      await docPage.close();return {budgetId:doc.id,documentVisible:true,persistentAfterReload:true};
    });
    await context.close();for(const c of await db.listCollections())if(c.id!=='servicios')for(const d of(await c.get()).docs)await d.ref.delete();
  }
}catch(error){results.push({status:'NOT_ACCEPTED',error:error.stack});process.exitCode=1;}
finally{
  await browser.close();for(const c of await db.listCollections())for(const d of(await c.get()).docs)await d.ref.delete();
  if(fs.existsSync(planFile)&&JSON.parse(fs.readFileSync(planFile)).owner==='qa122')fs.unlinkSync(planFile);
  const cleanup=restore();await app.delete();fs.writeFileSync('docs/evidencias/122-chat-aceptacion-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,provider:'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS',results,cleanup},null,2)+'\n');
}
