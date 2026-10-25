import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de';
const target=new URL('216-contraste-aprobaciones.json',import.meta.url);
assert.equal(fs.existsSync(target),false,'Preserve receipt');
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes={},cases=[];const clone=value=>JSON.parse(JSON.stringify(value));
let budget,fiesta,signed,writeFailure,partyFailure,missingBudget,user,budgetWrites,partyWrites,signedLookupFails,budgetAckFailure,partyBefore;
function load(file,names=null,globals={},dependencies={}){
  const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024**2});assert.equal(r.status,0,r.stderr);
  hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');
  const ast=ts.createSourceFile(file,r.stdout,ts.ScriptTarget.Latest,true);
  const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))):ast.statements;
  if(names)for(const name of names)assert.ok(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
  const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
  const module={exports:{}};const req=name=>{assert.ok(Object.hasOwn(dependencies,name),`Unconfigured ${name}`);return dependencies[name];};
  new Function('require','module','exports',...Object.keys(globals),code)(req,module,module.exports,...Object.values(globals));
  return names?module.exports.__qa:module.exports;
}
const profile=load('src/lib/auth/perfiles.ts');
const session={verifySession:async()=>user?{success:true,user}:{success:false,error:'QA204_NO_SESSION'}};
const guards=load('src/lib/auth/require-session.ts',null,{}, {'@/lib/auth/session-token':session,'@/lib/auth/perfiles':profile});
const calculations=load('src/lib/calculations.ts');
const formal=load('src/lib/budget/formal-budget.ts');
const financial=load('src/lib/budget/financial-guardrails.ts',null,{}, {'@/lib/calculations':calculations,'@/lib/budget/formal-budget':formal});
const {AsyncMutex}=load('src/lib/mutex.ts');
const canonical=load('src/lib/budget/recalcular-presupuesto.ts',null,{}, {'@/lib/calculations':calculations,'@/lib/budget/financial-guardrails':financial});
const mutation=load('src/lib/budget/mutar-presupuesto.ts',null,{}, {'@/lib/data-service':{
  mutateDataItem:async(file,collection,id,change)=>{assert.equal(file,'presupuestos.json');assert.equal(collection,'presupuestos');assert.equal(id,budget.id);if(missingBudget)return null;const next=change(clone(budget));if(!next)return null;if(writeFailure)throw new Error('QA216_BUDGET_WRITE_FAILED');budget=clone(next);budgetWrites++;if(budgetAckFailure){budgetAckFailure=false;throw new Error('QA216_ACK_LOST_AFTER_COMMIT');}return clone(budget);},
}});
const budgetActions=load('src/app/actions/presupuestos.ts', ['verifySessionConPermiso','estadoDelContrato','NO_SE_PUDO_COMPROBAR_EL_CONTRATO','hasBudgetStructureChanged','guardarPresupuestoSinTurno','updatePresupuesto'],{
  ...profile,...session,...calculations,...financial,...canonical,presupuestosMutex:new AsyncMutex(),PRESUPUESTOS_FILE:'presupuestos.json',
  getAllFiestas:async()=>{if(signedLookupFails)throw new Error('QA204_SIGNATURE_LOOKUP_FAILED');return[{...clone(fiesta),contratoFirmaInfo:{isSigned:signed}}];},
  getPresupuestos:async()=>[clone(budget)],
  findLeadByBudgetOrCreate:async()=>({lead:{id:'qa204-lead'}}),
  writeData:async(file,rows)=>{assert.equal(file,'presupuestos.json');if(writeFailure)throw new Error('QA204_BUDGET_WRITE_FAILED');budget=clone(rows[0]);budgetWrites++;},
  syncLinkedFiesta:async()=>{},
});
const actions=load('src/app/actions/fiesta/portal.actions.ts',['tomarSolicitud','devolverAPendiente','aprobarConPresupuesto','approveClientMenuChangeRequest','approveClientServiceChangeRequest','rejectClientMenuChangeRequest','rejectClientServiceChangeRequest'],{
  ...guards,...profile,...budgetActions,...canonical,...mutation,
  getFiestaById:async id=>id===fiesta.id?{...clone(fiesta),contratoFirmaInfo:{isSigned:signed}}:null,
  getPresupuestoById:async id=>!missingBudget&&id===budget.id?clone(budget):null,
  saveFiesta:async next=>{if(partyFailure){partyFailure--;return{success:false,error:'QA204_PARTY_WRITE_FAILED'};}fiesta=clone(next);partyWrites++;return{success:true};},
  actualizarFiesta:async(id,change)=>{assert.equal(id,fiesta.id);if(partyBefore)await partyBefore();if(partyFailure){partyFailure--;return{success:false,error:'QA216_PARTY_WRITE_FAILED'};}const next=change(clone(fiesta));if(JSON.stringify(next)!==JSON.stringify(fiesta))partyWrites++;fiesta=clone(next);return{success:true,updatedFiesta:clone(fiesta)};},
  sanitizeActionError:error=>error instanceof Error?error.message:String(error),
});
function reset(){
  signed=false;writeFailure=false;partyFailure=0;missingBudget=false;signedLookupFails=false;budgetWrites=0;partyWrites=0;budgetAckFailure=false;partyBefore=null;
  user={userId:'qa204-owner',email:'owner@qa.invalid',perfil:'dueno'};
  budget={id:'qa204-budget',clienteNombre:'Cliente ficticio QA204',estado:'Borrador',source:'manual',eventoFecha:'2026-12-20',timestamp:'2026-10-21',ajusteAnualPorcentaje:0,
    invitadosCantidad:25,invitadosAdultos:25,invitadosAdolescentes:0,invitadosNinos:0,costoTotalEstimado:1000,totalConDescuento:1000,totalFinal:1000,pagosCliente:[],
    itemsPresupuestados:[{idServicioCatalogo:'qa204-menu',nombreServicio:'Menu ficticio QA204',categoriaServicio:'Catering',calculationMethod:'porPersona',cantidad:25,precioUnitario:40,precioUnitarioPresupuesto:40,costoTotalItem:1000}]};
  fiesta={id:'qa204-party',presupuestoId:budget.id,configuracion:{nombreEvento:'Evento ficticio QA204',invitadosEstimados:25},
    clientMenuChangeRequests:[{id:'qa204-menu-request',status:'pendiente',adultosDelta:2,ninosAdolescentesDelta:0,montoAdicional:80,nuevoTotalEstimado:1080}],
    clientServiceChangeRequests:[{id:'qa204-service-request',status:'pendiente',servicioId:'qa204-extra',nombreServicio:'Extra ficticio QA204',cantidad:1,precioBase:200,ajustePorcentaje:0,montoAdicional:200,nuevoTotalEstimado:1200}]};
}
const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});
const snapshot=result=>({result,budget:clone(budget),party:clone(fiesta),budgetWrites,partyWrites});
const approveService=()=>actions.approveClientServiceChangeRequest(fiesta.id,'qa204-service-request');
const approveMenu=()=>actions.approveClientMenuChangeRequest(fiesta.id,'qa204-menu-request');
let unexpected;
try{
  reset();const baseline=await approveService();
  check('single-extra-positive-updates-budget-and-request',baseline.success&&budget.totalConDescuento===1200&&fiesta.clientServiceChangeRequests[0].status==='aprobada',snapshot(baseline));
  reset();signed=true;const signedService=await approveService();
  check('signed-budget-rejection-does-not-mark-service-approved',signedService.success===false&&fiesta.clientServiceChangeRequests[0].status==='pendiente'&&budget.totalConDescuento===1000,snapshot(signedService));
  reset();signed=true;const signedMenu=await approveMenu();
  check('signed-budget-rejection-does-not-mark-menu-approved',signedMenu.success===false&&fiesta.clientMenuChangeRequests[0].status==='pendiente'&&fiesta.configuracion.invitadosEstimados===25,snapshot(signedMenu));
  reset();writeFailure=true;const writeService=await approveService();
  check('budget-write-failure-does-not-mark-approved',writeService.success===false&&fiesta.clientServiceChangeRequests[0].status==='pendiente'&&budget.totalConDescuento===1000,snapshot(writeService));
  reset();missingBudget=true;const missing=await approveService();
  check('missing-budget-does-not-mark-approved',missing.success===false&&fiesta.clientServiceChangeRequests[0].status==='pendiente',snapshot(missing));
  reset();signed=true;signedLookupFails=true;const failedLookup=await approveService();
  check('signature-read-failure-does-not-bypass-signed-budget-guard',failedLookup.success===false&&budgetWrites===0&&budget.totalConDescuento===1000,snapshot(failedLookup));
  reset();const guests=await approveMenu();
  check('approved-adult-increase-reaches-budget-split-count-and-price',guests.success&&budget.invitadosAdultos===27&&budget.invitadosCantidad===27&&budget.totalConDescuento===1080&&fiesta.configuracion.invitadosEstimados===27,snapshot(guests));
  reset();Object.assign(fiesta.clientServiceChangeRequests[0],{cantidad:2,precioBase:400,montoAdicional:400,nuevoTotalEstimado:1400});
  const quantity=await approveService();
  check('two-extra-units-do-not-multiply-line-subtotal-twice',quantity.success&&budget.totalConDescuento===1400&&budget.itemsPresupuestados.at(-1).costoTotalItem===400,snapshot(quantity));
  reset();partyFailure=1;const partial=await approveService();const afterPartial=snapshot(partial);const retried=await approveService();
  check('party-save-failure-retry-does-not-add-extra-twice',partial.success===false&&retried.success&&budget.totalConDescuento===1200&&budget.itemsPresupuestados.filter(row=>row.idServicioCatalogo==='qa204-extra').length===1,{afterPartial,afterRetry:snapshot(retried)});
  reset();budgetAckFailure=true;const lost=await approveService();const afterLost=snapshot(lost);const recovered=await approveService();
  check('budget-commit-ACK-lost-retry-keeps-one-extra',lost.success===false&&recovered.success&&budget.totalConDescuento===1200&&budget.itemsPresupuestados.filter(row=>row.idServicioCatalogo==='qa204-extra').length===1,{afterLost,afterRetry:snapshot(recovered)});
  reset();signed=true;signedLookupFails=true;const changed=clone(budget);changed.itemsPresupuestados.push({idServicioCatalogo:'qa216-other',nombreServicio:'Extra QA216',cantidad:1,precioUnitario:200,precioUnitarioPresupuesto:200,costoTotalItem:200});const unknownSignature=await budgetActions.updatePresupuesto(changed);
  check('direct-budget-update-signature-read-failure-blocks-write',unknownSignature.success===false&&budgetWrites===0&&budget.totalConDescuento===1000,snapshot(unknownSignature));
  reset();fiesta.clientServiceChangeRequests[0].status='rechazada';const decided=await approveService();
  check('already-rejected-request-not-approved-again',decided.success===false&&budgetWrites===0&&partyWrites===0,snapshot(decided));
  reset();const notFound=await actions.approveClientServiceChangeRequest(fiesta.id,'unknown');
  check('unknown-request-no-write',notFound.success===false&&budgetWrites===0&&partyWrites===0,snapshot(notFound));
  reset();user=null;let denied=false;try{await approveService();}catch(error){denied=true;}
  check('no-session-approval-denied-before-writes',denied&&budgetWrites===0&&partyWrites===0,{});
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{
  const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,unexpected,summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},appEdited:false,realServices:false,
    limits:'Updated real tomarSolicitud/devolverAPendiente/aprobarConPresupuesto, mutarPresupuesto SDK branch, estadoDelContrato, canonical recalculation, permissions and normalizer from new main. Persistence callbacks/transaction adapter, identity and CRM controlled: NO real FirestoreSDK/HTTP/native UI or charge. ACK injection occurs after controlled commit; native fa3b does NOT certify this SHA. Unknown/rejected callbacks count only document changes, not no-op storage calls. No signed-contract bypass authorized.'};
  fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({source,summary:receipt.summary,unexpected,failures:cases.filter(c=>!c.pass).map(c=>({id:c.id,observed:c.observed}))}));
  if(receipt.summary.fail&&!unexpected)process.exitCode=1;
}
