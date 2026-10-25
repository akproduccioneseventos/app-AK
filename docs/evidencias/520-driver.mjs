import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn,spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root="C:\\Users\\Usuario\\Documents\\Codex\\ak-codex88\\ak-auditoria267-cierre\\",dir=path.join(root,'docs/evidencias');
const source='978af7d65a60bd287f3ee3cc05037a29566074f4';
const runId='520';assert.match(runId,/^\d+$/);
const specFilter=process.env.AK_AUDIT_SPEC_FILTER?.split(',').filter(Boolean);
const includePortal=process.env.AK_AUDIT_SKIP_PORTAL!=='true';
const batchSize=Number(process.env.AK_AUDIT_BATCH_SIZE||0);assert.ok(Number.isInteger(batchSize)&&batchSize>=0&&batchSize<=12);
const build=JSON.parse(fs.readFileSync(path.join(dir,'486-entorno.json'),'utf8'));
assert.equal(build.source,source);assert.equal(build.buildExit,0,'Wait for frozen-source build');
const target=path.join(dir,`${runId}-ejecucion.json`);assert.equal(fs.existsSync(target)||fs.existsSync(target+'.gz'),false,'Preserve run including published gzip');
const qa=path.resolve(build.qa);assert.ok(qa.replaceAll('\\','/').startsWith('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-480-delta-'),'Own stable QA366 only');
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const git=args=>{const r=spawnSync('git',args,{cwd:qa,env:safe,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only']),'');
assert.equal(fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)),false);
assert.ok(os.freemem()>=1024**3,'No Next/browser under1GiB');
const inside=file=>{const p=path.resolve(file);assert.ok(p.startsWith(qa+path.sep),'Own QA only');return p;};
const jsonFiles=()=>{const out=[];const walk=folder=>{if(!fs.existsSync(folder))return;for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=inside(path.join(folder,entry.name));if(entry.isDirectory()&&!entry.isSymbolicLink())walk(file);else if(entry.isFile()&&file.endsWith('.json'))out.push(file);}};for(const folder of ['data','src/data'])walk(path.join(qa,folder));return out;};
const originalBytes520=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));
for(const file of jsonFiles()){const name=path.basename(file);if(['servicios-empresa.json','menus-catering.json','insumos.json','budget-display-settings.json','armado-rapido-config.json','invoice-template-settings.json','crm-stages.json','blog-posts.json','employee-roles.json'].includes(name))continue;if(/^(?:src\/)?data\/fiestas\//.test(path.relative(qa,file).replaceAll('\\','/'))){fs.unlinkSync(inside(file));continue;}const old=JSON.parse(fs.readFileSync(file,'utf8'));fs.writeFileSync(file,JSON.stringify(Array.isArray(old)?[]:{})+'\n');}
const snapshots=new Map(jsonFiles().map(file=>[file,fs.readFileSync(file)]));
const restoreData=()=>{for(const file of jsonFiles())if(!snapshots.has(file))fs.unlinkSync(inside(file));for(const[file,bytes]of snapshots)fs.writeFileSync(inside(file),bytes);};
const copied=[],manifest=[];
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const hook="import {test as __akAudit207} from '@playwright/test';\n__akAudit207.beforeEach(async({context},info)=>{\n await context.route('**/*',async r=>{const u=new URL(r.request().url());if(/^https?:$/.test(u.protocol)&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname)){await info.attach('qa-egress-blocked',{contentType:'text/plain',body:u.origin+u.pathname});await r.abort('blockedbyclient');}else await r.continue();});\n await context.route('https://firebaseinstallations.googleapis.com/**',async r=>{const u=new URL(r.request().url());const body=u.pathname.endsWith('authTokens:generate')?{token:'qa368-fis-only',expiresIn:'604800s'}:{fid:'c'+'a'.repeat(21),refreshToken:'qa368-fis-refresh-only',authToken:{token:'qa368-fis-only',expiresIn:'604800s'}};await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});});\n await info.attach('qa-fis-mode',{contentType:'text/plain',body:'LOCAL DOUBLE only; no Firebase provider acceptance'});\n});\n";
const copy=(from,to)=>{const dest=inside(to);assert.equal(fs.existsSync(dest),false,dest);fs.copyFileSync(from,dest);copied.push(dest);};
const walkTests=folder=>{for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=inside(path.join(folder,entry.name));if(entry.isDirectory())walkTests(file);else if(entry.name.endsWith('.spec.ts')&&!entry.name.startsWith('ak207-')&&(!specFilter||specFilter.includes(entry.name))){
  const raw=fs.readFileSync(file,'utf8');assert.ok(!raw.includes('__akAudit207'));
  const dest=inside(path.join(folder,'ak207-'+entry.name));assert.equal(fs.existsSync(dest),false);fs.writeFileSync(dest,hook+raw);copied.push(dest);
  manifest.push({original:path.relative(qa,file).replaceAll('\\','/'),copy:path.relative(qa,dest).replaceAll('\\','/'),originalSha256:hash(raw),instrumentedSha256:hash(hook+raw)});
}}};
walkTests(path.join(qa,'tests/e2e'));
if(includePortal){const newTest=inside(path.join(qa,'tests/e2e/ak207-portal-activo.spec.ts'));assert.equal(fs.existsSync(newTest),false);fs.writeFileSync(newTest,hook+fs.readFileSync(path.join(dir,'207-portal-activo.spec.ts'),'utf8'));copied.push(newTest);}
copy(path.join(dir,'208-config.ts'),path.join(qa,'208-config.ts'));
copy(path.join(dir,'519-config.ts'),path.join(qa,'520-config.ts'));copy(path.join(dir,'208-egress-guard.cjs'),path.join(qa,'208-egress-guard.cjs'));
const envResult=spawnSync(process.execPath,['scripts/entorno-de-pruebas.mjs'],{cwd:qa,env:{...safe,AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE:'true'},encoding:'utf8'});assert.equal(envResult.status,0,envResult.stderr);
const home=inside(path.join(qa,'.qa209-home'));fs.mkdirSync(path.join(home,'config'),{recursive:true});
const env={...safe,...JSON.parse(envResult.stdout).forzadas,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),
  AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source,NODE_ENV:'production',PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3300',AK_QA_RESULTS:path.join(dir,`${runId}-resultados.json`),
  NODE_OPTIONS:`--max-old-space-size=1024 --require "${path.join(qa,'208-egress-guard.cjs').replaceAll('\\','/')}"`};
const dry=spawnSync(process.execPath,['C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/@playwright/test/cli.js','test','--config','520-config.ts','--list','--reporter=json'],{cwd:qa,env,encoding:'utf8',timeout:120000,maxBuffer:6*1024**2});
fs.writeFileSync(path.join(dir,'520-lista.stdout.log'),dry.stdout||'');fs.writeFileSync(path.join(dir,'520-lista.stderr.log'),dry.stderr||'');
assert.equal(dry.status,0,dry.stderr);const listed=JSON.parse(dry.stdout);const flatten=s=>(s.specs||[]).flatMap(x=>x.tests||[]).concat((s.suites||[]).flatMap(flatten));
const list=flatten(listed);fs.writeFileSync(path.join(dir,'520-seleccion-comprobada.json'),JSON.stringify({source,expected:14,listed:list.length,projects:list.map(t=>t.projectName)},null,2)+'\n');assert.equal(list.length,14,'Exactly12 original JSON-mode cases plus2 visual walks, not SDK acceptance');
const record={source,qa,started:new Date().toISOString(),phase:'prepared',buildFinished:build.finished,dependencyLimit:build.dependencyLimit,realServices:false,appEdited:false,specFilter:specFilter||null,batchSize,copiedTests:manifest.length,newTestSha256:includePortal?hash(fs.readFileSync(path.join(dir,'207-portal-activo.spec.ts'))):null,manifest,
  limits:'Selected E2E specs (all only if specFilter is null) on one frozen-source Next build, plus active portal cases. Tests copied without changing assertions, adding only common local-network guard. Existing deliberate skips remain skips, not acceptance. Default inventory traversal excluded separately; route availability is not function acceptance. External requests blocked; no real services or zero-error certificate.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
let server,child;
const serverFile=path.join(dir,`${runId}-servidor.log`),testFile=path.join(dir,`${runId}-pruebas.log`);const serverLog=fs.createWriteStream(serverFile),testLog=fs.createWriteStream(testFile);
try{
  const listener=net.createServer();await new Promise((yes,no)=>{listener.once('error',no);listener.listen(3300,'127.0.0.1',yes);});await new Promise(yes=>listener.close(yes));
  server=spawn(process.execPath,['C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3300'],{cwd:qa,env,stdio:['ignore','pipe','pipe']});record.serverPid=server.pid;save();server.stdout.pipe(serverLog,{end:false});server.stderr.pipe(serverLog,{end:false});
  const deadline=Date.now()+90000;while(!record.health){try{const h=await(await fetch('http://127.0.0.1:3300/api/health',{signal:AbortSignal.timeout(10000)})).json();assert.ok(h.version?.startsWith(source));assert.ok(Object.values(h.services).every(v=>v===false));record.health=h;}catch(error){if(Date.now()>deadline)throw error;await new Promise(resolve=>setTimeout(resolve,1000));}}
  assert.ok(os.freemem()>=1024**3,'No browser under1GiB');
  record.phase='running';save();console.log(JSON.stringify({phase:record.phase,source,serverPid:server.pid,copiedTests:manifest.length}));
  const allFiles=manifest.map(item=>path.basename(item.copy)).filter(file=>!file.includes('recorrido-de-pantallas'));
  if(includePortal)allFiles.push('ak207-portal-activo.spec.ts');
  const groups=batchSize?Array.from({length:Math.ceil(allFiles.length/batchSize)},(_,index)=>allFiles.slice(index*batchSize,(index+1)*batchSize)):[[]];
  record.batches=[];record.exitCode=0;save();
  for(let index=0;index<groups.length;index++){
    if(index>0){restoreData();const deadline=Date.now()+10*60*1000;while(os.freemem()<1024**3&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,15000));assert.ok(os.freemem()>=1024**3,'No next browser batch under1GiB');}
    const label=batchSize?`${runId}-batch-${String(index+1).padStart(3,'0')}`:runId;
    const runEnv={...env,AK_QA_RESULTS:path.join(dir,`${label}-resultados.json`)};
    record.currentBatch=index+1;record.totalBatches=groups.length;save();
    child=spawn(process.execPath,['C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/@playwright/test/cli.js','test','--config','520-config.ts','--output',path.join(dir,`${label}-artifacts`),...groups[index]],{cwd:qa,env:runEnv,stdio:['ignore','pipe','pipe']});record.testPid=child.pid;save();child.stdout.pipe(testLog,{end:false});child.stderr.pipe(testLog,{end:false});
    const code=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});if(code!==0){record.exitCode=1;process.exitCode=1;}
    const batch={index:index+1,files:groups[index],exitCode:code,finished:new Date().toISOString(),report:path.basename(runEnv.AK_QA_RESULTS)};
    if(fs.existsSync(runEnv.AK_QA_RESULTS)){const report=JSON.parse(fs.readFileSync(runEnv.AK_QA_RESULTS,'utf8'));Object.assign(batch,{stats:report.stats,errors:report.errors});}
    record.batches.push(batch);save();console.log(JSON.stringify({batch:batch.index,totalBatches:groups.length,exitCode:code,stats:batch.stats}));
  }
  if(!batchSize&&fs.existsSync(env.AK_QA_RESULTS)){const report=JSON.parse(fs.readFileSync(env.AK_QA_RESULTS,'utf8'));record.stats=report.stats;record.reportErrors=report.errors;}
  else if(batchSize){record.stats=Object.fromEntries(['expected','skipped','unexpected','flaky'].map(key=>[key,record.batches.reduce((sum,batch)=>sum+(batch.stats?.[key]||0),0)]));record.reportErrors=record.batches.flatMap(batch=>batch.errors||[]);fs.writeFileSync(env.AK_QA_RESULTS,JSON.stringify({format:'AK_BATCH_REPORT_NOT_PLAYWRIGHT_NATIVE',source,stats:record.stats,batches:record.batches},null,2)+'\n');}
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{
  for(const process of [child,server])if(process&&process.exitCode===null){const done=new Promise(resolve=>process.once('exit',resolve));process.kill();await Promise.race([done,new Promise(resolve=>setTimeout(resolve,5000))]);}
  await new Promise(resolve=>testLog.end(resolve));await new Promise(resolve=>serverLog.end(resolve));
  for(const file of copied)if(fs.existsSync(file))fs.unlinkSync(inside(file));
  restoreData();
  record.snapshotCount=snapshots.size;for(const p of jsonFiles())if(!originalBytes520.has(p))fs.unlinkSync(p);for(const[p,b]of originalBytes520)fs.writeFileSync(p,b);record.sourceDiff=git(['diff','--name-only']);record.finished=new Date().toISOString();record.phase='finished';save();
  for(const file of [serverFile,testFile])fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
  console.log(JSON.stringify({...record,manifest:undefined}));if(record.sourceDiff)process.exitCode=1;
}
