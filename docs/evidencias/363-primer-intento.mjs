import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='3f9460185143ef034dcd713e975d2a0af5e20f1a',runId=process.env.AK_QA_RETEST_ID||'363';
assert(['363','364'].includes(runId));
const target=path.join(dir,runId+'-retest-siete-suites.json');
assert(!fs.existsSync(target),'Preserve receipt');
const deps='C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const record={source,runId,scope:'Exactly seven failing349 suites on SAME-SHA isolated worktree, NO build. Original assertions/mocks/timeouts, official Jest env; public Git fixture materialized despite inherited sparse checkout. No real services; no altered assertions.',started:new Date().toISOString(),phase:'preparing',appEdited:false,foreignProcessesStopped:false,probes:[]};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const git=(args,cwd=root)=>{const r=spawnSync('git',args,{cwd,env:safe,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const previous=JSON.parse(fs.readFileSync(path.join(dir,'349-jest-resultados.json'),'utf8'));
const relativeFiles=previous.testResults.filter(x=>x.status==='failed').map(x=>{const file=x.name.replaceAll('\\','/');return file.slice(file.lastIndexOf('/src/')+1);});
assert.equal(relativeFiles.length,7);assert(relativeFiles.every(x=>x.startsWith('src/__tests__/')));
let child,qa,log;const snapshots=new Map();
try{
 if(runId==='364'){
  const prior=JSON.parse(fs.readFileSync(path.join(dir,'363-retest-siete-suites.json'),'utf8'));assert.equal(prior.source,source);qa=prior.qa;
  assert(qa.startsWith('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-363-3f-'));
 }else{
  qa=fs.mkdtempSync('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-363-3f-');git(['worktree','add','--detach',qa,source]);fs.symlinkSync(deps,path.join(qa,'node_modules'),'junction');
 }
 record.qa=qa;
 assert.equal(git(['rev-parse','HEAD'],qa),source);assert.equal(git(['diff','--name-only'],qa),'');
 assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
 for(const file of relativeFiles)assert(fs.existsSync(path.join(qa,file)),file);
 const blog=path.join(qa,'data/blog-posts.json');
 record.sparseFixture={beforePresent:fs.existsSync(blog),indexFlag:git(['ls-files','-v','data/blog-posts.json'],qa),sparseCheckout:git(['config','--get','core.sparseCheckout'],qa)};
 if(!fs.existsSync(blog))git(['restore','--source='+source,'--worktree','--ignore-skip-worktree-bits','--','data/blog-posts.json'],qa);
 assert(fs.existsSync(blog),'Original public blog fixture must exist');
 record.blogFixture={present:true,gitBlob:git(['rev-parse',source+':data/blog-posts.json']),sha256:crypto.createHash('sha256').update(fs.readFileSync(blog)).digest('hex')};
 const walk=folder=>{if(!fs.existsSync(folder))return;for(const item of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory()&&!item.isSymbolicLink())walk(file);else if(item.isFile()&&file.endsWith('.json'))snapshots.set(file,fs.readFileSync(file));}};
 for(const folder of ['data','src/data'])walk(path.join(qa,folder));
 record.phase='waiting-for-foreign-build-and-2GiB';save();
 const deadline=Date.now()+40*60*1000;let ready=false;
 do{
  const command="@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match '\\bnext\\s+build\\b|build-next-with-memory|jest[\\\\/]bin|jest\\.js|graphify' } | Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress";
  const p=spawnSync('powershell.exe',['-NoProfile','-Command',command],{encoding:'utf8',timeout:20000});
  const parsed=p.status===0?JSON.parse(p.stdout.trim()||'[]'):null,list=Array.isArray(parsed)?parsed:parsed?[parsed]:[];
  const probe={at:new Date().toISOString(),freeBytes:os.freemem(),probeExit:p.status,foreignHeavy:list};record.probes.push(probe);save();
  ready=p.status===0&&list.length===0&&probe.freeBytes>=2*1024**3;if(ready||Date.now()>=deadline)break;
  await new Promise(ok=>setTimeout(ok,60000));
 }while(true);
 if(!ready){record.phase='not-executed-resource-busy';process.exitCode=2;}
 else{
  const home=path.join(qa,'.qa'+runId+'-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});
  const env={...safe,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),NODE_ENV:'test',GOOGLE_APPLICATION_CREDENTIALS:'',NODE_OPTIONS:'--max-old-space-size=1536 --require "'+path.join(dir,'323-egress-unit-canonico.cjs').replaceAll('\\','/')+'"'};
  const report=path.join(dir,runId+'-jest-resultados.json'),file=path.join(dir,runId+'-jest.log');log=fs.createWriteStream(file);
  record.phase='running';record.relativeFiles=relativeFiles;
  child=spawn(process.execPath,[path.join(deps,'jest/bin/jest.js'),'--runTestsByPath',...relativeFiles,'--maxWorkers=1','--workerIdleMemoryLimit=512MB','--no-cache','--json','--outputFile',report],{cwd:qa,env,stdio:['ignore','pipe','pipe']});
  record.pid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  record.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});
  await new Promise(yes=>log.end(yes));log=null;fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
  if(fs.existsSync(report)){const r=JSON.parse(fs.readFileSync(report,'utf8'));record.summary={suites:r.numTotalTestSuites,total:r.numTotalTests,passed:r.numPassedTests,failed:r.numFailedTests,pending:r.numPendingTests};}
  record.phase='finished';if(record.exitCode!==0)process.exitCode=1;
 }
}catch(error){record.error=String(error.stack||error);record.phase='qa-setup-or-run-error';process.exitCode=2;}
finally{
 if(child&&child.exitCode===null){const done=new Promise(ok=>child.once('exit',ok));child.kill();await Promise.race([done,new Promise(ok=>setTimeout(ok,5000))]);}
 if(log)await new Promise(ok=>log.end(ok));
 if(qa){for(const[file,bytes]of snapshots)fs.writeFileSync(file,bytes);record.sourceDiff=git(['diff','--name-only'],qa);if(record.sourceDiff)process.exitCode=2;}
 record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));
}
