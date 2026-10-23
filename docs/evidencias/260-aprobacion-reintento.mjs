import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='725e62ba2f909578628fad47402d125ed9632c70';
const target=new URL('260-aprobacion-reintento.json',import.meta.url);
assert(!fs.existsSync(target),'Preserve receipt');
if(os.freemem()<512*1024**2){console.log(JSON.stringify({source,preflight:'NOT_STARTED_LOW_MEMORY',free:os.freemem(),minimum:512*1024**2}));process.exit(3);}
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes={},cases=[],clone=x=>JSON.parse(JSON.stringify(x));
const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('QA260_REAL_NETWORK_FORBIDDEN');};
function load(file,names,globals={}){
 const raw=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(raw.status,0,raw.stderr);hashes[file]=crypto.createHash('sha256').update(raw.stdout).digest('hex');
 const ast=ts.createSourceFile(file,raw.stdout,ts.ScriptTarget.Latest,true);const nodes=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text));for(const name of names)assert(nodes.some(n=>n.name?.text===name),name);
 const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('module','exports',...Object.keys(globals),code)(module,module.exports,...Object.values(globals));return module.exports;
}
const state=load('src/lib/client-portal/payment-notifications.ts',['transitionPaymentNotification']);
let party,paid,budgetCalls,writer,notify=[];
const actions=load('src/app/actions/fiesta/portal.actions.ts',['approveClientPayment','rejectClientPayment'],{
 ...state,PERMISOS:{CONTABILIDAD:'contabilidad'},requirePermiso:async()=>({ok:true,user:{perfil:'dueno'}}),
 getFiestaById:async()=>clone(party),
 actualizarFiesta:async(_id,change)=>{party=clone(await change(clone(party)));return {success:true,updatedFiesta:clone(party)};},
 addPagoToPresupuesto:async(...args)=>{budgetCalls++;return writer(...args);},
 notifyClientPaymentApproved:async(_id,notification)=>notify.push({kind:'approved',id:notification.id}),
 notifyClientPaymentRejected:async(_id,notification)=>notify.push({kind:'rejected',id:notification.id}),
 sanitizeActionError:error=>String(error.message||error),
});
function reset(){party={id:'qa260-party',presupuestoId:'qa260-budget',clientPaymentNotifications:[{id:'qa260-notification',monto:1000,estado:'pendiente',fecha:'2026-10-23'}]};paid=[];notify=[];budgetCalls=0;writer=async(_id,payment)=>{if(!paid.some(p=>p.referencia===payment.referencia))paid.push(clone(payment));return {success:true};};}
const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});let unexpected;
try{
 reset();const rejected=await actions.rejectClientPayment(party.id,'qa260-notification');const attempt=await actions.approveClientPayment(party.id,'qa260-notification');check('reject-first-does-not-credit',rejected.success&&!attempt.success&&budgetCalls===0,{rejected,attempt,budgetCalls,party});
 reset();let entered,release;const enteredGate=new Promise(r=>entered=r),releaseGate=new Promise(r=>release=r);const normalWriter=writer;
 writer=async(...args)=>{if(budgetCalls===1){entered();await releaseGate;return {success:false,error:'QA260_FIRST_CALL_REJECTED_BEFORE_COMMIT'};}return normalWriter(...args);};
 const a=actions.approveClientPayment(party.id,'qa260-notification');const timer=setTimeout(()=>release(),15000);
 try{await enteredGate;const b=await actions.approveClientPayment(party.id,'qa260-notification');release();const first=await a;
 check('failed-owner-call-does-not-undo-successful-retry',!first.success&&b.success&&paid.length===1&&party.clientPaymentNotifications[0].estado==='aprobado',{first,retry:b,paid,party,notify});
 }finally{clearTimeout(timer);release();await a;}
 reset();writer=async()=>({success:false,error:'QA260_KNOWN_REJECTION'});const failure=await actions.approveClientPayment(party.id,'qa260-notification');check('single-known-rejection-restores-pending',!failure.success&&party.clientPaymentNotifications[0].estado==='pendiente'&&paid.length===0,{failure,party,paid});
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{globalThis.fetch=originalFetch;const result={source,at:new Date().toISOString(),hashes,cases,unexpected,summary:{total:cases.length,pass:cases.filter(x=>x.pass).length,fail:cases.filter(x=>!x.pass).length},appEdited:false,scope:'Actual approve/reject actions and transition function. Owner permission, fiesta transaction, budget-accept/reject and notification adapters controlled in memory. NO FirebaseSDK, HTTP, real ledger/payment/account/provider or production mutation.'};fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({source,summary:result.summary,unexpected,cases}));if(!unexpected&&result.summary.fail)process.exitCode=1;}
