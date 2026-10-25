import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='917a98e32c63fe2f832f5cdc16db87f4fc722b6c';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
const build=JSON.parse(fs.readFileSync(path.join(dir,'427-entorno.json'),'utf8'));assert.equal(build.source,source);assert.equal(build.phase,'built');
const ts=createRequire(path.join(build.qa,'package.json'))('typescript');
const mappingText=fs.readFileSync(path.join(build.qa,'src/lib/firebase-sync.ts'),'utf8'),tree=ts.createSourceFile('mapping.ts',mappingText,ts.ScriptTarget.Latest,true);
const mapping=name=>{let object;for(const stmt of tree.statements)if(ts.isVariableStatement(stmt))for(const v of stmt.declarationList.declarations)if(v.name.getText(tree)===name)object=v.initializer;assert(object&&ts.isObjectLiteralExpression(object));return Object.fromEntries(object.properties.map(p=>{assert(ts.isPropertyAssignment(p)&&ts.isStringLiteral(p.initializer));return[p.name.text,p.initializer.text];}));};
const collections=mapping('FILE_TO_COLLECTION'),configs=mapping('CONFIG_FILES');
const publicFiles=['servicios-empresa.json','menus-catering.json','insumos.json','budget-display-settings.json','armado-rapido-config.json','invoice-template-settings.json','crm-stages.json'];
const privateFiles=['presupuestos.json','crm-leads.json','customers.json','notifications.json','invoices.json','scheduled-messages.json','crm-timeline.json'];
const payload=[];for(const file of publicFiles){const candidate=['data','src/data'].map(d=>path.join(build.qa,d,file)).find(p=>fs.existsSync(p));if(candidate)payload.push({file,data:JSON.parse(fs.readFileSync(candidate,'utf8')),collection:collections[file]||null,config:configs[file]||null});}
assert(payload.some(p=>p.file==='servicios-empresa.json')&&payload.some(p=>p.file==='menus-catering.json'));
for(const file of privateFiles)payload.push({file,data:[],collection:collections[file]||null,config:null});
const hook=`import {createRequire as __sdkRequire439} from 'node:module';
import fs439 from 'node:fs';import path439 from 'node:path';
const __req439=__sdkRequire439(process.cwd()+'/package.json');
const __app439=__req439('firebase-admin/app');const __fire439=__req439('firebase-admin/firestore');
const __instance439=__app439.initializeApp({projectId:'demo-ak-producciones'},'qa439-'+Math.random());
const __db439=__fire439.getFirestore(__instance439);
const __catalogue439=${JSON.stringify(payload)};
__akAudit207.beforeEach(async()=>{
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('SDK439 emulator-only');
 const cleared=await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-ak-producciones/databases/(default)/documents',{method:'DELETE'});if(cleared.status!==200)throw new Error('QA439 clear failed');
 let batch=__db439.batch(),count=0;
 const set=async(ref,data)=>{batch.set(ref,data);if(++count===350){await batch.commit();batch=__db439.batch();count=0;}};
 for(const item of __catalogue439){
  await set(__db439.collection('json_documents').doc(encodeURIComponent(item.file)),{_filePath:item.file,...(Array.isArray(item.data)?{_arrayData:item.data}:{_data:item.data})});
  if(item.config)await set(__db439.collection('configuracion').doc(item.config),item.data);
  if(item.collection&&Array.isArray(item.data))for(const[rowIndex,row]of item.data.entries())await set(__db439.collection(item.collection).doc(String(row.id||'qa439-'+rowIndex)),row);
 }
 const folder=path439.join(process.cwd(),'data/fiestas');if(fs439.existsSync(folder))for(const name of fs439.readdirSync(folder))if(/^e2e_.*\\.json$/.test(name)){const f=JSON.parse(fs439.readFileSync(path439.join(folder,name),'utf8'));await set(__db439.collection('fiestas').doc(f.id),f);}
 if(count)await batch.commit();
});
__akAudit207.afterEach(async({},info)=>{const result={budgets:[],leads:[]};for(const[name,key]of[['presupuestos','budgets'],['prospectos','leads']]){const rows=await __db439.collection(name).get();result[key]=rows.docs.map(d=>({id:d.id,nombre:d.data().clienteNombre||d.data().nombre||d.data().name,total:d.data().totalFinal||d.data().total||d.data().totalAmount}));}await info.attach('qa439-sdk-persistence',{contentType:'application/json',body:Buffer.from(JSON.stringify(result))});});
__akAudit207.afterAll(async()=>{await __db439.terminate();await __app439.deleteApp(__instance439);});
`;
fs.writeFileSync(path.join(dir,'439-config.ts'),"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.map(p=>({...p,grep:p.name==='chromium-desktop'?/ak207-438|ak207-prospecto-simulador.*llega desde el simulador hasta ver un precio/:/ak207-438.*(?:red|rechazo)|ak207-espejo-moderacion.*con el analisis de imagen caido/}))});\n");
let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
 .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source)
 .replaceAll('366-entorno.json','427-entorno.json').replaceAll('.qa-366-main-','.qa-427-source-')
 .replaceAll('374','442').replaceAll('373-config.ts','439-config.ts')
 .replace('expected:27','expected:8').replace('assert.equal(list.length,27','assert.equal(list.length,8')
 .replace('Only27 previously inconclusive project/case pairs','Only8 SDK consumer cases');
code=code.replace('const hook="','const hook="');
const marker='const copy=(from,to)=>';assert(code.includes(marker));code=code.replace(marker,'const sdkHook439='+JSON.stringify(hook)+';\n'+marker);
code=code.replace("fs.writeFileSync(dest,hook+raw)","fs.writeFileSync(dest,hook+sdkHook439+raw)")
 .replace('instrumentedSha256:hash(hook+raw)','instrumentedSha256:hash(hook+sdkHook439+raw)');
const snapshots='const snapshots=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));';assert(code.includes(snapshots));
code=code.replace(snapshots,snapshots+'\nfor(const file of '+JSON.stringify(privateFiles)+')for(const folder of["data","src/data"]){const p=inside(path.join(qa,folder,file));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,"[]\\n");}\n');
code=code.replace("AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source", "AK_USE_LOCAL_JSON_ONLY:'false',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195',STORAGE_EMULATOR_HOST:'http://127.0.0.1:9195',GOOGLE_APPLICATION_CREDENTIALS:'',AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source");
code=code.replace('Object.values(h.services).every(v=>v===false)',"Object.entries(h.services).every(([key,value])=>!value||key==='firebase')");
const transform439=(file,text)=>{const tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];const scan=n=>{if(file.endsWith('espejo-moderacion-caida-y-reintento.spec.ts')&&ts.isExpressionStatement(n)&&ts.isCallExpression(n.expression)&&n.expression.expression.getText(tree)==='test.skip'&&n.expression.arguments[0]?.getText(tree).includes("project.name !== 'chromium-desktop'"))edits.push({start:n.getStart(tree),end:n.end,text:''});if(file.endsWith('prospecto-simulador.spec.ts')&&ts.isIfStatement(n)&&n.expression.getText(tree).includes('verResumen.isVisible'))edits.push({start:n.getStart(tree),end:n.end,text:'await expect(verResumen).toBeVisible({timeout:45000});\n'+n.thenStatement.getText(tree)});ts.forEachChild(n,scan);};scan(tree);let result=text;for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);return result;};
code=code.replace("const raw=fs.readFileSync(file,'utf8');","const originalRaw=fs.readFileSync(file,'utf8');const raw=("+transform439.toString()+")(file,originalRaw);").replace('originalSha256:hash(raw)','originalSha256:hash(originalRaw),preparedSha256:hash(raw)');
process.env.AK_AUDIT_SPEC_FILTER='438-fotocabina-sdk.spec.ts,prospecto-simulador.spec.ts,espejo-moderacion-caida-y-reintento.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
fs.writeFileSync(path.join(dir,'442-driver.mjs.gz'),gzipSync(code));
const addition=path.join(build.qa,'tests/e2e/438-fotocabina-sdk.spec.ts');assert(!fs.existsSync(addition));fs.copyFileSync(path.join(dir,'438-fotocabina-sdk.spec.ts'),addition);
const dataBefore=new Map();
const files=()=>{const out=[];const visit=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory()&&!e.isSymbolicLink())visit(p);else if(e.isFile()&&p.endsWith('.json'))out.push(p);}};for(const sub of['data','src/data'])visit(path.join(build.qa,sub));return out;};
for(const p of files())dataBefore.set(p,fs.readFileSync(p));
const backup=path.join(build.qa,'.qa439-private-data-snapshot.json');fs.writeFileSync(backup,JSON.stringify([...dataBefore].map(([p,b])=>[p,b.toString('base64')])));
code="import {createRequire as __req439} from 'node:module';const ts=__req439('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');\n"+code;
const physical=path.join(dir,'442-driver.mjs');assert(!fs.existsSync(physical));fs.writeFileSync(physical,code);
try{await import(pathToFileURL(physical).href);}
finally{
 for(const p of files())if(!dataBefore.has(p))fs.unlinkSync(p);for(const[p,b]of dataBefore)fs.writeFileSync(p,b);
 if(fs.existsSync(addition))fs.unlinkSync(addition);
 for(const name of['ak207-438-fotocabina-sdk.spec.ts','ak207-90-lo-que-va-atras-dice-donde-quedo.spec.ts','ak207-48-touchpix-entrega-sin-reinicio.spec.ts','ak207-prospecto-simulador.spec.ts','ak207-espejo-moderacion-caida-y-reintento.spec.ts']){const p=path.join(build.qa,'tests/e2e',name);if(fs.existsSync(p))fs.unlinkSync(p);}
 for(const name of['208-config.ts','442-config.ts','208-egress-guard.cjs']){const p=path.join(build.qa,name);if(fs.existsSync(p))fs.unlinkSync(p);}
 fs.unlinkSync(backup);
}
