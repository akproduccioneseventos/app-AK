import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='725e62ba2f909578628fad47402d125ed9632c70';
const candidate='b91bdbeff7d3db7489fabdadd599776376c0577a';
const target=new URL('255-recordatorios-motor.json',import.meta.url);
assert.equal(fs.existsSync(target),false,'Preserve receipt');
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes={},cases=[],warnings=[];const clone=v=>JSON.parse(JSON.stringify(v));
const actualFetch=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('QA255_EXTERNAL_NETWORK_FORBIDDEN');};
function load(file,deps={},names=null){
 const git=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(git.status,0,git.stderr);
 const other=spawnSync('git',['show',`${candidate}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(other.status,0,other.stderr);
 const digest=s=>crypto.createHash('sha256').update(s).digest('hex');hashes[file]={source:digest(git.stdout),candidate:digest(other.stdout),equal:git.stdout===other.stdout};
 const ast=ts.createSourceFile(file,git.stdout,ts.ScriptTarget.Latest,true);
 const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)):ast.statements;
 if(names)for(const name of names)assert(nodes.some(n=>n.name?.text===name),name);
 const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};new Function('require','module','exports','process','console',code)(id=>{assert(Object.hasOwn(deps,id),`Unknown dependency ${id}`);return deps[id];},module,module.exports,{env},{...console,warn:(...v)=>warnings.push(v.join(' ')),error:(...v)=>warnings.push(v.join(' '))});return module.exports;
}
const env={CRON_SECRET:'qa255-key',META_WHATSAPP_TOKEN:'',META_WHATSAPP_PHONE_ID:''};
let party,mails,scheduled,marked,beforeReserve,reserveFails,gmailFails,scheduleFails;
const now=new Date('2026-10-01T15:00:00Z');
function reset(){party={id:'qa255-party',configuracion:{nombreEvento:'Evento ficticio QA255',fechaEvento:'2026-10-11'},invitados:[{id:'qa255-guest',nombre:'Persona QA255',contacto:'persona@qa.invalid',guestAccessToken:'qa255-guest-token',rsvp:'Pendiente'}]};mails=[];scheduled=[];marked=[];beforeReserve=null;reserveFails=false;gmailFails=false;scheduleFails=false;env.CRON_SECRET='qa255-key';}
const data={readData:async(file,def)=>{
 if(file==='fiestas.json')return clone([party]);
 if(file==='ajustes-recordatorio-invitacion.json')return {activo:true};
 if(file==='_google-workspace-accounts.json')return [{id:'qa255-company',kind:'company',status:'connected',accessToken:'qa255-provider-double'}];
 throw new Error(`Unknown file ${file}`);
},writeData:async()=>{throw new Error('Unexpected settings write');}};
const utils=load('src/lib/utils.ts',{},['getUruguayParts','hoyEnUruguay']);
const engine=load('src/lib/invitaciones/recordatorio-no-abiertas.ts',{
 'server-only':{},'@/lib/data-service':data,'@/lib/utils':utils,
 '@/lib/whatsapp/meta-sender':{sendMetaWhatsAppMessage:async()=>{throw new Error('Unexpected WhatsApp path');}},
 '@/app/actions/scheduled-messages':{saveScheduledMessage:async value=>{scheduled.push(clone(value));return scheduleFails?{success:false,error:'QA255_FALLBACK_FAILED'}:{success:true};}},
 '@/lib/whatsapp/internal-token':{WHATSAPP_AUTOMATION_INTERNAL_TOKEN:Symbol('qa255-only')},
 '@/lib/google-workspace':{sendGoogleGmailMessage:async(...args)=>{mails.push(clone(args));if(gmailFails)throw Object.assign(new Error('QA255_GMAIL_HTTP403_REJECTED'),{status:403});return {id:'qa255-mail-double'};},ensureFreshGoogleAccount:async account=>account,hasServiceAccountKey:()=>false,getServiceAccountAccessToken:async()=>null,GOOGLE_WORKSPACE_SCOPES:[]},
 '@/lib/fiesta/actualizar-fiesta':{actualizarFiesta:async(_id,fn)=>{if(beforeReserve){const mutate=beforeReserve;beforeReserve=null;mutate(party);}if(reserveFails)return {success:false,error:'QA255_RESERVATION_WRITE_FAILED'};party=await fn(clone(party));return {success:true,updatedFiesta:clone(party)};}},
});
const gate=load('src/lib/automatico/puerta-de-las-tareas.ts',{'server-only':{},'@/lib/commercial/public-rate-limit':{enforcePublicRateLimit:async()=>{}}});
const route=load('src/app/api/cron/recordar-invitacion-no-abierta/route.ts',{
 'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}},
 '@/lib/automatico/puerta-de-las-tareas':gate,
 '@/lib/automatico/tareas-automaticas':{marcarCorrida:async name=>marked.push(name)},
 '@/lib/invitaciones/recordatorio-no-abiertas':{correrTareaRecordarInvitacionNoAbierta:()=>engine.correrTareaRecordarInvitacionNoAbierta(now)},
});
const request=(key=false)=>new Request('https://qa.invalid/api/cron/recordar-invitacion-no-abierta',{headers:key?{Authorization:'Bearer qa255-key'}:{}});
const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});let unexpected;
try{
 reset();const denied=await route.GET(request());check('configured-key-denies-anonymous',denied.status===401&&mails.length===0&&marked.length===0,{status:denied.status,mails:mails.length,marked});
 reset();const authorized=await route.GET(request(true));check('authorized-key-drives-engine-on-due-day',authorized.status===200&&mails.length===1&&marked.length===1,{status:authorized.status,body:await authorized.json(),mails:mails.length,marked});
 reset();delete env.CRON_SECRET;const anonymous=await route.GET(request());check('no-key-public-task-cannot-send-to-a-person',anonymous.status===503&&mails.length===0&&marked.length===0&&scheduled.length===0,{status:anonymous.status,body:await anonymous.json(),mails:mails.length,marked,scheduledAttempts:scheduled.length,guest:party.invitados[0]});
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{globalThis.fetch=actualFetch;const receipt={source,candidate,hashes,cases,warnings,unexpected,summary:{total:cases.length,pass:cases.filter(x=>x.pass).length,fail:cases.filter(x=>!x.pass).length},appEdited:false,externalNetwork:false,scope:'Actual engine, cron GET and public gate, actual Uruguay date helpers. Controlled storage/reservation/provider/fallback/clock/rate-limit and run-marker adapters, Request/Response in-process; NO Firestore SDK, signed HTTP server, Gmail/WhatsApp/account or production execution.'};fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,unexpected,cases}));if(!unexpected&&receipt.summary.fail)process.exitCode=1;}
