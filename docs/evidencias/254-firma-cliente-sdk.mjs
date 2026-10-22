import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='725e62ba2f909578628fad47402d125ed9632c70';
const target=new URL('254-firma-cliente-sdk.json',import.meta.url);assert.equal(fs.existsSync(target),false,'Preserve');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY,'false');
const req=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts=req('typescript'),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-ak-producciones'},'qa254-only'),db=getFirestore(app);db.settings({ignoreUndefinedProperties:true});
const cookies=new Map(),hashes={},cases=[],context=new AsyncLocalStorage();
const clone=value=>JSON.parse(JSON.stringify(value));
let readBarrier=null,headerBefore=null,writeFails=false,notifications=[];
function load(file,names=null,globals={},dependencies={}){
  const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024**2});assert.equal(r.status,0,r.stderr);hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');
  const ast=ts.createSourceFile(file,r.stdout,ts.ScriptTarget.Latest,true);
  const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))):ast.statements;
  if(names)for(const name of names)assert.ok(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
  const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
  const module={exports:{}};new Function('require','module','exports',...Object.keys(globals),code)(name=>{assert.ok(Object.hasOwn(dependencies,name),`Unconfigured ${name}`);return dependencies[name];},module,module.exports,...Object.values(globals));return names?module.exports.__qa:module.exports;
}
const cookieAdapter={cookies:async()=>({get:key=>cookies.has(key)?{value:cookies.get(key)}:undefined,set:(key,value)=>cookies.set(key,value)})};
const session=load('src/lib/auth/session-token.ts',null,{}, {crypto,'next/headers':cookieAdapter,'@/lib/auth/session-constants':{SESSION_COOKIE_NAME:'ak_session'}});
const profile=load('src/lib/auth/perfiles.ts');
const team=load('src/lib/auth/equipo-de-la-fiesta.ts',null,{}, {'server-only':{},'@/lib/auth/perfiles':profile,'@/lib/auth/session-token':session,'@/app/actions/empleados':{getEmpleados:async()=>[]}});
const raw=async id=>{const doc=await db.collection('fiestas').doc(id).get();return doc.exists?doc.data():null;};
const portal=load('src/lib/security/portal-session.ts',null,{}, {crypto,'next/headers':cookieAdapter,'@/lib/fiesta/get-fiesta-raw':{getFiestaByIdRaw:raw}});
const redaction=load('src/lib/fiesta/recortar-para-afuera.ts',null,{}, {'@/lib/auth/perfiles':profile});
const permissions=load('src/lib/auth/require-session.ts',null,{}, {'@/lib/auth/session-token':session,'@/lib/auth/perfiles':profile});
const readData=async(file)=>{if(file==='presupuestos.json')return(await db.collection('presupuestos').get()).docs.map(d=>d.data());assert.match(file,/^fiestas\/qa254-party\.json$/);const value=await raw('qa254-party');if(readBarrier)await readBarrier();return value;};
const reader=load('src/app/actions/fiesta/fiesta.actions.ts',['getFiestaById'],{
  ...redaction,...team,readData,FIESTAS_DIR:'fiestas',LECTURA_COMPLETA:Symbol('qa254-full'),defaultModulosContratados:{},getHistorialFiestas:async()=>[],path,fs:{readFile:async()=>{throw new Error('QA254_NO_DISK_FALLBACK');}},
},{'@/lib/security/portal-session':portal,'@/lib/fiesta/recortar-para-afuera':redaction,'@/lib/auth/session-token':session});
const guards=load('src/app/actions/fiesta/fiesta.actions.ts',['esEquipoParaFiesta','requireFiestaWriteAccess'],{...team,...portal},{'@/lib/fiesta/get-fiesta-raw':{getFiestaByIdRaw:raw}});
const storage=load('src/lib/generic-json-store.ts',['getDbAdmin','sinIndefinidos','mutarDocumentoConTransaccion'],{}, {'./firebase/server':{dbAdmin:db}});
const secrets=load('src/lib/fiesta/get-fiesta-raw.ts',['preserveFiestaSecrets'],{getFiestaByIdRaw:raw,reponerLoRecortado:redaction.reponerLoRecortado});
const updater=load('src/lib/fiesta/actualizar-fiesta.ts',['fiestaUpdateQueues','acquireFiestaUpdateLock','actualizarFiesta'],{...guards,...storage,...secrets,...team,getFiestaById:raw,LECTURA_COMPLETA:Symbol('qa254-raw')});
const paymentFields=load('src/lib/fiesta/reponer-la-plata.ts');
const partial=load('src/app/actions/fiesta/fiesta.actions.ts',['CAMPOS_DE_PLATA_Y_CONTRATO','PAGO_DE_LA_COMPRA','mismoValor','reponerLaPlata','sinLaPlata','pideCambiarLaPlata','tocaLaPlata','validatePersonalAssignments','updateFiestaPartial'],{
  ...profile,...permissions,...guards,...redaction,...paymentFields,FIESTAS_DIR:'fiestas',
},{'@/lib/auth/session-token':session,'@/lib/fiesta/get-fiesta-raw':{getFiestaByIdRaw:raw},'@/lib/fiesta/recortar-para-afuera':redaction,'@/lib/fiesta/actualizar-fiesta':{actualizarFiesta:async(...args)=>writeFails?{success:false,error:'QA254_WRITE_FAILED'}:updater.actualizarFiesta(...args)}});
const calculations=load('src/lib/calculations.ts'),formal=load('src/lib/budget/formal-budget.ts');
const financial=load('src/lib/budget/financial-guardrails.ts',null,{}, {'@/lib/calculations':calculations,'@/lib/budget/formal-budget':formal});
const budgets=load('src/app/actions/presupuestos.ts',['PRESUPUESTOS_FILE','nivelDePresupuestos','sinCobros','getPresupuestoById'],{...profile,readData},{'@/lib/auth/session-token':session,'@/lib/firebase/server':{dbAdmin:db}});
const actions=load('src/app/actions/fiesta/documentos.actions.ts',['DEFAULT_DEPOSIT_AMOUNT','getContractSigningSummary','signContractDigitally'],{
  ...portal,...reader,...budgets,...financial,...session,
  actualizarFiesta:async(...args)=>writeFails?{success:false,error:'QA254_WRITE_FAILED'}:updater.actualizarFiesta(...args),
  headers:async()=>{if(headerBefore)await headerBefore();return new Headers({'x-real-ip':'192.0.2.254'});},
  createNotification:async value=>{notifications.push(clone(value));return{success:true};},
},{crypto,'./fiesta.actions':partial});
const id='qa254-party',budgetId='qa254-budget',textA='Contrato ficticio QA254 version A. Total acordado100000.',textB='Contrato ficticio QA254 version B. Total acordado120000.';
const digest=text=>crypto.createHash('sha256').update(text).digest('hex');
async function reset(){
  cookies.clear();readBarrier=null;headerBefore=null;writeFails=false;notifications=[];
  await db.collection('presupuestos').doc(budgetId).set({id:budgetId,estado:'Aceptado',invitadosCantidad:25,invitadosAdultos:25,invitadosNinos:0,invitadosAdolescentes:0,costoTotalEstimado:100000,totalConDescuento:100000,totalFinal:100000,senia:30000,ajusteAnualActivo:false,ajusteAnualPorcentaje:0,pagosCliente:[],itemsPresupuestados:[{idServicioCatalogo:'qa254-service',nombreServicio:'Servicio QA254',cantidad:1,precioUnitario:100000,precioUnitarioPresupuesto:100000,costoTotalItem:100000}]});
  await db.collection('fiestas').doc(id).set({id,presupuestoId:budgetId,estado:'Planificando',configuracion:{nombreEvento:'Evento ficticio QA254',nombreLugar:'Lugar QA254',fechaEvento:'2027-08-08'},contratoServicioTexto:textA,contratoDatos:{planPagos:{activo:false}},contratoFirmaInfo:{isSigned:false},clientPortalSettings:{enabled:true,accessKey:'key-qa254'},personalAsignado:[{empleadoId:'qa254-worker',eventSalary:3000}]});
  cookies.set('ak_portal_session',portal.createPortalSession(id,'key-qa254'));
}
const check=(name,pass,observed)=>cases.push({id:name,pass:Boolean(pass),observed});
const sign=(name='Firmante QA254',accepted=false)=>actions.signContractDigitally(id,name,accepted,digest(textA));
let unexpected,cleanup;
try{
  await reset();cookies.clear();const unauthorized=await actions.getContractSigningSummary(id);check('no-portal-session-summary-denied',unauthorized.success===false,unauthorized);
  await reset();const anonymous=await actions.getContractSigningSummary(id);check('portal-only-client-gets-own-financial-summary',anonymous.success&&anonymous.summary?.totalEstimado===100000&&anonymous.summary?.senia===30000&&anonymous.summary?.saldo===70000,{result:anonymous,budgetExists:(await db.collection('presupuestos').doc(budgetId).get()).exists,portalValid:await portal.verifyPortalSession(id)});
  cookies.set('ak_session',await session.createSignedSessionToken({userId:'qa254-client',email:'client@qa.invalid',role:'client',perfil:'cliente'},600));const client=await actions.getContractSigningSummary(id);check('client-app-session-gets-own-financial-summary',client.success&&client.summary?.totalEstimado===100000&&client.summary?.senia===30000,{result:client,session:await session.verifySession()});
  cookies.set('ak_session',await session.createSignedSessionToken({userId:'qa254-owner',email:'owner@qa.invalid',role:'admin',perfil:'dueno'},600));const owner=await actions.getContractSigningSummary(id);check('owner-session-financial-positive-control',owner.success&&owner.summary?.totalEstimado===100000&&owner.summary?.senia===30000&&owner.summary?.saldo===70000,owner);
  await reset();await db.collection('fiestas').doc(id).update({'contratoDatos.planPagos.activo':true});const plan=await sign();check('payment-plan-needs-acceptance',plan.success===false&&!(await raw(id)).firmaDigitalConstancia,plan);
  await reset();const positive=await sign();const signed=await raw(id);check('client-signature-persists-without-booking-or-charge',positive.success&&signed.firmaDigitalConstancia?.signedBy==='Firmante QA254'&&signed.firmaDigitalConstancia?.textoHuella===digest(textA)&&signed.estado==='Planificando'&&signed.contratoFirmaInfo.isSigned===false&&(await db.collection('presupuestos').doc(budgetId).get()).data().pagosCliente.length===0,{result:positive,party:signed});
  const before=JSON.stringify(signed.firmaDigitalConstancia),again=await sign('Otro nombre QA254');check('sequential-signature-preserves-first-constancia',again.success&&JSON.stringify((await raw(id)).firmaDigitalConstancia)===before&&notifications.length===1,{result:again,notifications:notifications.length});
  const altered=await partial.updateFiestaPartial(id,{firmaDigitalConstancia:{signedBy:'Reemplazo desde parcial',signedAt:'1900-01-01',textoHuella:'falso'}},{allowPortal:true});check('generic-client-patch-cannot-rewrite-server-signature',(!altered.success||JSON.stringify((await raw(id)).firmaDigitalConstancia)===before),{result:altered,stored:(await raw(id)).firmaDigitalConstancia});
  await reset();writeFails=true;const failed=await sign();writeFails=false;check('storage-failure-not-reported-signed',failed.success===false&&!(await raw(id)).firmaDigitalConstancia,failed);
  await reset();const viewed=await reader.getFiestaById(id);await db.collection('fiestas').doc(id).update({contratoServicioTexto:textB});const changed=await sign();const changedStored=(await raw(id)).firmaDigitalConstancia;check('signature-does-not-acknowledge-unseen-contract-version',changed.success===false||changedStored?.textoHuella===digest(viewed.contratoServicioTexto),{viewedText:viewed.contratoServicioTexto,result:changed,stored:changedStored,currentText:textB});
  await reset();
  const [first,second]=await Promise.all([sign('Firmante A'),sign('Firmante B')]);
  const final=await raw(id);check('concurrent-signers-preserve-one-committed-constancia',first.success&&second.success&&['Firmante A','Firmante B'].includes(final.firmaDigitalConstancia?.signedBy)&&notifications.length===1,{first,second,stored:final.firmaDigitalConstancia,notifications:notifications.length});
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{
  await db.collection('fiestas').doc(id).delete();await db.collection('presupuestos').doc(budgetId).delete();cleanup={fiestas:(await db.collection('fiestas').get()).size,presupuestos:(await db.collection('presupuestos').get()).size};await deleteApp(app);
  const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,unexpected,cleanup,summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},realServices:false,appEdited:false,
    scope:'Actual contract summary/sign action, getFiestaById, updateFiestaPartial, permission/role and HMAC session modules, budget reader, generic updater/transactions against real Firestore Admin SDK demo. Cookie/headers/notifications/readData transport controlled; no HTTP/native page/PDF/physical contract, legal validity or real charge. Constancia is explicitly NOT physical booking acceptance.'};fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,unexpected,cleanup,failures:cases.filter(c=>!c.pass)}));if(!unexpected&&receipt.summary.fail)process.exitCode=1;
}
