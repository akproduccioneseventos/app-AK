import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),source='725e62ba2f909578628fad47402d125ed9632c70';
const target=new URL('261-costos-y-senia.json',import.meta.url);assert(!fs.existsSync(target),'Preserve');assert(os.freemem()>=512*1024**2,'No unit loader under512MiB');
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');const hashes={},cases=[],clone=x=>JSON.parse(JSON.stringify(x));
function load(file,names=null,globals={},deps={}){
 const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');const ast=ts.createSourceFile(file,r.stdout,ts.ScriptTarget.Latest,true);const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)):ast.statements;if(names)for(const name of names)assert(nodes.some(n=>n.name?.text===name),name);
 const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('require','module','exports',...Object.keys(globals),code)(id=>{assert(Object.hasOwn(deps,id),`Unknown ${id}`);return deps[id];},module,module.exports,...Object.values(globals));return module.exports;
}
const guard=load('src/lib/fiesta/validar-costos.ts'),laundry=load('src/lib/fiesta-sync-utils.ts',['applyLaundryCosts']);
let party,beforeWrite,repeated,writeFailure,budgetValue,budgetFailure,readCount;
const updater={actualizarFiesta:async(_id,fn)=>{if(writeFailure)return{success:false,error:'QA261_STORAGE_FAILED'};if(beforeWrite){beforeWrite(party);beforeWrite=null;}if(repeated)await fn(clone(party));party=clone(await fn(clone(party)));return{success:true,updatedFiesta:clone(party)};}};
const costs=load('src/lib/fiesta/costos-interno.ts',null,{}, {'server-only':{},'@/lib/fiesta/actualizar-fiesta':updater,'@/lib/fiesta/validar-costos':guard});
const sync=load('src/app/actions/fiesta/costos.actions.ts',['syncLaundryCosts'],{...costs,...laundry,PERMISOS:{CONTABILIDAD:'contabilidad',INSUMOS:'insumos',ORGANIZACION:'organizacion'},requireAppSession:async()=>{},requireEventPermission:async()=>clone(party)});
const deposit=load('src/lib/fiesta/sena-del-contrato.ts',null,{}, {'server-only':{},'@/app/actions/presupuestos':{getPresupuestoById:async()=>{readCount++;if(budgetFailure)throw new Error('QA261_READ_FAILED');return clone(budgetValue);}}});
function reset(){party={id:'qa261-party',presupuestoId:'qa261-budget',configuracion:{nombreEvento:'Fixture QA261'},gestionCostos:{costosItems:[],ingresosTotalesEstimados:10000}};beforeWrite=null;repeated=false;writeFailure=false;budgetValue=null;budgetFailure=false;readCount=0;}
const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});let unexpected;
try{
 reset();beforeWrite=p=>p.gestionCostos.costosItems.push({id:'qa261-flete',nombre:'Flete',category:'Otros',montoEstimado:100.50});await sync.syncLaundryCosts(party.id,100,[{idServicioCatalogo:'qa261-mantel',nombreServicio:'Manteles',cantidad:10}]);check('laundry-sync-preserves-late-manual-cost-and-cents',party.gestionCostos.costosItems.some(x=>x.id==='qa261-flete'&&x.montoEstimado===100.50)&&party.gestionCostos.costosItems.some(x=>x.nombre==='Lavado Mantel ($50)'&&x.montoEstimado===650),{costs:party.gestionCostos});
 reset();repeated=true;await sync.syncLaundryCosts(party.id,100,[{idServicioCatalogo:'qa261-mantel',nombreServicio:'Manteles',cantidad:10}]);const ids=party.gestionCostos.costosItems.map(x=>x.id);check('repeated-cost-callback-does-not-duplicate-laundry',new Set(ids).size===ids.length&&ids.length===2,{costs:party.gestionCostos});
 reset();party.gestionCostos.costosItems=[{id:'qa261-good',nombre:'Bueno',montoEstimado:100.50}];const before=clone(party);const invalid=await costs.mutarCostosInterno(party.id,current=>({...current,costosItems:[{id:'qa261-bad',nombre:'Negativo',montoEstimado:-1}]}));check('invalid-generated-cost-rejected-without-overwrite',!invalid.success&&JSON.stringify(party)===JSON.stringify(before),{result:invalid,party});
 reset();writeFailure=true;const failed=await costs.mutarCostosInterno(party.id,current=>current);check('failed-cost-write-is-not-success',!failed.success&&failed.error==='QA261_STORAGE_FAILED',failed);
 reset();budgetFailure=true;const unread=await deposit.resolveDepositAmount(party);budgetFailure=false;const missing=await deposit.resolveDepositAmount(party);check('unread-or-missing-linked-budget-does-not-invent-deposit',unread===null&&missing===null,{unread,missing});
 reset();budgetValue={id:'qa261-budget',senia:30000,totalConDescuento:100000};const explicit=await deposit.resolveDepositAmount(party);check('explicit-deposit-preserved',explicit===30000,{amount:explicit});
 reset();delete party.presupuestoId;const noBudget=await deposit.resolveDepositAmount(party);check('no-linked-budget-keeps-approved-default-policy',noBudget===20000&&readCount===0,{amount:noBudget,readCount});
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{const result={source,hashes,cases,unexpected,summary:{total:cases.length,pass:cases.filter(x=>x.pass).length,fail:cases.filter(x=>!x.pass).length},appEdited:false,scope:'Actual mutarCostosInterno, cost validator, laundry generator/sync and deposit helper. Permission, transaction/storage and budget-reader adapters controlled in memory. NO SDK/HTTP/PDF/real payroll/real deposit or complete cost synchronization engine acceptance.'};fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({source,summary:result.summary,unexpected,cases}));if(!unexpected&&result.summary.fail)process.exitCode=1;}
