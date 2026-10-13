import fs from 'node:fs';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {chromium,devices,expect} from '@playwright/test';
import {fixtureGuard} from './110-fixture-guard.mjs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Owned demo only');
const root='http://127.0.0.1:3301',planFile='docs/evidencias/121-model-plan.generated.json';
if(fs.existsSync(planFile))throw new Error('Prior plan active');
const restore=fixtureGuard(),app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa121'),db=app.firestore();
const browser=await chromium.launch({headless:true}),results=[];
function plan(name){fs.writeFileSync(planFile,JSON.stringify({owner:'qa121',index:0,calls:0,steps:[
  {accion:'armar_presupuesto',argumentos:{nombreCliente:name,telefono:'099000121',tipoEvento:'Boda',fechaEvento:'2027-08-08',invitados:50,servicios:['DJ QA121']}},
  {accion:'terminar',argumentos:{resumen:'Fin'}}
]}));}
function clearArrays(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){
  const file=folder+'/'+item.name;
  if(item.isDirectory())clearArrays(file);else if(item.name.endsWith('.json')){try{if(Array.isArray(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))))fs.writeFileSync(file,'[]\n');}catch{}}
}}
async function snapshot(){return(await db.collection('presupuestos').get()).docs.map(d=>({id:d.id,number:d.data().numeroPresupuesto,total:d.data().totalConDescuento,client:d.data().clienteNombre})).sort((a,b)=>a.id.localeCompare(b.id));}
try{
  for(const c of await db.listCollections())if(!(await c.limit(1).get()).empty)throw new Error('Empty emulator required');
  clearArrays('data');clearArrays('src/data');
  await db.collection('servicios').doc('qa121-dj').set({id:'qa121-dj',nombre:'DJ QA121',categoria:'Discoteca',precioBase:1000,calculationMethod:'fijo',activo:true});
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
    const message='Arma el presupuesto QA121 ACK '+viewport;
    plan('QA121 ACK '+viewport);
    let originalBody,serverResult;
    let resolveDrop,rejectDrop;
    const dropped=new Promise((resolve,reject)=>{resolveDrop=resolve;rejectDrop=reject;});
    await page.route('**/api/multiagent/message',async route=>{
      try{
        originalBody=route.request().postDataJSON();
        const http=await route.fetch({timeout:90000});expect(http.status()).toBe(200);
        serverResult=await http.json();expect(serverResult.success).toBe(true);
        const stored=await snapshot();expect(stored).toHaveLength(1);expect(stored[0].total).toBe(1000);
        await route.abort('failed');resolveDrop(stored);
      }catch(error){rejectDrop(error);await route.abort('failed');}
    },{times:1});
    await page.getByPlaceholder('Hablar con General...').fill(message);
    await page.getByTitle('Enviar',{exact:true}).click();
    const before=await dropped;
    await expect(page.getByText('No pude responder ahora. No marqué nada como hecho.',{exact:true}).last()).toBeVisible({timeout:20000});
    await page.screenshot({path:`docs/evidencias/121-ack-perdido-${viewport}.png`,fullPage:false});
    // Replay the exact transport payload, not a deliberately new user quotation.
    plan('QA121 ACK '+viewport);
    const replay=await context.request.post(root+'/api/multiagent/message',{data:originalBody,timeout:90000});
    expect(replay.status()).toBe(200);const replayResult=await replay.json();expect(replayResult.success).toBe(true);
    const after=await snapshot();
    results.push({viewport,status:after.length===before.length?'PASS':'DEFECT_REPRODUCED',applicationSourceSha:process.env.COMMIT_SHA,
      case:'lost-response-after-real-save-and-identical-transport-retry',before,after,originalBody,serverResult,replayResult,
      expectedCount:1,actualCount:after.length,errorTextVisible:true,provider:'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS'});
    console.log(JSON.stringify({viewport,status:results.at(-1).status,before:before.length,after:after.length,ids:after.map(b=>b.id)}));
    await context.close();
    for(const c of await db.listCollections())if(c.id!=='servicios')for(const d of(await c.get()).docs)await d.ref.delete();
  }
}catch(error){results.push({status:'QA_NOT_ACCEPTED',error:error.stack});process.exitCode=1;}
finally{
  await browser.close();for(const c of await db.listCollections())for(const d of(await c.get()).docs)await d.ref.delete();
  if(fs.existsSync(planFile)&&JSON.parse(fs.readFileSync(planFile)).owner==='qa121')fs.unlinkSync(planFile);
  const cleanup=restore();await app.delete();
  fs.writeFileSync('docs/evidencias/121-chat-ack-resultados.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,results,cleanup},null,2)+'\n');
}
