import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='fa3b492b8f1d6a77433a92f4d63b665cfea3747c';
const target=new URL('205-portal-nativo-aislado.json',import.meta.url);
assert.equal(fs.existsSync(target),false,'Preserve receipt');
assert.ok(os.freemem()>=768*1024**2,'Lightweight bundle/native QA needs768MiB');
assert.equal(spawnSync('git',['diff','--quiet',source,'--','src','tailwind.config.ts'],{cwd:root}).status,0,'Freeze app sources');
const req=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const tool=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/native205/package.json');
const esbuild=tool('esbuild'),postcss=req('postcss'),tailwind=req('tailwindcss'),ts=req('typescript');
const {chromium}=req('@playwright/test');
const qa=fs.mkdtempSync(path.join(os.tmpdir(),'ak-qa-205-native-'));
const artifacts=fileURLToPath(new URL('205-nativo-artifacts/',import.meta.url));fs.mkdirSync(artifacts,{recursive:true});
const cases=[],blocked=[],pageErrors=[],hashes={};let server,browser,unexpected;
const seed={id:'qa205-party',presupuestoId:'qa205-budget',configuracion:{nombreEvento:'Fiesta ficticia QA205 - una noche para celebrar juntos',clienteNombre:'Cliente QA205',fechaEvento:'2026-12-20',horaInicio:'20:00',nombreLugar:'Salon ficticio QA205',invitadosEstimados:25,tipoCelebracion:'Boda'},
  clientPortalSettings:{enabled:true,accessKey:'qa205-key',accessPhase:'organizacion',musica:{visible:true},menu:{visible:true},cuentasBancarias:[1,2,3].map(n=>({banco:`Banco QA205-${n}`,titular:`Titular ficticio ${n}`,numero:`CUENTA-QA205-${n}`}))},
  clientePortalExperience:{heroImageUrl:'/qa-logo.png'},contratoFirmaInfo:{isSigned:true},contratoDatos:{ajusteAnualPorcentaje:0,fechaFirmaContrato:'2026-10-21'},listaMusicaPortal:{imprescindibles:[]},invitados:[],timeline:[],reuniones:[],clientPaymentNotifications:[],clientMenuChangeRequests:[],clientServiceChangeRequests:[]};
const budget={id:'qa205-budget',clienteNombre:'Cliente QA205',invitadosCantidad:25,totalConDescuento:1000,totalFinal:1000,costoTotalEstimado:1000,ajusteAnualPorcentaje:0,pagosCliente:[{id:'paid',monto:100,estadoPago:'confirmado'}],itemsPresupuestados:[{idServicioCatalogo:'menu',nombreServicio:'Menu ficticio QA205',cantidad:25,precioUnitario:40,costoTotalItem:1000,categoriaServicio:'Catering'}]};
const actions=`
const persist=()=>localStorage.setItem('qa205',JSON.stringify(window.__qa205));
export async function initializePortalSession(){return {success:true};}
export async function addClientMusicSuggestion(id,key,value){window.__qa205.listaMusicaPortal[key]??=[];window.__qa205.listaMusicaPortal[key].push(value);persist();return {success:true};}
export async function updateClientePortalExperience(id,patch){Object.assign(window.__qa205.clientePortalExperience,patch);persist();return {success:true};}
export async function submitClientMenuChangeRequest(id,payload){window.__qa205Calls.push({type:'menu',payload});return {success:true,requestId:'qa205-request'};}
export async function submitClientServiceAddRequest(id,payload){window.__qa205Calls.push({type:'service',payload});return {success:true,requestId:'qa205-service'};}
export async function submitClientPayment(){window.__qa205Calls.push({type:'payment'});return {success:false,error:'QA205_ONLY_CONTROLLED_ADAPTER'};}
export async function checkDateAvailability(){return {success:true,available:true};}
export async function cancelServicesOrParty(){return {success:false,error:'QA205_NO_CONTRACT_OPERATION'};}
export async function changeEventDate(){return {success:false,error:'QA205_NO_CONTRACT_OPERATION'};}
`;
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import Portal from '@/app/portal/c/[accessKey]/PublicPortalClientExperience';
window.__qa205=JSON.parse(localStorage.getItem('qa205')||'null')||${JSON.stringify(seed)};window.__qa205Calls=[];
createRoot(document.getElementById('root')).render(<Portal fiesta={window.__qa205} presupuesto={${JSON.stringify(budget)}} companyName="Empresa ficticia QA205" companyContact="59899000205" ajusteAnualPorcentaje={0} catalogServices={[{id:'extra',nombre:'Extra ficticio QA205',precioVenta:200,calculationMethod:'fijo'}]}/>);`;
const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});
try{
  const built=await esbuild.build({absWorkingDir:root,stdin:{contents:entry,loader:'tsx',resolveDir:root,sourcefile:'qa205-entry.tsx'},bundle:true,platform:'browser',format:'iife',target:['chrome120'],outfile:path.join(qa,'app.js'),write:true,metafile:true,
    nodePaths:['C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules'],alias:{'@':path.join(root,'src')},define:{'process.env.NODE_ENV':'"production"'},jsx:'automatic',
    plugins:[{name:'qa205-no-real-services',setup(build){
      build.onResolve({filter:/^@\/app\/actions\//},args=>({path:args.path,namespace:'qa205'}));
      build.onResolve({filter:/^@\/components\/(public-footer|legal\/AvisoDeDatos|decoracion\/SalonDelClienteEn3D)$/},args=>({path:args.path,namespace:'qa205'}));
      build.onLoad({filter:/.*/,namespace:'qa205'},args=>({loader:'js',contents:args.path.startsWith('@/app/actions/')?actions:'export const PublicFooter=()=>null;export const AvisoDeDatos=()=>null;export const SalonDelClienteEn3D=()=>null;'}));
    }}]});
  const files=Object.keys(built.metafile.inputs).filter(name=>!name.startsWith('qa205:')&&name!=='qa205-entry.tsx').map(name=>path.resolve(root,name));
  assert.ok(!files.some(name=>/src[\\/]app[\\/]actions|firebase-admin|genkit/.test(name)),'No server integration in native harness');
  const contents=[];
  for(const file of files.filter(file=>file.startsWith(path.join(root,'src')))){
    const text=fs.readFileSync(file,'utf8');hashes[path.relative(root,file).replaceAll('\\','/')]=crypto.createHash('sha256').update(text).digest('hex');contents.push({raw:text,extension:path.extname(file).slice(1)||'tsx'});
  }
  const configText=fs.readFileSync(path.join(root,'tailwind.config.ts'),'utf8');
  const configModule={exports:{}};
  const configJS=ts.transpileModule(configText,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  new Function('require','exports','module',configJS)(req,configModule.exports,configModule);
  const cssSource=fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8');
  const css=await postcss([tailwind({...configModule.exports.default,content:contents})]).process(cssSource,{from:path.join(root,'src/app/globals.css')});
  hashes['src/app/globals.css']=crypto.createHash('sha256').update(cssSource).digest('hex');hashes['tailwind.config.ts']=crypto.createHash('sha256').update(configText).digest('hex');
  fs.writeFileSync(path.join(qa,'style.css'),css.css);fs.writeFileSync(path.join(qa,'index.html'),'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body class="font-body"><div id="root"></div><script src="/app.js"></script></body></html>');
  server=http.createServer((request,response)=>{const route=new URL(request.url,'http://127.0.0.1').pathname;const file=route==='/qa-logo.png'?path.join(root,'public/logo_ak_producciones.png'):route==='/app.js'?path.join(qa,'app.js'):route==='/style.css'?path.join(qa,'style.css'):path.join(qa,'index.html');response.setHeader('content-type',route.endsWith('.js')?'text/javascript':route.endsWith('.css')?'text/css':route.endsWith('.png')?'image/png':'text/html');response.end(fs.readFileSync(file));});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(20605,'127.0.0.1',resolve);});
  assert.ok(os.freemem()>=512*1024**2,'Browser needs512MiB');
  browser=await chromium.launch({headless:true});
  for(const [name,viewport]of Object.entries({PC:{width:1365,height:900},Pixel7:{width:390,height:844}})){
    const context=await browser.newContext({viewport,serviceWorkers:'block',timezoneId:'America/Montevideo'});
    await context.route('**/*',async route=>{const url=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(url.hostname)){blocked.push(url.origin);await route.abort();}else await route.continue();});
    const page=await context.newPage();page.on('pageerror',error=>pageErrors.push({viewport:name,error:String(error)}));
    await page.goto('http://127.0.0.1:20605/qa205/portal');await page.getByRole('button',{name:'Personalizar portada',exact:true}).waitFor();
    await page.screenshot({path:path.join(artifacts,`${name}-inicio.png`),fullPage:false});
    check(`${name}-current-component-visible`,await page.getByText(seed.configuracion.nombreEvento,{exact:true}).isVisible(),{});
    const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
    check(`${name}-no-horizontal-overflow`,dimensions.scroll<=dimensions.width+1,dimensions);
    check(`${name}-all-three-bank-accounts-visible`,await page.getByText('CUENTA-QA205-3',{exact:true}).isVisible(),{});
    await page.getByRole('button',{name:'Personalizar portada',exact:true}).click();
    const close=page.getByRole('button',{name:'Cerrar',exact:true});await close.waitFor();const closeBox=await close.boundingBox();
    check(`${name}-cover-close-reachable`,closeBox&&closeBox.y>=0&&closeBox.y+closeBox.height<=viewport.height,closeBox);
    await page.screenshot({path:path.join(artifacts,`${name}-portada.png`),fullPage:false});await close.click();
    const music=page.getByPlaceholder('Agregar canción importante');await music.fill(`Cancion nativa ${name}`);await page.getByRole('button',{name:'Agregar',exact:true}).click();
    check(`${name}-music-handler-feedback`,await page.getByText('Canción agregada. AK ya la verá dentro del evento.',{exact:true}).isVisible(),{});
    await page.reload();await music.waitFor();
    check(`${name}-music-survives-controlled-adapter-reload`,await page.getByText(`Cancion nativa ${name}`,{exact:true}).isVisible(),{});
    await page.getByRole('button',{name:'Cancelar servicios o fiesta',exact:true}).click();
    check(`${name}-cancellation-opens-without-real-operation`,await page.getByRole('button',{name:'Aceptar y Continuar',exact:true}).isVisible(),{});await page.getByRole('button',{name:'Cerrar',exact:true}).click();
    await page.getByRole('button',{name:'Cambiar fecha del evento',exact:true}).click();await page.locator('input[type="date"]').fill('2026-12-21');
    await page.getByText('¡Fecha disponible!',{exact:true}).waitFor();
    check(`${name}-date-check-feedback-from-controlled-adapter`,await page.getByRole('button',{name:'Aceptar y Continuar',exact:true}).isEnabled(),{});await page.getByRole('button',{name:'Cerrar',exact:true}).click();
    await page.getByRole('button',{name:'Informar pago',exact:true}).last().click();
    check(`${name}-payment-form-known-A7-native-corroboration`,await page.locator('input[type="file"]').count()>0,{fileInputs:await page.locator('input[type="file"]').count(),knownOrder:'210-A7',notNewDefect:true});
    await page.screenshot({path:path.join(artifacts,`${name}-pagos.png`),fullPage:false});await context.close();
  }
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{
  if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  const receipt={source,checkedAt:new Date().toISOString(),qa,hashes,cases,unexpected,pageErrors,blockedOrigins:[...new Set(blocked)],summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},appEdited:false,realServices:false,esbuildVersion:esbuild.version,
    limits:'Native Chromium screenshots/pointer/inputs/reload with current React component and actual Tailwind/global CSS, built ONLY isolated client bundle. Server actions, footer/legal and3D replaced explicitly; persistence localStorage of fictitious fixture. NO Next build/routes/HTTP auth/backend/SSR/actual fonts/provider/whole-app/3D acceptance. Existing A7 corroboration not a new defect. Own server20605/browser closed.'};
  fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,unexpected,pageErrors,failures:cases.filter(c=>!c.pass)}));
  if(receipt.summary.fail&&!unexpected)process.exitCode=1;
}
