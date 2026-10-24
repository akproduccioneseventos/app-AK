import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
const target=new URL('285-aprobacion-sdk.json',import.meta.url);assert(!fs.existsSync(target),'Preserve');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY,'false');
const req=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts=req('typescript'),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-ak-producciones'},'qa285'),db=getFirestore(app);db.settings({ignoreUndefinedProperties:true});
const partyId='qa285-party',budgetId='qa285-budget',notificationId='qa285-notification',hashes={},cases=[],clone=x=>JSON.parse(JSON.stringify(x));
function load(file,names=null,globals={},deps={}){
 const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:5*1024**2});assert.equal(r.status,0,r.stderr);hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');
 const ast=ts.createSourceFile(file,r.stdout,ts.ScriptTarget.Latest,true);const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))):ast.statements;
 if(names)for(const name of names)assert(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
 const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
 const module={exports:{}};new Function('require','module','exports',...Object.keys(globals),code)(id=>{assert(Object.hasOwn(deps,id),`Unknown ${id}`);return deps[id];},module,module.exports,...Object.values(globals));return names?module.exports.__qa:module.exports;
}
const profiles=load('src/lib/auth/perfiles.ts');
const permissions=load('src/lib/auth/require-session.ts',null,{}, {'@/lib/auth/perfiles':profiles,'@/lib/auth/session-token':{verifySession:async()=>({success:true,user:{userId:'qa285-owner',perfil:'dueno',role:'admin'}})}});
const calculations=load('src/lib/calculations.ts'),formal=load('src/lib/budget/formal-budget.ts');
const financial=load('src/lib/budget/financial-guardrails.ts',null,{}, {'@/lib/calculations':calculations,'@/lib/budget/formal-budget':formal});
const duplicates=load('src/lib/budget/pago-duplicado.ts',null,{}, {'@/lib/budget/financial-guardrails':financial}),mutex=load('src/lib/mutex.ts');
const storage=load('src/lib/generic-json-store.ts',['getDbAdmin','sinIndefinidos','mutarDocumentoConTransaccion'],{}, {'./firebase/server':{dbAdmin:db}});
const raw=async()=>{const d=await db.collection('fiestas').doc(partyId).get();return d.exists?d.data():null;};
const redaction=load('src/lib/fiesta/recortar-para-afuera.ts',null,{}, {'@/lib/auth/perfiles':profiles});
const secrets=load('src/lib/fiesta/get-fiesta-raw.ts',['preserveFiestaSecrets'],{getFiestaByIdRaw:raw,reponerLoRecortado:redaction.reponerLoRecortado});
const access=load('src/app/actions/fiesta/fiesta.actions.ts',['requireFiestaWriteAccess'],{esEquipoParaFiesta:async()=>true,verifyPortalSession:async()=>false});
const updater=load('src/lib/fiesta/actualizar-fiesta.ts',['fiestaUpdateQueues','acquireFiestaUpdateLock','actualizarFiesta'],{...access,...storage,...secrets,getFiestaById:raw,LECTURA_COMPLETA:Symbol('qa285-full'),quienEsElEquipo:async()=>()=>true});
const data=load('src/lib/data-service.ts',['mutateDataItem'],{validateCollectionMutationInput:(file,collection,id)=>{assert.equal(file,'presupuestos.json');assert.equal(collection,'presupuestos');assert.equal(id,budgetId);},shouldUseLocalJsonOnly:()=>false,cleanCollectionItem:clone,refreshCollectionFallback:async()=>{}},{'./firebase/server':{dbAdmin:db}});
let notifications=[];
const budgets=load('src/app/actions/presupuestos.ts',['PRESUPUESTOS_FILE','SIN_BASE_DE_DATOS','shouldDedupePaymentReference','cambiarCobrosDelPresupuesto','addPagoToPresupuesto'],{
 ...profiles,...permissions,...duplicates,...financial,...data,presupuestosMutex:new mutex.AsyncMutex(),
 syncLinkedFiesta:async()=>{},createNotification:async n=>{notifications.push({kind:'budget',...clone(n)});return{success:true};},
});
const transitions=load('src/lib/client-portal/payment-notifications.ts');let paymentWrapper=(...args)=>budgets.addPagoToPresupuesto(...args);
const actions=load('src/app/actions/fiesta/portal.actions.ts',['approveClientPayment','rejectClientPayment'],{
 ...profiles,...permissions,...transitions,getFiestaById:raw,actualizarFiesta:updater.actualizarFiesta,
 addPagoToPresupuesto:(...args)=>paymentWrapper(...args),sanitizeActionError:e=>String(e.message||e),
 notifyClientPaymentApproved:async(_id,n)=>notifications.push({kind:'approved',id:n.id}),notifyClientPaymentRejected:async(_id,n)=>notifications.push({kind:'rejected',id:n.id}),
});
async function reset(pagosCliente=[]){notifications=[];paymentWrapper=(...args)=>budgets.addPagoToPresupuesto(...args);await db.collection('fiestas').doc(partyId).set({id:partyId,presupuestoId:budgetId,configuracion:{nombreEvento:'Evento ficticio QA285'},clientPaymentNotifications:[{id:notificationId,monto:1000,estado:'pendiente',fecha:'2026-10-23'}]});await db.collection('presupuestos').doc(budgetId).set({id:budgetId,clienteNombre:'Persona ficticia QA285',estado:'Aceptado',invitadosCantidad:25,invitadosAdultos:25,invitadosNinos:0,invitadosAdolescentes:0,costoTotalEstimado:10000,totalConDescuento:10000,totalFinal:10000,ajusteAnualActivo:false,ajusteAnualPorcentaje:0,pagosCliente,itemsPresupuestados:[{idServicioCatalogo:'qa285-service',nombreServicio:'Servicio QA285',cantidad:1,precioUnitario:10000,precioUnitarioPresupuesto:10000,costoTotalItem:10000}]});}
const budget=async()=>(await db.collection('presupuestos').doc(budgetId).get()).data();const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});let unexpected,cleanup;
try{
 await reset();const baseline=await actions.approveClientPayment(partyId,notificationId);const paid=await budget();check('SDK-positive-approval-confirms-once',baseline.success&&paid.pagosCliente.length===1&&paid.pagosCliente[0].monto===1000&&(await raw()).clientPaymentNotifications[0].estado==='aprobado',{result:baseline,party:await raw(),budget:paid});
 await reset([{id:'qa285-other-payment',monto:9500,estadoPago:'confirmado',fecha:'2026-10-23',metodoPago:'Efectivo'}]);let entered,release;const enteredGate=new Promise(r=>entered=r),releaseGate=new Promise(r=>release=r);let calls=0,firstBudgetResult;
 paymentWrapper=async(...args)=>{calls++;const result=await budgets.addPagoToPresupuesto(...args);if(calls===1){firstBudgetResult=clone(result);entered();await releaseGate;}return result;};
 const a=actions.approveClientPayment(partyId,notificationId);const timer=setTimeout(()=>release(),15000);
 try{await enteredGate;assert.equal(firstBudgetResult.success,false,'First actual budget must reject above saldo');await db.collection('presupuestos').doc(budgetId).update({pagosCliente:[]});const b=await actions.approveClientPayment(partyId,notificationId);release();const first=await a;const finalParty=await raw(),finalBudget=await budget();check('SDK-failed-approval-does-not-undo-successful-same-reference-retry',!first.success&&b.success&&finalBudget.pagosCliente.length===1&&finalBudget.pagosCliente[0].monto===1000&&finalParty.clientPaymentNotifications[0].estado==='aprobado',{firstBudgetResult,first,retry:b,party:finalParty,budget:finalBudget,notifications});}finally{clearTimeout(timer);release();await a;}
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{await db.collection('fiestas').doc(partyId).delete();await db.collection('presupuestos').doc(budgetId).delete();cleanup={fiestas:(await db.collection('fiestas').get()).size,presupuestos:(await db.collection('presupuestos').get()).size};await deleteApp(app);const result={source,hashes,cases,unexpected,cleanup,summary:{total:cases.length,pass:cases.filter(x=>x.pass).length,fail:cases.filter(x=>!x.pass).length},appEdited:false,scope:'Actual approve/reject, actual budget payment action/validation/normalizer/dedup, actual fiesta updater and data-service/generic Firestore transactions with real AdminSDK demo. Actor identity/event-access predicate, notification/sync sinks and delayed reply controlled. Interim removal of other fixture payment by SDK is scheduling input, NOT tested delete-payment UI. NO HTTP, real accounts/messages/charges or production.'};fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({source,summary:result.summary,unexpected,cleanup,cases}));if(!unexpected&&result.summary.fail)process.exitCode=1;}
