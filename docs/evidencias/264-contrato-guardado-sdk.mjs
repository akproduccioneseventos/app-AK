import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),source='725e62ba2f909578628fad47402d125ed9632c70';
const target=new URL('264-contrato-guardado-sdk.json',import.meta.url);assert(!fs.existsSync(target),'Preserve');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
const req=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts=req('typescript'),{initializeApp,deleteApp}=req('firebase-admin/app'),{getFirestore}=req('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-ak-producciones'},'qa264'),db=getFirestore(app);db.settings({ignoreUndefinedProperties:true});
const id='qa264-party',hashes={},cases=[],digest=t=>crypto.createHash('sha256').update(t).digest('hex');
const textA='Contrato ficticio QA264 version A.',textB='Contrato ficticio QA264 version B.';
function load(file,names=null,globals={},deps={}){
 const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:6*1024**2});assert.equal(r.status,0,r.stderr);hashes[file]=digest(r.stdout);
 const ast=ts.createSourceFile(file,r.stdout,ts.ScriptTarget.Latest,true),nodes=names?ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))):ast.statements;
 if(names)for(const name of names)assert(nodes.some(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name||ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)===name)),name);
 const code=ts.transpileModule(nodes.map(n=>n.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText+(names?`\nexports.__qa={${names.join(',')}};`:'');
 const module={exports:{}};new Function('require','module','exports',...Object.keys(globals),code)(k=>{assert(Object.hasOwn(deps,k),`Unknown ${k}`);return deps[k];},module,module.exports,...Object.values(globals));return names?module.exports.__qa:module.exports;
}
const profiles=load('src/lib/auth/perfiles.ts');
const session={verifySession:async()=>({success:true,user:{userId:'qa264-owner',perfil:'dueno',role:'admin'}})};
const permissions=load('src/lib/auth/require-session.ts',null,{}, {'@/lib/auth/perfiles':profiles,'@/lib/auth/session-token':session});
const raw=async key=>{const d=await db.collection('fiestas').doc(key).get();return d.exists?d.data():null;};
const redaction=load('src/lib/fiesta/recortar-para-afuera.ts',null,{}, {'@/lib/auth/perfiles':profiles});
const storage=load('src/lib/generic-json-store.ts',['getDbAdmin','sinIndefinidos','mutarDocumentoConTransaccion'],{}, {'./firebase/server':{dbAdmin:db}});
const secrets=load('src/lib/fiesta/get-fiesta-raw.ts',['preserveFiestaSecrets'],{getFiestaByIdRaw:raw,reponerLoRecortado:redaction.reponerLoRecortado});
const access=load('src/app/actions/fiesta/fiesta.actions.ts',['requireFiestaWriteAccess'],{esEquipoParaFiesta:async()=>true,verifyPortalSession:async()=>true});
const updater=load('src/lib/fiesta/actualizar-fiesta.ts',['fiestaUpdateQueues','acquireFiestaUpdateLock','actualizarFiesta'],{...access,...storage,...secrets,getFiestaById:raw,LECTURA_COMPLETA:Symbol('qa264-full'),quienEsElEquipo:async()=>()=>true});
const marker=load('src/lib/marca-de-lectura.ts',null,{}, {crypto});
const logger={shouldSkipFirestoreDuringBuild:()=>false,info:()=>{},warn:()=>{},error:()=>{}};
const sync=load('src/lib/firebase-sync.ts',['FILE_TO_COLLECTION','CONFIG_FILES','MAX_RETRIES','isDev','OMIT_FIRESTORE_VALUE','sanitizeForFirestore','withRetry','syncToFirestore'],{logger,...marker},{'./firebase/server':{dbAdmin:db}});
const registry=load('src/lib/backup/backup-registry.ts');
const local=new Map();let beforeWrite=null,writeCount=0;
const data=load('src/lib/data-service.ts',['deepMerge','updateDataPartial'],{
 shouldUseLocalJsonOnly:()=>false,logger,...registry,
 syncToFirestore:async(...args)=>{writeCount++;if(beforeWrite){const hook=beforeWrite;beforeWrite=null;await hook();}return sync.syncToFirestore(...args);},
 readLocalJsonFallback:async file=>local.get(file)||null,writeLocalJsonFallback:async(file,value)=>local.set(file,value),scheduleAutoBackupAfterWrite:async()=>{},
});
const paymentFields=load('src/lib/fiesta/reponer-la-plata.ts');
const partial=load('src/app/actions/fiesta/fiesta.actions.ts',['CAMPOS_DE_PLATA_Y_CONTRATO','PAGO_DE_LA_COMPRA','mismoValor','reponerLaPlata','sinLaPlata','pideCambiarLaPlata','tocaLaPlata','validatePersonalAssignments','updateFiestaPartial'],{
 ...profiles,...permissions,...access,...paymentFields,...redaction,...data,esEquipoParaFiesta:async()=>true,FIESTAS_DIR:'fiestas',
},{'@/lib/auth/session-token':session,'@/lib/fiesta/get-fiesta-raw':{getFiestaByIdRaw:raw},'@/lib/fiesta/recortar-para-afuera':redaction,'@/lib/fiesta/actualizar-fiesta':updater});
const wrapper=load('src/app/actions/fiesta-actual.ts',['updateContratoFiestaActual'],{...profiles,...permissions,FiestaModule:{getFiestaById:raw,...partial}});
let notifications=[];
const signing=load('src/app/actions/fiesta/documentos.actions.ts',['signContractDigitally'],{
 verifyPortalSession:async key=>key===id,actualizarFiesta:updater.actualizarFiesta,headers:async()=>new Headers({'x-real-ip':'192.0.2.26'}),createNotification:async n=>{notifications.push(n);return{success:true};},
},{crypto});
async function reset(){beforeWrite=null;writeCount=0;notifications=[];local.clear();await db.collection('fiestas').doc(id).set({id,configuracion:{nombreEvento:'Evento ficticio QA264'},estado:'Planificando',contratoServicioTexto:textA,contratoFirmaInfo:{isSigned:false},contratoDatos:{planPagos:{activo:false}}});}
const sign=()=>signing.signContractDigitally(id,'Firmante ficticio QA264',false,digest(textA));
const check=(name,pass,observed)=>cases.push({id:name,pass:Boolean(pass),observed});let unexpected,cleanup;
try{
 await reset();assert((await sign()).success);const noChange=await wrapper.updateContratoFiestaActual(id,textB),existing=await raw(id);
 check('already-signed-contract-cannot-change-sequentially',!noChange.success&&existing.contratoServicioTexto===textA&&existing.firmaDigitalConstancia?.textoHuella===digest(textA)&&writeCount===0,{result:noChange,party:existing,writeCount});
 await reset();let signedDuringWrite;
 beforeWrite=async()=>{signedDuringWrite=await sign();assert(signedDuringWrite.success,'Actual signature must commit before writer');};
 const edited=await wrapper.updateContratoFiestaActual(id,textB),final=await raw(id);
 check('contract-save-cannot-change-text-after-concurrent-signature',final.firmaDigitalConstancia?.textoHuella===digest(final.contratoServicioTexto),{result:edited,signedDuringWrite,party:final,expectedHashForStoredText:digest(final.contratoServicioTexto),writeCount,notifications:notifications.length});
}catch(e){unexpected=String(e.stack||e);process.exitCode=2;}
finally{
 await db.collection('fiestas').doc(id).delete();cleanup={fiestas:(await db.collection('fiestas').get()).size};await deleteApp(app);
 const receipt={source,hashes,cases,unexpected,cleanup,summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},scope:'Actual updateContratoFiestaActual -> updateFiestaPartial -> updateDataPartial -> syncToFirestore document merge, actual signContractDigitally -> actualizarFiesta and Firestore AdminSDK demo. Identity/portal predicate/event access, local fallback/backup and notifications controlled; no HTTP/native/PDF/legal validity or provider. Signing injected immediately before actual sync write, after guards. No app edits.'};
 fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));if(!unexpected&&receipt.summary.fail)process.exitCode=1;
}
