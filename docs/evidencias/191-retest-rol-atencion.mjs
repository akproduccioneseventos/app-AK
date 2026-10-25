import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),source='56c4a425ec25dbf7da7d2f4416a841d58cd92696';
const target=new URL('191-retest-rol-atencion.json',import.meta.url);assert.equal(fs.existsSync(target),false,'Preserve result');
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript'),hashes={},cases=[];
function read(file){const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024**2});assert.equal(r.status,0,r.stderr);hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');return r.stdout;}
function load(file,names=null,globals={},dependencies={}){
  const raw=read(file),ast=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true);
  const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))):ast.statements;
  if(names)for(const name of names)assert.ok(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
  const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
  const exports={};vm.runInNewContext(code,{exports,require:id=>{assert.ok(Object.hasOwn(dependencies,id),id);return dependencies[id];},Date,Math,JSON,Object,Array,Map,Set,Buffer,URL,structuredClone,console:{log(){},error(){},warn(){}},...globals},{filename:file,timeout:3000});return names?exports.__qa:exports;
}
const profiles=load('src/lib/auth/perfiles.ts');let cookie;
const session=load('src/lib/auth/session-token.ts',null,{process:{env:{AK_SESSION_SECRET:'qa191-fictitious-session-secret-only',NODE_ENV:'production'}}},{crypto,'@/lib/auth/session-constants':{SESSION_COOKIE_NAME:'ak_session'},'next/headers':{cookies:async()=>({get:()=>cookie?{value:cookie}:undefined})}});
const guard=load('src/lib/auth/require-session.ts',null,{}, {'@/lib/auth/session-token':session,'@/lib/auth/perfiles':profiles});
const staff=load('src/lib/fiesta/personal-por-invitados.ts');let roles,saved;
const sync=load('src/app/actions/fiesta/fiesta.actions.ts',['syncFiestaFromBudget'],{
  ...staff,requireAppSession:guard.requireAppSession,getFiestaById:async()=>({id:'qa191',presupuestoId:'qa191-budget',configuracion:{},personalAsignado:[]}),
  getPresupuestoById:async()=>({invitadosCantidad:100,eventoTipo:'General',eventoFecha:'2027-08-08',clienteNombre:'QA191',itemsPresupuestados:[{nombreServicio:'Menu QA',categoriaServicio:'Plato Principal'},{nombreServicio:'Barra de tragos QA',categoriaServicio:'Servicio de bebidas'}],totalConDescuento:10000}),
  leerRolesInterno:async()=>roles,normalizeBudgetItemsForSync:items=>items,deriveBudgetModulesForSync:()=>({}),defaultModulosContratados:{},
  mergeClientPortalSettingsForSync:v=>v||{},itemMatchesKeywords:()=>false,syncBebidasFromItems:()=>({}),defaultBebidasData:{},defaultReposteriaData:{},defaultDecoracion:{},defaultGestionCostos:{},
  syncCostosFromBudget:()=>({}),syncCargaOperativaFromBudget:async()=>({categorias:[]}),generateTareasFromServices:()=>[],generateItinerarioSugerido:()=>[],generateCartaTragosSugerida:()=>({items:[]}),
  saveFiesta:async value=>{saved=structuredClone(value);return{success:true,id:value.id};},syncLaundryCosts:async()=>{},logger:{error(){}},
});
cookie=await session.createSignedSessionToken({userId:'qa191',email:'qa191@qa.invalid',perfil:'dueno',role:'admin'});
const common=[{id:'chef',nombre:'Chef',sueldoPorEvento:3333},{id:'cook',nombre:'Ayudante de Cocina',sueldoPorEvento:2222},{id:'utility',nombre:'Utilero',sueldoPorEvento:1234},{id:'bar-assistant',nombre:'Ayudante de Barman',sueldoPorEvento:999},{id:'bar',nombre:'Barman',sueldoPorEvento:9999}];
for(const name of ['Mozo de Atencion','Mozo de Atención','Mozo']){
  roles=[{id:'kitchen-waiter',nombre:'Mozo de Cocina',sueldoPorEvento:1000},{id:'floor',nombre:name,sueldoPorEvento:1500},...common];saved=null;
  const result=await sync.syncFiestaFromBudget('qa191'),rows=saved?.personalAsignado||[];
  const observed={result,roleName:name,floor:rows.filter(r=>r.rolId==='floor').length,kitchen:rows.filter(r=>r.rolId==='kitchen-waiter').length,bar:rows.filter(r=>r.rolId==='bar'),chef:rows.filter(r=>r.rolId==='chef').length,cooks:rows.filter(r=>r.rolId==='cook').length};
  cases.push({id:`staff-role-${name}`,pass:result.success&&observed.floor===4&&observed.kitchen===0&&observed.bar.length===1&&observed.bar[0].eventSalary===2800&&observed.chef===1&&observed.cooks===3,observed});
}
const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},order209StaffStatus:'CORRECTED_AND_TESTED_WITHIN_SCOPE',appEdited:false,realServices:false,limits:'Actual sync action, staff helper and signed-session guard; captured save and other sync dependencies controlled. No UI/Firestore/global build or all-staff acceptance.'};
fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,failures:cases.filter(c=>!c.pass)}));if(receipt.summary.fail)process.exitCode=1;
