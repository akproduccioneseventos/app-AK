import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const source='c3e8f59221dcaca158bd6ec280264b541b4f50d0';
const target=new URL('178-claude-delta-contratos.json',import.meta.url);
assert.equal(fs.existsSync(target),false,'Preserve receipt');
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes={},cases=[];
function read(file){const p=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(p.status,0,p.stderr);hashes[file]=crypto.createHash('sha256').update(p.stdout).digest('hex');return p.stdout;}
function load(file,names=null,globals={},dependencies={}){
  const raw=read(file),ast=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true);
  const wanted=n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)));
  const nodes=names?ast.statements.filter(wanted):ast.statements;
  if(names)for(const name of names)assert.ok(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
  const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
  const exports={};const require=id=>{assert.ok(Object.hasOwn(dependencies,id),`Unconfigured dependency ${id}`);return dependencies[id];};
  vm.runInNewContext(code,{exports,require,Date,Math,JSON,Object,Array,Map,Set,Buffer,URL,URLSearchParams,console:{log(){},warn(){},error(){}},...globals},{filename:file,timeout:3000});
  return names?exports.__qa:exports;
}
const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});
const profiles=load('src/lib/auth/perfiles.ts');
let cookie=null;
const secret='qa178-fictitious-signing-secret-only';
const session=load('src/lib/auth/session-token.ts',null,{process:{env:{AK_SESSION_SECRET:secret,NODE_ENV:'production'}}},{crypto,'@/lib/auth/session-constants':{SESSION_COOKIE_NAME:'ak_session'},'next/headers':{cookies:async()=>({get:()=>cookie?{value:cookie}:undefined})}});
const guard=load('src/lib/auth/require-session.ts',null,{}, {'@/lib/auth/session-token':session,'@/lib/auth/perfiles':profiles});
let entered=0;
const stop=async()=>{entered++;throw new Error('QA178_STOP_AFTER_PERMISSION');};
const actions=[
  ['activateUltimateEventSystem','src/app/actions/experience-total.ts',profiles.PERMISOS.ADMINISTRACION,['qa178'],{getFiestaById:stop}],
  ['ejecutarTareaManual','src/app/actions/tareas-automaticas.actions.ts',profiles.PERMISOS.ADMINISTRACION,['generate-blog-post'],{runMarketingAutomation:stop}],
  ['deleteDocumento','src/app/actions/fiesta/documentos.actions.ts',profiles.PERMISOS.CONTABILIDAD,['qa178','doc'],{getFiestaById:stop}],
  ['extractReceiptDataAction','src/app/actions/gastos.ts',profiles.PERMISOS.CONTABILIDAD,[{receiptDataUri:'data:qa178'}],{}],
  ['notifyGuestsWithCalendarLinks','src/app/actions/google-workspace-extended.ts',profiles.PERMISOS.ORGANIZACION,['qa178'],{turnoDeInvitaciones:{runExclusive:fn=>fn()},notifyGuestsWithCalendarLinksInterno:stop}],
  ['notifyContractSignedToClient','src/app/actions/google-workspace-extended.ts',profiles.PERMISOS.CONTABILIDAD,['qa178',{method:'digital'}],{getFiestaById:stop}],
];
for(const [name,file,permission,args,bindings]of actions){
  const action=load(file,[name],{...profiles,...guard,...bindings},{'@/lib/ai/consumo-servidor':{hayPresupuestoParaIA:stop}})[name];
  for(const profile of ['dueno','secretaria','operador','personal','cliente','prospecto','invitado','anonymous','expired','tampered']){
    const actor={userId:'qa178',email:'qa178@qa.invalid',role:'admin',perfil:['expired','tampered'].includes(profile)?'dueno':profile};
    cookie=profile==='anonymous'?null:await session.createSignedSessionToken(actor,profile==='expired'?-60:60);
    if(profile==='tampered')cookie=cookie.slice(0,-1)+(cookie.endsWith('0')?'1':'0');
    entered=0;let result,error;
    try{result=await action(...args);}catch(e){error=String(e.message||e);}
    const allowed=!['anonymous','expired','tampered'].includes(profile)&&profiles.puede(actor,permission);
    check(`guard-${name}-${profile}`,allowed?entered===1:entered===0&&(Boolean(error)||result?.success===false),{allowed,sideEffectBoundaryEntered:entered,result,error});
  }
}

const money=load('src/lib/fiesta/reponer-la-plata.ts');
const consumers=load('src/app/actions/fiesta/fiesta.actions.ts',['CAMPOS_DE_PLATA_Y_CONTRATO','PAGO_DE_LA_COMPRA','mismoValor','reponerLaPlata','sinLaPlata','pideCambiarLaPlata'],money);
const old={id:'qa178',estado:'Contratado',estadosCompra:[{proveedorId:'a',proveedor:'Igual',pagado:true,montoPagado:60.30},{proveedorId:'b',proveedor:'Igual',pagado:false,montoPagado:0}]};
for(const order of [['a','b'],['b','a']]){
  const next={id:'qa178',estadosCompra:order.map(proveedorId=>({proveedorId,proveedor:'Igual',entregado:true}))};
  const result=consumers.reponerLaPlata(next,old),a=result.estadosCompra.find(x=>x.proveedorId==='a'),b=result.estadosCompra.find(x=>x.proveedorId==='b');
  check(`payment-same-name-ids-${order.join('-')}`,a.pagado===true&&a.montoPagado===60.30&&b.pagado===false&&b.montoPagado===0,{rows:result.estadosCompra});
}
const replacement=consumers.reponerLaPlata({id:'qa178',estadosCompra:[{proveedorId:'c',proveedor:'Igual',pagado:true,montoPagado:99}]},old);
check('payment-new-id-same-name-does-not-inherit',!Object.hasOwn(replacement.estadosCompra[0],'pagado')&&!Object.hasOwn(replacement.estadosCompra[0],'montoPagado'),replacement);
const legacy={id:'qa178',estadosCompra:[{proveedor:'Igual',pagado:true,montoPagado:60.30},{proveedor:'Igual',pagado:false,montoPagado:0}]};
const legacyResult=consumers.reponerLaPlata({id:'qa178',estadosCompra:[{proveedor:'Igual'},{proveedor:'Igual'}]},legacy);
check('payment-two-legacy-records-not-one-copied-twice',legacyResult.estadosCompra[0].montoPagado===60.30&&legacyResult.estadosCompra[1].montoPagado===0,legacyResult);
check('payment-partial-operational-no-payment-change',!consumers.pideCambiarLaPlata({estadosCompra:[{proveedorId:'b',proveedor:'Igual',entregado:true}]},old),{});
check('payment-partial-new-id-rejects-injected-payment',consumers.pideCambiarLaPlata({estadosCompra:[{proveedorId:'c',proveedor:'Igual',pagado:true,montoPagado:60.30}]},old),{});

const dates=load('src/lib/fechas/formato-fecha-evento.ts');
const previousTZ=process.env.TZ;
try{for(const zone of ['UTC','America/Montevideo']){
  process.env.TZ=zone;
  for(const [name,value,expected]of [['new-year','2027-01-01',2027],['iso-time-written-year','2028-01-01T00:00:00.000Z',2028],['slash','01/01/2027',2027],['date-local',new Date(2027,0,1,12),2027],['empty',null,null],['invalid','not-a-date',null]]){
    const actual=dates.anioDeLaFechaDelEvento(value);check(`civil-year-${zone}-${name}`,actual===expected,{expected,actual,legacyUtcDateYear:new Date('2027-01-01').getFullYear()});
  }
}}finally{if(previousTZ===undefined)delete process.env.TZ;else process.env.TZ=previousTZ;}

const staff=load('src/lib/fiesta/personal-por-invitados.ts');
const canonical=[{id:'waiter',nombre:'Mozo',sueldoPorEvento:1111},{id:'chef',nombre:'Chef',sueldoPorEvento:3333},{id:'cook',nombre:'Ayudante de Cocina',sueldoPorEvento:2222},
  {id:'utility',nombre:'Utilero',sueldoPorEvento:1234},{id:'bar-assistant',nombre:'Ayudante de Barman',sueldoPorEvento:999},{id:'bar',nombre:'Barman',sueldoPorEvento:9999}];
let guests=100,roles=canonical,saved,manual=[];
const sync=load('src/app/actions/fiesta/fiesta.actions.ts',['syncFiestaFromBudget'],{
  ...staff,requireAppSession:guard.requireAppSession,getFiestaById:async()=>({id:'qa178',presupuestoId:'qa178-budget',configuracion:{},personalAsignado:structuredClone(manual)}),
  getPresupuestoById:async()=>({invitadosCantidad:guests,eventoTipo:'General',eventoFecha:'2027-08-08',clienteNombre:'QA178',itemsPresupuestados:[{nombreServicio:'Menu QA',categoriaServicio:'Plato Principal'},{nombreServicio:'Barra de tragos QA',categoriaServicio:'Servicio de bebidas'}],totalConDescuento:10000}),
  leerRolesInterno:async()=>roles,normalizeBudgetItemsForSync:items=>items,deriveBudgetModulesForSync:()=>({}),defaultModulosContratados:{},
  mergeClientPortalSettingsForSync:v=>v||{},itemMatchesKeywords:()=>false,syncBebidasFromItems:()=>({}),defaultBebidasData:{},defaultReposteriaData:{},defaultDecoracion:{},defaultGestionCostos:{},
  syncCostosFromBudget:()=>({}),syncCargaOperativaFromBudget:async()=>({categorias:[]}),generateTareasFromServices:()=>[],generateItinerarioSugerido:()=>[],generateCartaTragosSugerida:()=>({items:[]}),
  saveFiesta:async value=>{saved=structuredClone(value);return{success:true,id:value.id};},syncLaundryCosts:async()=>{},logger:{error(){}},
});
cookie=await session.createSignedSessionToken({userId:'qa178',email:'qa178@qa.invalid',perfil:'dueno',role:'admin'});
for(const n of [25,99,100,140,150,151]){
  guests=n;roles=canonical;manual=[];saved=null;const response=await sync.syncFiestaFromBudget('qa178');
  const rows=saved?.personalAsignado||[],bar=rows.filter(x=>x.rolId==='bar'),cooks=rows.filter(x=>x.rolId==='cook');
  const expectedBar=n>150?{count:2,salary:2000}:{count:1,salary:n>=100?2800:2000};
  check(`sync-staff-budget-${n}`,response.success&&bar.length===expectedBar.count&&bar.every(x=>x.eventSalary===expectedBar.salary)&&cooks.length===Math.max(0,Math.ceil(n/25)-1)&&rows.filter(x=>x.rolId==='chef').length===1&&rows.filter(x=>x.rolId==='utility').length===Math.ceil(n/30),{bar,cookCount:cooks.length,roleCounts:Object.fromEntries(canonical.map(r=>[r.id,rows.filter(x=>x.rolId===r.id).length]))});
}
guests=100;manual=[{empleadoId:'qa178-manual',rolId:'bar',eventSalary:5555}];await sync.syncFiestaFromBudget('qa178');
check('sync-preserves-existing-manual-staff',JSON.stringify(saved.personalAsignado)===JSON.stringify(manual),{staff:saved.personalAsignado});
manual=[];roles=[{id:'floor-kitchen',nombre:'Mozo de Cocina',sueldoPorEvento:1000},{id:'floor',nombre:'Mozo de Atencion',sueldoPorEvento:1500},...canonical.filter(r=>r.id!=='waiter')];await sync.syncFiestaFromBudget('qa178');
const rows=saved.personalAsignado;
check('sync-floor-waiters-not-kitchen-role',rows.filter(x=>x.rolId==='floor').length===4&&rows.filter(x=>x.rolId==='floor-kitchen').length===0,{floor:rows.filter(x=>x.rolId==='floor').length,kitchenWaiters:rows.filter(x=>x.rolId==='floor-kitchen').length,roleCatalog:roles.map(r=>({id:r.id,name:r.nombre}))});

const summary={total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length};
const result={source,finishedAt:new Date().toISOString(),hashes,cases,summary,appEdited:false,realServices:false,
  limits:['Guard cases execute actual signed-token verification and real guards/action bodies, then stop at a controlled first side-effect boundary: not complete allowed business actions or HTTP/cookies',
    'Payment preservation and partial detection consumers are real; no database/payment transaction or amount changed',
    'Staff synchronization body and staff rules real through captured save; unrelated menu/itinerary/cost/laundry/storage dependencies controlled, not real persistence/UI',
    'Year helper real UTC/Uy, not every document/simulator/PDF consumer or complete order206',
    'No current complete build, no app-wide/zero-error certification']};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({source,summary,failed:cases.filter(c=>!c.pass)}));
if(summary.fail)process.exitCode=1;
