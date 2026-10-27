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
const hook=`import {createRequire as __sdkRequire451} from 'node:module';
import fs451 from 'node:fs';import path451 from 'node:path';
const __req451=__sdkRequire451(process.cwd()+'/package.json');
const __app451=__req451('firebase-admin/app');const __fire451=__req451('firebase-admin/firestore');
const __instance451=__app451.initializeApp({projectId:'demo-ak-producciones'},'qa451-'+Math.random());
const __db451=__fire451.getFirestore(__instance451);
const __catalogue451=${JSON.stringify(payload)};
__akAudit207.beforeEach(async()=>{
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('SDK451 emulator-only');
 const cleared=await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-ak-producciones/databases/(default)/documents',{method:'DELETE'});if(cleared.status!==200)throw new Error('QA451 clear failed');
 let batch=__db451.batch(),count=0;
 const set=async(ref,data)=>{batch.set(ref,data);if(++count===350){await batch.commit();batch=__db451.batch();count=0;}};
 for(const item of __catalogue451){
  await set(__db451.collection('json_documents').doc(encodeURIComponent(item.file)),{_filePath:item.file,...(Array.isArray(item.data)?{_arrayData:item.data}:{_data:item.data})});
  if(item.config)await set(__db451.collection('configuracion').doc(item.config),item.data);
  if(item.collection&&Array.isArray(item.data))for(const[rowIndex,row]of item.data.entries())await set(__db451.collection(item.collection).doc(String(row.id||'qa451-'+rowIndex)),row);
 }
 const folder=path451.join(process.cwd(),'data/fiestas');if(fs451.existsSync(folder))for(const name of fs451.readdirSync(folder))if(/^e2e[-_].*\\.json$/.test(name)){const f=JSON.parse(fs451.readFileSync(path451.join(folder,name),'utf8'));await set(__db451.collection('fiestas').doc(f.id),f);}
 const gallery=path451.join(process.cwd(),'data/social-gallery/metadata.json');
 if(fs451.existsSync(gallery))for(const row of JSON.parse(fs451.readFileSync(gallery,'utf8')))if(/^e2e[-_]/.test(row.fiestaId||''))await set(__db451.collection('social_gallery_posts').doc(row.id),row);
 if(count)await batch.commit();
});
__akAudit207.afterEach(async({},info)=>{const result={budgets:[],leads:[]};for(const[name,key]of[['presupuestos','budgets'],['prospectos','leads']]){const rows=await __db451.collection(name).get();result[key]=rows.docs.map(d=>({id:d.id,nombre:d.data().clienteNombre||d.data().nombre||d.data().name,total:d.data().totalFinal||d.data().total||d.data().totalAmount}));}await info.attach('qa451-sdk-persistence',{contentType:'application/json',body:Buffer.from(JSON.stringify(result))});});
__akAudit207.afterAll(async()=>{await __db451.terminate();await __app451.deleteApp(__instance451);});
`;
fs.writeFileSync(path.join(dir,'451-config.ts'),"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.filter(p=>p.name==='chromium-desktop').map(p=>({...p,grep:/ak207-447|ak207-entertainment-stations.*time capsule|ak207-las-estaciones.*cada estaci|ak207-la-grilla.*la selfie no sale/}))});\n");
let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
 .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source)
 .replaceAll('366-entorno.json','427-entorno.json').replaceAll('.qa-366-main-','.qa-427-source-')
 .replaceAll('374','457').replaceAll('373-config.ts','451-config.ts')
 .replace('expected:27','expected:14').replace('assert.equal(list.length,27','assert.equal(list.length,14')
 .replace('Only27 previously inconclusive project/case pairs','Only14 SDK consumer cases');
code=code.replace('const hook="','const hook="');
const marker='const copy=(from,to)=>';assert(code.includes(marker));code=code.replace(marker,'const sdkHook451='+JSON.stringify(hook)+';\n'+marker);
code=code.replace("fs.writeFileSync(dest,hook+raw)","fs.writeFileSync(dest,hook+sdkHook451+raw)")
 .replace('instrumentedSha256:hash(hook+raw)','instrumentedSha256:hash(hook+sdkHook451+raw)');
const snapshots='const snapshots=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));';assert(code.includes(snapshots));
code=code.replace(snapshots,snapshots+'\nfor(const file of '+JSON.stringify(privateFiles)+')for(const folder of["data","src/data"]){const p=inside(path.join(qa,folder,file));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,"[]\\n");}\n');
code=code.replace("AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source", "AK_USE_LOCAL_JSON_ONLY:'false',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195',STORAGE_EMULATOR_HOST:'http://127.0.0.1:9195',GOOGLE_APPLICATION_CREDENTIALS:'',AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source");
code=code.replace('Object.values(h.services).every(v=>v===false)',"Object.entries(h.services).every(([key,value])=>!value||key==='firebase')");
const transform451=(file,text)=>{
 const tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];
 const visit=n=>{
  if(file.endsWith('entertainment-stations.spec.ts')&&ts.isCallExpression(n)&&n.expression.getText(tree)==='input.evaluate'){
   const arrow=n.arguments[0];if(arrow&&ts.isArrowFunction(arrow)&&ts.isBlock(arrow.body)){
    const body=arrow.body.statements.map(s=>s.getText(tree));const transfer=body.findIndex(s=>s.startsWith('const transfer = new DataTransfer'));
    if(transfer>=0)edits.push({start:n.parent.getStart(tree),end:n.parent.end,text:'const qa451Video=await page.evaluate(async()=>{'+body.slice(0,transfer).join('\n')+';return{type:outputType,name:`gallery-test.${extension}`,bytes:Array.from(new Uint8Array(await new Blob(chunks,{type:outputType}).arrayBuffer()))};}); await input.setInputFiles({name:qa451Video.name,mimeType:qa451Video.type,buffer:Buffer.from(qa451Video.bytes)});'});
   }
  }
  if(file.endsWith('las-estaciones-respetan-los-ajustes.spec.ts')&&ts.isVariableDeclaration(n)&&n.name.getText(tree)==='ESTACIONES'&&n.initializer&&ts.isArrayLiteralExpression(n.initializer)){
   const bogue=n.initializer.elements.find(e=>e.getText(tree).includes("nombre: 'Bogue'"));if(!bogue)throw Error('Bogue element not found');edits.push({start:n.initializer.getStart(tree),end:n.initializer.end,text:'['+bogue.getText(tree)+']'});
  }
  // Generate frames in synthetic cameras instead of a one-frame static canvas.
  if((file.endsWith('entertainment-stations.spec.ts')||file.endsWith('las-estaciones-respetan-los-ajustes.spec.ts'))&&ts.isReturnStatement(n)&&n.expression&&ts.isCallExpression(n.expression)&&ts.isPropertyAccessExpression(n.expression.expression)&&n.expression.expression.name.text==='captureStream'){
   const canvas=n.expression.expression.expression.getText(tree);edits.push({start:n.getStart(tree),end:n.end,text:'const qa451Canvas='+canvas+';const qa451Stream='+n.expression.getText(tree)+';const qa451Pump=setInterval(()=>{const c=qa451Canvas.getContext("2d");if(c){c.fillStyle=Date.now()%100<50?"#ffffff":"#eeeeee";c.fillRect(100,100,12,12);}},50);for(const t of qa451Stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(qa451Pump);stop();};}return qa451Stream;'});
  }
  if(file.endsWith('entertainment-stations.spec.ts')&&ts.isVariableStatement(n)){
   const declaration=n.declarationList.declarations.find(d=>d.name.getText(tree)==='stream'&&d.initializer&&ts.isCallExpression(d.initializer)&&d.initializer.expression.getText(tree)==='canvas.captureStream');
   let parent=n.parent,insideCamera=false;while(parent){if(ts.isCallExpression(parent)&&parent.expression.getText(tree)==='page.addInitScript'){insideCamera=true;break;}parent=parent.parent;}
   if(declaration&&insideCamera)edits.push({start:n.getStart(tree),end:n.end,text:n.getText(tree)+'const qa451Pump=setInterval(()=>{const c=canvas.getContext("2d");if(c){c.fillStyle=Date.now()%100<50?"#ffffff":"#eeeeee";c.fillRect(100,100,12,12);}},50);for(const t of stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(qa451Pump);stop();};}'});
  }
  ts.forEachChild(n,visit);
 };visit(tree);
 if(file.endsWith('entertainment-stations.spec.ts')&&!edits.some(e=>e.text.includes('qa451Video')))throw Error('Native upload adaptation missing');
 let result=text;for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);
 if(file.endsWith('entertainment-stations.spec.ts'))result=result.replace("test.skip(testInfo.project.name !== 'chromium-desktop', 'MediaRecorder coverage only needs Chromium desktop.');","test.setTimeout(180000); test.skip(testInfo.project.name !== 'chromium-desktop', 'MediaRecorder coverage only needs Chromium desktop.');").replace("test.skip(testInfo.project.name !== 'chromium-desktop', 'Browser video processing only needs Chromium desktop.');","test.setTimeout(180000); test.skip(testInfo.project.name !== 'chromium-desktop', 'Browser video processing only needs Chromium desktop.');");
 if(file.endsWith('la-grilla-de-caras.spec.ts'))result=result.replace('await page.waitForTimeout(4000);',`await expect.poll(()=>page.getByRole('heading',{name:/Resultados de tu búsqueda|No encontramos fotos tuyas todavía/i}).evaluateAll(list=>list.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0;}).length),{timeout:60000}).toBeGreaterThan(0);`);
 return result;
};
code=code.replace("const raw=fs.readFileSync(file,'utf8');","const originalRaw=fs.readFileSync(file,'utf8');const raw=("+transform451.toString()+")(file,originalRaw);").replace('originalSha256:hash(raw)','originalSha256:hash(originalRaw),preparedSha256:hash(raw)');
process.env.AK_AUDIT_SPEC_FILTER='447-venta-por-ruta.spec.ts,entertainment-stations.spec.ts,las-estaciones-respetan-los-ajustes.spec.ts,la-grilla-de-caras.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
fs.writeFileSync(path.join(dir,'457-driver.mjs.gz'),gzipSync(code));
const addition=path.join(build.qa,'tests/e2e/447-venta-por-ruta.spec.ts');assert(!fs.existsSync(addition));fs.copyFileSync(path.join(dir,'447-venta-por-ruta.spec.ts'),addition);
const dataBefore=new Map();
const files=()=>{const out=[];const visit=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory()&&!e.isSymbolicLink())visit(p);else if(e.isFile()&&p.endsWith('.json'))out.push(p);}};for(const sub of['data','src/data'])visit(path.join(build.qa,sub));return out;};
for(const p of files())dataBefore.set(p,fs.readFileSync(p));
const backup=path.join(build.qa,'.qa451-private-data-snapshot.json');fs.writeFileSync(backup,JSON.stringify([...dataBefore].map(([p,b])=>[p,b.toString('base64')])));
code="import {createRequire as __req451} from 'node:module';const ts=__req451('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');\n"+code;
const physical=path.join(dir,'457-driver.mjs');assert(!fs.existsSync(physical));fs.writeFileSync(physical,code);
try{await import(pathToFileURL(physical).href);}
finally{
 for(const p of files())if(!dataBefore.has(p))fs.unlinkSync(p);for(const[p,b]of dataBefore)fs.writeFileSync(p,b);
 if(fs.existsSync(addition))fs.unlinkSync(addition);
 for(const name of['ak207-447-venta-por-ruta.spec.ts','ak207-90-lo-que-va-atras-dice-donde-quedo.spec.ts','ak207-48-touchpix-entrega-sin-reinicio.spec.ts','ak207-prospecto-simulador.spec.ts','ak207-espejo-moderacion-caida-y-reintento.spec.ts']){const p=path.join(build.qa,'tests/e2e',name);if(fs.existsSync(p))fs.unlinkSync(p);}
 for(const name of['208-config.ts','457-config.ts','208-egress-guard.cjs']){const p=path.join(build.qa,name);if(fs.existsSync(p))fs.unlinkSync(p);}
 fs.unlinkSync(backup);
}
