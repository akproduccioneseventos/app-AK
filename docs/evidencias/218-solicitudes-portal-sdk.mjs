import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de';
const target=new URL('218-solicitudes-portal-sdk.json',import.meta.url);
assert.equal(fs.existsSync(target),false,'Preserve SDK receipt');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY,'false');
const req=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts=req('typescript');
const {initializeApp,deleteApp}=req('firebase-admin/app');
const {getFirestore}=req('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-ak-producciones'},'qa218-only');
const db=getFirestore(app);db.settings({ignoreUndefinedProperties:true});
const hashes={},cases=[];
const clone=value=>JSON.parse(JSON.stringify(value));
function load(file,names=null,globals={},dependencies={}){
  const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024**2});assert.equal(r.status,0,r.stderr);
  hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');
  const ast=ts.createSourceFile(file,r.stdout,ts.ScriptTarget.Latest,true);
  const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))):ast.statements;
  if(names)for(const name of names)assert.ok(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
  const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
  const module={exports:{}};const localRequire=name=>{assert.ok(Object.hasOwn(dependencies,name),`Unconfigured ${name}`);return dependencies[name];};
  new Function('require','module','exports',...Object.keys(globals),code)(localRequire,module,module.exports,...Object.values(globals));
  return names?module.exports.__qa:module.exports;
}
const profile=load('src/lib/auth/perfiles.ts');
const user={userId:'qa218-owner',perfil:'dueno',email:'owner@qa.invalid'};
const guards=load('src/lib/auth/require-session.ts',null,{}, {'@/lib/auth/session-token':{verifySession:async()=>({success:true,user})},'@/lib/auth/perfiles':profile});
const calculations=load('src/lib/calculations.ts');
const formal=load('src/lib/budget/formal-budget.ts');
const financial=load('src/lib/budget/financial-guardrails.ts',null,{}, {'@/lib/calculations':calculations,'@/lib/budget/formal-budget':formal});
const canonical=load('src/lib/budget/recalcular-presupuesto.ts',null,{}, {'@/lib/calculations':calculations,'@/lib/budget/financial-guardrails':financial});
const storage=load('src/lib/generic-json-store.ts',['getDbAdmin','sinIndefinidos','mutarDocumentoConTransaccion'],{}, {'./firebase/server':{dbAdmin:db}});
const raw=async id=>{const doc=await db.collection('fiestas').doc(id).get();return doc.exists?doc.data():null;};
const access=load('src/app/actions/fiesta/fiesta.actions.ts',['requireFiestaWriteAccess'],{esEquipoParaFiesta:async()=>true,verifyPortalSession:async()=>false});
const redaction=load('src/lib/fiesta/recortar-para-afuera.ts',null,{}, {'@/lib/auth/perfiles':profile});
const secrets=load('src/lib/fiesta/get-fiesta-raw.ts',['preserveFiestaSecrets'],{getFiestaByIdRaw:raw,reponerLoRecortado:redaction.reponerLoRecortado});
const updater=load('src/lib/fiesta/actualizar-fiesta.ts',['fiestaUpdateQueues','acquireFiestaUpdateLock','actualizarFiesta'],{
  ...access,...storage,...secrets,getFiestaById:raw,LECTURA_COMPLETA:Symbol('qa218-full'),quienEsElEquipo:async()=>()=>true,
});
const data=load('src/lib/data-service.ts',['mutateDataItem'],{
  validateCollectionMutationInput:(file,collection,id)=>{assert.equal(file,'presupuestos.json');assert.equal(collection,'presupuestos');assert.equal(id,'qa218-budget');},
  shouldUseLocalJsonOnly:()=>false,cleanCollectionItem:value=>clone(value),refreshCollectionFallback:async()=>{},
},{'./firebase/server':{dbAdmin:db}});
const mutation=load('src/lib/budget/mutar-presupuesto.ts',null,{}, {'@/lib/data-service':data});
let partyBefore=null,failNextBudget=false;
const actions=load('src/app/actions/fiesta/portal.actions.ts',['tomarSolicitud','devolverAPendiente','aprobarConPresupuesto','approveClientMenuChangeRequest','approveClientServiceChangeRequest'],{
  ...profile,...guards,...canonical,
  getFiestaById:raw,
  actualizarFiesta:async(...args)=>{if(partyBefore)await partyBefore();return updater.actualizarFiesta(...args);},
  mutarPresupuesto:async(...args)=>{if(failNextBudget){failNextBudget=false;throw new Error('QA218_BUDGET_WRITE_FAILED_BEFORE_COMMIT');}return mutation.mutarPresupuesto(...args);},
  sanitizeActionError:error=>error instanceof Error?error.message:String(error),
});
const partyId='qa218-party',budgetId='qa218-budget';
async function reset(){
  partyBefore=null;failNextBudget=false;
  await db.collection('presupuestos').doc(budgetId).set({id:budgetId,estado:'Borrador',invitadosCantidad:25,invitadosAdultos:25,invitadosNinos:0,invitadosAdolescentes:0,totalConDescuento:1000,costoTotalEstimado:1000,totalFinal:1000,pagosCliente:[],ajusteAnualPorcentaje:0,
    itemsPresupuestados:[{idServicioCatalogo:'qa218-menu',nombreServicio:'Menu QA218',calculationMethod:'porPersona',cantidad:25,precioUnitario:40,precioUnitarioPresupuesto:40,costoTotalItem:1000}]});
  await db.collection('fiestas').doc(partyId).set({id:partyId,presupuestoId:budgetId,configuracion:{nombreEvento:'Evento ficticio218',invitadosEstimados:25},contratoFirmaInfo:{isSigned:false},
    clientMenuChangeRequests:[{id:'qa218-menu-A',status:'pendiente',adultosDelta:2,ninosAdolescentesDelta:0,montoAdicional:80},{id:'qa218-menu-B',status:'pendiente',adultosDelta:3,ninosAdolescentesDelta:0,montoAdicional:120}],
    clientServiceChangeRequests:[{id:'qa218-extra',status:'pendiente',servicioId:'qa218-service',nombreServicio:'Extra QA218',cantidad:1,precioBase:200,montoAdicional:200,ajustePorcentaje:0}]});
}
async function observed(){return{party:await raw(partyId),budget:(await db.collection('presupuestos').doc(budgetId).get()).data()};}
let unexpected,cleanup;
try{
  await reset();partyBefore=async()=>{partyBefore=null;await db.collection('fiestas').doc(partyId).update({contratoFirmaInfo:{isSigned:true}});};
  const signedResult=await actions.approveClientServiceChangeRequest(partyId,'qa218-extra');
  const signed=await observed();
  cases.push({id:'signature-committed-before-party-transaction',pass:signedResult.success===false&&signed.budget.totalConDescuento===1000&&signed.party.clientServiceChangeRequests[0].status==='pendiente',observed:{result:signedResult,...signed}});
  await reset();let reached,release;const reachedGate=new Promise(resolve=>{reached=resolve;});const rollbackGate=new Promise(resolve=>{release=resolve;});let calls=0;
  partyBefore=async()=>{calls++;if(calls===2){reached();await rollbackGate;}};
  failNextBudget=true;const first=actions.approveClientMenuChangeRequest(partyId,'qa218-menu-A');
  const timer=setTimeout(()=>release(),15000);
  try{await Promise.race([reachedGate,new Promise((_,reject)=>setTimeout(()=>reject(new Error('QA218_GATE_NOT_REACHED')),10000))]);
    const second=await actions.approveClientMenuChangeRequest(partyId,'qa218-menu-B');release();const firstResult=await first;const result=await observed();
    cases.push({id:'compensation-after-other-real-SDK-approval',pass:firstResult.success===false&&second.success&&result.party.configuracion.invitadosEstimados===28&&result.budget.invitadosAdultos===28&&result.budget.totalConDescuento===1120,observed:{firstResult,secondResult:second,...result}});
  }finally{clearTimeout(timer);release();await first;}
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{
  await Promise.all([db.collection('fiestas').doc(partyId).delete(),db.collection('presupuestos').doc(budgetId).delete()]);
  cleanup={fiestas:(await db.collection('fiestas').get()).size,presupuestos:(await db.collection('presupuestos').get()).size};await deleteApp(app);
  const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,unexpected,cleanup,summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},appEdited:false,realServices:false,
    scope:'Actual approval state machine, canonical calculation, generic fiesta transaction, actualizarFiesta and data-service mutateDataItem with real Firebase Admin SDK/demo emulator. Owner identity/access predicate and scheduling controlled; collection validator/cleaner/fallback refresh isolated. Signature state written by SDK, NOT real signing endpoint. No HTTP/native browser, real credentials, charge, other roles or production claim.'};
  fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,unexpected,cleanup,observed:cases}));if(!unexpected&&receipt.summary.fail)process.exitCode=1;
}
