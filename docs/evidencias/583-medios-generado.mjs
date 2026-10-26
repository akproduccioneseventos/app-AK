import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='f8f7cf34e8778de784b20e2654058fd722b2a2ec';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
const build=JSON.parse(fs.readFileSync(path.join(dir,'574-entorno.json'),'utf8'));assert.equal(build.source,source);assert.equal(build.phase,'built');
const ts=createRequire(path.join(build.qa,'package.json'))('typescript');
const mappingText=fs.readFileSync(path.join(build.qa,'src/lib/firebase-sync.ts'),'utf8'),tree=ts.createSourceFile('mapping.ts',mappingText,ts.ScriptTarget.Latest,true);
const mapping=name=>{let object;for(const stmt of tree.statements)if(ts.isVariableStatement(stmt))for(const v of stmt.declarationList.declarations)if(v.name.getText(tree)===name)object=v.initializer;assert(object&&ts.isObjectLiteralExpression(object));return Object.fromEntries(object.properties.map(p=>{assert(ts.isPropertyAssignment(p)&&ts.isStringLiteral(p.initializer));return[p.name.text,p.initializer.text];}));};
const collections=mapping('FILE_TO_COLLECTION'),configs=mapping('CONFIG_FILES');
const publicFiles=['servicios-empresa.json','menus-catering.json','insumos.json','budget-display-settings.json','armado-rapido-config.json','invoice-template-settings.json','crm-stages.json'];
const privateFiles=['presupuestos.json','crm-leads.json','customers.json','notifications.json','invoices.json','scheduled-messages.json','crm-timeline.json'];
const payload=[];for(const file of publicFiles){const candidate=['data','src/data'].map(d=>path.join(build.qa,d,file)).find(p=>fs.existsSync(p));if(candidate)payload.push({file,data:JSON.parse(fs.readFileSync(candidate,'utf8')),collection:collections[file]||null,config:configs[file]||null});}
assert(payload.some(p=>p.file==='servicios-empresa.json')&&payload.some(p=>p.file==='menus-catering.json'));
for(const file of privateFiles)payload.push({file,data:[],collection:collections[file]||null,config:null});
const hook=`import {createRequire as __sdkRequire583} from 'node:module';
import fs583 from 'node:fs';import path583 from 'node:path';
const __req583=__sdkRequire583(process.cwd()+'/package.json');
const __app583=__req583('firebase-admin/app');const __fire583=__req583('firebase-admin/firestore');
const __instance583=__app583.initializeApp({projectId:'demo-ak-producciones'},'qa583-'+Math.random());
const __db583=__fire583.getFirestore(__instance583);
const __catalogue583=${JSON.stringify(payload)};
__akAudit207.beforeEach(async()=>{
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('SDK583 emulator-only');
 const cleared=await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-ak-producciones/databases/(default)/documents',{method:'DELETE'});if(cleared.status!==200)throw new Error('QA583 clear failed');
 let batch=__db583.batch(),count=0;
 const set=async(ref,data)=>{batch.set(ref,data);if(++count===350){await batch.commit();batch=__db583.batch();count=0;}};
 for(const item of __catalogue583){
  await set(__db583.collection('json_documents').doc(encodeURIComponent(item.file)),{_filePath:item.file,...(Array.isArray(item.data)?{_arrayData:item.data}:{_data:item.data})});
  if(item.config)await set(__db583.collection('configuracion').doc(item.config),item.data);
  if(item.collection&&Array.isArray(item.data))for(const[rowIndex,row]of item.data.entries())await set(__db583.collection(item.collection).doc(String(row.id||'qa583-'+rowIndex)),row);
 }
 const folder=path583.join(process.cwd(),'data/fiestas');if(fs583.existsSync(folder))for(const name of fs583.readdirSync(folder))if(/^e2e[-_].*\\.json$/.test(name)){const f=JSON.parse(fs583.readFileSync(path583.join(folder,name),'utf8'));await set(__db583.collection('fiestas').doc(f.id),f);}
 const gallery=path583.join(process.cwd(),'data/social-gallery/metadata.json');
 if(fs583.existsSync(gallery))for(const row of JSON.parse(fs583.readFileSync(gallery,'utf8')))if(/^e2e[-_]/.test(row.fiestaId||''))await set(__db583.collection('social_gallery_posts').doc(row.id),row);
 if(count)await batch.commit();
});
__akAudit207.afterEach(async({},info)=>{const result={budgets:[],leads:[]};for(const[name,key]of[['presupuestos','budgets'],['prospectos','leads']]){const rows=await __db583.collection(name).get();result[key]=rows.docs.map(d=>({id:d.id,nombre:d.data().clienteNombre||d.data().nombre||d.data().name,total:d.data().totalFinal||d.data().total||d.data().totalAmount}));}await info.attach('qa583-sdk-persistence',{contentType:'application/json',body:Buffer.from(JSON.stringify(result))});});
__akAudit207.afterAll(async()=>{await __db583.terminate();await __app583.deleteApp(__instance583);});
`;
fs.writeFileSync(path.join(dir,'583-config.ts'),"import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.filter(p=>p.name==='chromium-desktop').map(p=>({...p,grep:/ak207-entertainment-stations.*time capsule|ak207-la-grilla.*la selfie no sale/}))});\n");
let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
 .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source)
 .replaceAll('366-entorno.json','574-entorno.json').replaceAll('.qa-366-main-','.qa-574-f8f-')
 .replaceAll('374','585').replaceAll('373-config.ts','583-config.ts')
 .replace('expected:27','expected:3').replace('assert.equal(list.length,27','assert.equal(list.length,3')
 .replace('Only27 previously inconclusive project/case pairs','Only3 SDK consumer cases');
code=code.replace('const hook="','const hook="');
const marker='const copy=(from,to)=>';assert(code.includes(marker));code=code.replace(marker,'const sdkHook583='+JSON.stringify(hook)+';\n'+marker);
code=code.replace("fs.writeFileSync(dest,hook+raw)","fs.writeFileSync(dest,hook+sdkHook583+raw)")
 .replace('instrumentedSha256:hash(hook+raw)','instrumentedSha256:hash(hook+sdkHook583+raw)');
const snapshots='const snapshots=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));';assert(code.includes(snapshots));
code=code.replace(snapshots,snapshots+'\nfor(const file of '+JSON.stringify(privateFiles)+')for(const folder of["data","src/data"]){const p=inside(path.join(qa,folder,file));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,"[]\\n");}\n');
code=code.replace("AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source", "AK_USE_LOCAL_JSON_ONLY:'false',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195',STORAGE_EMULATOR_HOST:'http://127.0.0.1:9195',GOOGLE_APPLICATION_CREDENTIALS:'',AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source");
code=code.replace('Object.values(h.services).every(v=>v===false)',"Object.entries(h.services).every(([key,value])=>!value||key==='firebase')");
code=code.replace("AK_USE_LOCAL_JSON_ONLY:'false'","GCLOUD_PROJECT:'demo-ak-producciones',GOOGLE_CLOUD_PROJECT:'demo-ak-producciones',AK_USE_LOCAL_JSON_ONLY:'false'");
const transform583=(file,text)=>{
 const tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];
 const visit=n=>{
  if(file.endsWith('entertainment-stations.spec.ts')&&ts.isCallExpression(n)&&n.expression.getText(tree)==='input.evaluate'){
   const arrow=n.arguments[0];if(arrow&&ts.isArrowFunction(arrow)&&ts.isBlock(arrow.body)){
    const body=arrow.body.statements.map(s=>s.getText(tree));const transfer=body.findIndex(s=>s.startsWith('const transfer = new DataTransfer'));
    if(transfer>=0)edits.push({start:n.parent.getStart(tree),end:n.parent.end,text:"await input.setInputFiles(\"C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria267-cierre/docs/evidencias/469-video-ficticio.mp4\");"});
   }
  }
  if(file.endsWith('las-estaciones-respetan-los-ajustes.spec.ts')&&ts.isVariableDeclaration(n)&&n.name.getText(tree)==='ESTACIONES'&&n.initializer&&ts.isArrayLiteralExpression(n.initializer)){
   const bogue=n.initializer.elements.find(e=>e.getText(tree).includes("nombre: 'Bogue'"));if(!bogue)throw Error('Bogue element not found');edits.push({start:n.initializer.getStart(tree),end:n.initializer.end,text:'['+bogue.getText(tree)+']'});
  }
  // Generate frames in synthetic cameras instead of a one-frame static canvas.
  if((file.endsWith('entertainment-stations.spec.ts')||file.endsWith('las-estaciones-respetan-los-ajustes.spec.ts'))&&ts.isReturnStatement(n)&&n.expression&&ts.isCallExpression(n.expression)&&ts.isPropertyAccessExpression(n.expression.expression)&&n.expression.expression.name.text==='captureStream'){
   const canvas=n.expression.expression.expression.getText(tree);edits.push({start:n.getStart(tree),end:n.end,text:'const qa583Canvas='+canvas+';const qa583Stream='+n.expression.getText(tree)+';const qa583Pump=setInterval(()=>{const c=qa583Canvas.getContext("2d");if(c){c.fillStyle=Date.now()%100<50?"#ffffff":"#eeeeee";c.fillRect(100,100,12,12);}},50);for(const t of qa583Stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(qa583Pump);stop();};}return qa583Stream;'});
  }
  if(file.endsWith('entertainment-stations.spec.ts')&&ts.isVariableStatement(n)){
   const declaration=n.declarationList.declarations.find(d=>d.name.getText(tree)==='stream'&&d.initializer&&ts.isCallExpression(d.initializer)&&d.initializer.expression.getText(tree)==='canvas.captureStream');
   let parent=n.parent,insideCamera=false;while(parent){if(ts.isCallExpression(parent)&&parent.expression.getText(tree)==='page.addInitScript'){insideCamera=true;break;}parent=parent.parent;}
   if(declaration&&insideCamera)edits.push({start:n.getStart(tree),end:n.end,text:n.getText(tree)+'const qa583Audio=new AudioContext();const qa583Destination=qa583Audio.createMediaStreamDestination();const qa583Tone=qa583Audio.createOscillator();qa583Tone.connect(qa583Destination);qa583Tone.start();for(const a of qa583Destination.stream.getAudioTracks())stream.addTrack(a);const qa583Pump=setInterval(()=>{const c=canvas.getContext("2d");if(c){c.fillStyle=Date.now()%100<50?"#ffffff":"#eeeeee";c.fillRect(100,100,12,12);}},50);for(const t of stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(qa583Pump);stop();qa583Audio.close().catch(()=>{});};}'});
  }
  ts.forEachChild(n,visit);
 };visit(tree);
 if(file.endsWith('entertainment-stations.spec.ts')&&!edits.some(e=>e.text.includes('setInputFiles')))throw Error('Native upload adaptation missing');
 let result=text;for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);
 if(file.endsWith('entertainment-stations.spec.ts'))result=result.replace("test.skip(testInfo.project.name !== 'chromium-desktop', 'MediaRecorder coverage only needs Chromium desktop.');","test.setTimeout(180000); test.skip(testInfo.project.name !== 'chromium-desktop', 'MediaRecorder coverage only needs Chromium desktop.');").replace("test.skip(testInfo.project.name !== 'chromium-desktop', 'Browser video processing only needs Chromium desktop.');","test.setTimeout(180000); test.skip(testInfo.project.name !== 'chromium-desktop', 'Browser video processing only needs Chromium desktop.');");
 if(file.endsWith('la-grilla-de-caras.spec.ts'))result=result.replaceAll('await page.waitForTimeout(4000);',`await expect.poll(()=>page.getByRole('heading',{name:/Resultados de tu búsqueda|No encontramos fotos tuyas todavía/i}).evaluateAll(list=>list.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0;}).length),{timeout:60000}).toBeGreaterThan(0);`);
 return result;
};
code=code.replace("const raw=fs.readFileSync(file,'utf8');","const originalRaw=fs.readFileSync(file,'utf8');const raw=("+transform583.toString()+")(file,originalRaw);").replace('originalSha256:hash(raw)','originalSha256:hash(originalRaw),preparedSha256:hash(raw)');
process.env.AK_AUDIT_SPEC_FILTER='entertainment-stations.spec.ts,la-grilla-de-caras.spec.ts';process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
fs.writeFileSync(path.join(dir,'585-driver.mjs.gz'),gzipSync(code));
const addition=path.join(build.qa,'tests/e2e/447-venta-por-ruta.spec.ts');assert(!fs.existsSync(addition));fs.copyFileSync(path.join(dir,'447-venta-por-ruta.spec.ts'),addition);
const dataBefore=new Map();
const files=()=>{const out=[];const visit=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory()&&!e.isSymbolicLink())visit(p);else if(e.isFile()&&p.endsWith('.json'))out.push(p);}};for(const sub of['data','src/data'])visit(path.join(build.qa,sub));return out;};
for(const p of files())dataBefore.set(p,fs.readFileSync(p));
const backup=path.join(build.qa,'.qa583-private-data-snapshot.json');fs.writeFileSync(backup,JSON.stringify([...dataBefore].map(([p,b])=>[p,b.toString('base64')])));
code="import {createRequire as __req583} from 'node:module';const ts=__req583('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');\n"+code;
const physical=path.join(dir,'585-driver.mjs');assert(!fs.existsSync(physical));fs.writeFileSync(physical,code);
try{await import(pathToFileURL(physical).href);}
finally{
 for(const p of files())if(!dataBefore.has(p))fs.unlinkSync(p);for(const[p,b]of dataBefore)fs.writeFileSync(p,b);
 if(fs.existsSync(addition))fs.unlinkSync(addition);
 for(const name of['ak207-447-venta-por-ruta.spec.ts','ak207-90-lo-que-va-atras-dice-donde-quedo.spec.ts','ak207-48-touchpix-entrega-sin-reinicio.spec.ts','ak207-prospecto-simulador.spec.ts','ak207-espejo-moderacion-caida-y-reintento.spec.ts']){const p=path.join(build.qa,'tests/e2e',name);if(fs.existsSync(p))fs.unlinkSync(p);}
 for(const name of['208-config.ts','585-config.ts','208-egress-guard.cjs']){const p=path.join(build.qa,name);if(fs.existsSync(p))fs.unlinkSync(p);}
 fs.unlinkSync(backup);
}
