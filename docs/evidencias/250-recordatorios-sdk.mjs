import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='baa034fd25ab77b886e7096105a6114f0336bfdc';
const target=new URL('250-recordatorios-sdk.json',import.meta.url);assert(!fs.existsSync(target),'Preserve');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
const req=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts=req('typescript'),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-ak-producciones'},'qa250'),db=getFirestore(app);db.settings({ignoreUndefinedProperties:true});
const hashes={},cases=[],clone=v=>JSON.parse(JSON.stringify(v));let mails=[],fallback=[],beforeSave=null,rejectMail=false;
const id='qa250-party',now=new Date('2026-10-01T15:00:00Z');
const network=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('QA250_EXTERNAL_NETWORK_FORBIDDEN');};
function load(file,names=null,globals={},deps={}){
 const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');
 const ast=ts.createSourceFile(file,r.stdout,ts.ScriptTarget.Latest,true);const nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))):ast.statements;
 if(names)for(const name of names)assert(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
 const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
 const module={exports:{}};new Function('require','module','exports',...Object.keys(globals),code)(name=>{assert(Object.hasOwn(deps,name),`Unknown ${name}`);return deps[name];},module,module.exports,...Object.values(globals));return names?module.exports.__qa:module.exports;
}
const raw=async()=>{const d=await db.collection('fiestas').doc(id).get();return d.exists?d.data():null;};
const profiles=load('src/lib/auth/perfiles.ts');
const redaction=load('src/lib/fiesta/recortar-para-afuera.ts',null,{}, {'@/lib/auth/perfiles':profiles});
const secrets=load('src/lib/fiesta/get-fiesta-raw.ts',['preserveFiestaSecrets'],{getFiestaByIdRaw:raw,reponerLoRecortado:redaction.reponerLoRecortado});
const storage=load('src/lib/generic-json-store.ts',['getDbAdmin','sinIndefinidos','mutarDocumentoConTransaccion'],{}, {'./firebase/server':{dbAdmin:db}});
const updater=load('src/lib/fiesta/actualizar-fiesta.ts',null,{}, {
 '@/lib/fiesta/lectura-completa':{LECTURA_COMPLETA:Symbol('qa250')},
 '@/app/actions/fiesta/fiesta.actions':{getFiestaById:raw,requireFiestaWriteAccess:async()=>{throw new Error('Unexpected session-required branch');}},
 '@/lib/generic-json-store':storage,'@/lib/fiesta/get-fiesta-raw':secrets,
 '@/lib/auth/equipo-de-la-fiesta':{quienEsElEquipo:async()=>()=>false},
});
const utils=load('src/lib/utils.ts',['getUruguayParts','hoyEnUruguay']);
const engine=load('src/lib/invitaciones/recordatorio-no-abiertas.ts',null,{}, {
 'server-only':{},'@/lib/utils':utils,
 '@/lib/data-service':{readData:async(file,def)=>{if(file==='fiestas.json')return [clone(await raw())];if(file==='ajustes-recordatorio-invitacion.json')return{activo:true};if(file==='_google-workspace-accounts.json')return[{id:'qa250-company',kind:'company',status:'connected',accessToken:'qa250-double'}];throw new Error(`Unknown file ${file}`);},writeData:async()=>{throw new Error('Unexpected write');}},
 '@/lib/whatsapp/meta-sender':{sendMetaWhatsAppMessage:async()=>{throw new Error('Unexpected WhatsApp path');}},
 '@/app/actions/scheduled-messages':{saveScheduledMessage:async value=>{fallback.push(clone(value));return{success:false,error:'QA250_FALLBACK_WRITE_FAILED'};}},
 '@/lib/whatsapp/internal-token':{WHATSAPP_AUTOMATION_INTERNAL_TOKEN:Symbol('qa250-only')},
 '@/lib/google-workspace':{sendGoogleGmailMessage:async(...args)=>{mails.push(clone(args));if(rejectMail)throw Object.assign(new Error('QA250_GMAIL_HTTP403_REJECTED'),{status:403});return{id:'qa250-sender-double'};},ensureFreshGoogleAccount:async a=>a,hasServiceAccountKey:()=>false,getServiceAccountAccessToken:async()=>null,GOOGLE_WORKSPACE_SCOPES:[]},
 '@/lib/fiesta/actualizar-fiesta':{actualizarFiesta:async(...args)=>{if(beforeSave){const f=beforeSave;beforeSave=null;await f();}return updater.actualizarFiesta(...args);}},
});
async function reset(){mails=[];fallback=[];beforeSave=null;rejectMail=false;await db.collection('fiestas').doc(id).set({id,configuracion:{nombreEvento:'Fiesta ficticia QA250',fechaEvento:'2026-10-11'},invitados:[{id:'qa250-guest',nombre:'Persona QA250',contacto:'persona@qa.invalid',guestAccessToken:'qa250-token',rsvp:'Pendiente'}],clientPortalSettings:{enabled:true,accessKey:'qa250-key'}});}
const check=(name,pass,observed)=>cases.push({id:name,pass:Boolean(pass),observed});let unexpected,cleanup;
try{
 await reset();beforeSave=()=>db.collection('fiestas').doc(id).update({'configuracion.fechaEvento':'2026-12-01'});const moved=await engine.correrTareaRecordarInvitacionNoAbierta(now);check('SDK-rescheduled-party-not-contacted-at-old-moment',mails.length===0,{result:moved,mails:mails.length,stored:await raw()});
 await reset();rejectMail=true;const first=await engine.correrTareaRecordarInvitacionNoAbierta(now),second=await engine.correrTareaRecordarInvitacionNoAbierta(now);check('SDK-rejected-delivery-and-failed-fallback-do-not-consume-day',mails.length===2,{first,second,mails:mails.length,fallbackAttempts:fallback.length,stored:await raw()});
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
finally{await db.collection('fiestas').doc(id).delete();cleanup={fiestas:(await db.collection('fiestas').get()).size};await deleteApp(app);globalThis.fetch=network;const receipt={source,hashes,cases,unexpected,cleanup,summary:{total:cases.length,pass:cases.filter(x=>x.pass).length,fail:cases.filter(x=>!x.pass).length},realServices:false,appEdited:false,scope:'Actual reminder engine/date helpers/secrets preservation/fiesta updater/generic Firestore transaction, real Admin SDK demo. Controlled provider rejection, fallback failure, snapshots transport and scheduling. NO HTTP, Gmail/WhatsApp/account/production messages or real provider acceptance.'};fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,unexpected,cleanup,cases}));if(!unexpected&&receipt.summary.fail)process.exitCode=1;}
