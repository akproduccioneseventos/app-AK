import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='917a98e32c63fe2f832f5cdc16db87f4fc722b6c';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
const build=JSON.parse(fs.readFileSync(path.join(dir,'406-entorno.json'),'utf8'));assert.equal(build.source,source);assert.equal(build.phase,'built');
const ts=createRequire(path.join(build.qa,'package.json'))('typescript');
const mappingText=fs.readFileSync(path.join(build.qa,'src/lib/firebase-sync.ts'),'utf8'),tree=ts.createSourceFile('mapping.ts',mappingText,ts.ScriptTarget.Latest,true);
const mapping=name=>{let object;for(const stmt of tree.statements)if(ts.isVariableStatement(stmt))for(const v of stmt.declarationList.declarations)if(v.name.getText(tree)===name)object=v.initializer;assert(object&&ts.isObjectLiteralExpression(object));return Object.fromEntries(object.properties.map(p=>{assert(ts.isPropertyAssignment(p)&&ts.isStringLiteral(p.initializer));return[p.name.text,p.initializer.text];}));};
const collections=mapping('FILE_TO_COLLECTION'),configs=mapping('CONFIG_FILES');
const publicFiles=['servicios-empresa.json','menus-catering.json','insumos.json','budget-display-settings.json','armado-rapido-config.json','invoice-template-settings.json','crm-stages.json'];
const privateFiles=['presupuestos.json','crm-leads.json','customers.json','notifications.json','invoices.json','scheduled-messages.json','crm-timeline.json'];
const payload=[];for(const file of publicFiles){const candidate=['data','src/data'].map(d=>path.join(build.qa,d,file)).find(p=>fs.existsSync(p));if(candidate)payload.push({file,data:JSON.parse(fs.readFileSync(candidate,'utf8')),collection:collections[file]||null,config:configs[file]||null});}
assert(payload.some(p=>p.file==='servicios-empresa.json')&&payload.some(p=>p.file==='menus-catering.json'));
for(const file of privateFiles)payload.push({file,data:[],collection:collections[file]||null,config:null});
const hook=`import {createRequire as __sdkRequire420} from 'node:module';
import fs420 from 'node:fs';import path420 from 'node:path';
const __req420=__sdkRequire420(process.cwd()+'/package.json');
const __app420=__req420('firebase-admin/app');const __fire420=__req420('firebase-admin/firestore');
const __instance420=__app420.initializeApp({projectId:'demo-ak-producciones'},'qa420-'+Math.random());
const __db420=__fire420.getFirestore(__instance420);
const __catalogue420=${JSON.stringify(payload)};
__akAudit207.beforeEach(async()=>{
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('SDK420 emulator-only');
 const cleared=await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-ak-producciones/databases/(default)/documents',{method:'DELETE'});if(cleared.status!==200)throw new Error('QA420 clear failed');
 let batch=__db420.batch(),count=0;
 const set=async(ref,data)=>{batch.set(ref,data);if(++count===350){await batch.commit();batch=__db420.batch();count=0;}};
 for(const item of __catalogue420){
  await set(__db420.collection('json_documents').doc(encodeURIComponent(item.file)),{_filePath:item.file,...(Array.isArray(item.data)?{_arrayData:item.data}:{_data:item.data})});
  if(item.config)await set(__db420.collection('configuracion').doc(item.config),item.data);
  if(item.collection&&Array.isArray(item.data))for(const[rowIndex,row]of item.data.entries())await set(__db420.collection(item.collection).doc(String(row.id||'qa420-'+rowIndex)),row);
 }
 const folder=path420.join(process.cwd(),'data/fiestas');if(fs420.existsSync(folder))for(const name of fs420.readdirSync(folder))if(/^e2e_.*\\.json$/.test(name)){const f=JSON.parse(fs420.readFileSync(path420.join(folder,name),'utf8'));await set(__db420.collection('fiestas').doc(f.id),f);}
 if(count)await batch.commit();
});
__akAudit207.afterEach(async({},info)=>{const result={budgets:[],leads:[]};for(const[name,key]of[['presupuestos','budgets'],['prospectos','leads']]){const rows=await __db420.collection(name).get();result[key]=rows.docs.map(d=>({id:d.id,nombre:d.data().clienteNombre||d.data().nombre||d.data().name,total:d.data().totalFinal||d.data().total||d.data().totalAmount}));}await info.attach('qa420-sdk-persistence',{contentType:'application/json',body:Buffer.from(JSON.stringify(result))});});
__akAudit207.afterAll(async()=>{await __db420.terminate();await __app420.deleteApp(__instance420);});
`;
fs.writeFileSync(path.join(dir,'420-config.ts'),"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.map(p=>({...p,grep:p.name==='chromium-desktop'?/ak207-423|ak207-90.*Fotocabina|ak207-prospecto-simulador.*llega desde el simulador hasta ver un precio/:/ak207-423|ak207-90.*Fotocabina|ak207-48-touchpix.*ENT-03/}))});\n");
let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
 .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source)
 .replaceAll('366-entorno.json','406-entorno.json').replaceAll('.qa-366-main-','.qa-392-candidate-')
 .replaceAll('374','422').replaceAll('373-config.ts','420-config.ts')
 .replace('expected:27','expected:8').replace('assert.equal(list.length,27','assert.equal(list.length,8')
 .replace('Only27 previously inconclusive project/case pairs','Only8 SDK consumer cases');
code=code.replace('const hook="','const hook="');
const marker='const copy=(from,to)=>';assert(code.includes(marker));code=code.replace(marker,'const sdkHook420='+JSON.stringify(hook)+';\n'+marker);
code=code.replace("fs.writeFileSync(dest,hook+raw)","fs.writeFileSync(dest,hook+sdkHook420+raw)")
 .replace('instrumentedSha256:hash(hook+raw)','instrumentedSha256:hash(hook+sdkHook420+raw)');
const snapshots='const snapshots=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));';assert(code.includes(snapshots));
code=code.replace(snapshots,snapshots+'\nfor(const file of '+JSON.stringify(privateFiles)+')for(const folder of["data","src/data"]){const p=inside(path.join(qa,folder,file));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,"[]\\n");}\n');
code=code.replace("AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source", "AK_USE_LOCAL_JSON_ONLY:'false',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195',STORAGE_EMULATOR_HOST:'http://127.0.0.1:9195',GOOGLE_APPLICATION_CREDENTIALS:'',AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source");
code=code.replace('Object.values(h.services).every(v=>v===false)',"Object.entries(h.services).every(([key,value])=>!value||key==='firebase')");
process.env.AK_AUDIT_SPEC_FILTER='423-barra-pixeles.spec.ts,90-lo-que-va-atras-dice-donde-quedo.spec.ts,48-touchpix-entrega-sin-reinicio.spec.ts,prospecto-simulador.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
fs.writeFileSync(path.join(dir,'422-driver.mjs.gz'),gzipSync(code));
const addition=path.join(build.qa,'tests/e2e/423-barra-pixeles.spec.ts');assert(!fs.existsSync(addition));fs.copyFileSync(path.join(dir,'423-barra-pixeles.spec.ts'),addition);
try{await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}
finally{if(fs.existsSync(addition))fs.unlinkSync(addition);}
