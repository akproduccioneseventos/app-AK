import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='f8f7cf34e8778de784b20e2654058fd722b2a2ec',target=path.join(dir,'592-delta-publico.json');
assert(!fs.existsSync(target),'Preserve receipt');
const record={source,previous:'978af7d65a60bd287f3ee3cc05037a29566074f4',started:new Date().toISOString(),phase:'waiting-resources',appEdited:false,realServices:false,reason:'New PUBLIC1353 four media consumers only; one final frozen-source official suite. No replay of258 browser matrix.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const git=(args,cwd=root)=>{const r=spawnSync('git',args,{cwd,env:safe,encoding:'utf8',maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
let qa,child,log;const snapshots=new Map();
try{
 const deadline=Date.now()+20*60*1000;record.probes=[];
 do{
  const p=spawnSync('powershell.exe',['-NoProfile','-Command',"@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match '\\bnext\\s+build\\b|build-next-with-memory|jest[\\\\/]bin|jest\\.js|graphify' } | Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress"],{encoding:'utf8',timeout:20000});
  const value=p.status===0?JSON.parse(p.stdout.trim()||'[]'):null,list=Array.isArray(value)?value:value?[value]:[];
  const probe={at:new Date().toISOString(),freeBytes:os.freemem(),probeExit:p.status,foreignHeavy:list};record.probes.push(probe);save();
  if(p.status===0&&!list.length&&probe.freeBytes>=2*1024**3)break;
  if(Date.now()>deadline)throw new Error('No resource-safe slot for new-source canonical Jest');
  await new Promise(ok=>setTimeout(ok,30000));
 }while(true);
 qa="C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-574-f8f-z1BF2d";record.qa=qa;record.reusedCompiledSource=true;
 assert.equal(git(['rev-parse','HEAD'],qa),source);assert.equal(git(['diff','--name-only'],qa),'');
 assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
 git(['restore','--source='+source,'--worktree','--ignore-skip-worktree-bits','--','data/blog-posts.json'],qa);
 const walk=folder=>{if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,e.name);if(e.isDirectory()&&!e.isSymbolicLink())walk(file);else if(e.isFile()&&file.endsWith('.json'))snapshots.set(file,fs.readFileSync(file));}};for(const folder of['data','src/data'])walk(path.join(qa,folder));
 const home=path.join(qa,'.qa592-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});
 const env={...safe,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),NODE_ENV:'test',GOOGLE_APPLICATION_CREDENTIALS:'',NODE_OPTIONS:'--max-old-space-size=1536 --require "'+path.join(dir,'323-egress-unit-canonico.cjs').replaceAll('\\','/')+'"'};
 const jest='C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/jest/bin/jest.js';
 async function run(label,tests=[]){
  const report=path.join(dir,label+'-jest-resultados.json'),file=path.join(dir,label+'-jest.log');assert(!fs.existsSync(report));log=fs.createWriteStream(file);
  const args=[jest,...(tests.length?['--runTestsByPath',...tests]:[]),'--maxWorkers=1','--workerIdleMemoryLimit=512MB','--no-cache','--json','--outputFile',report];
  child=spawn(process.execPath,args,{cwd:qa,env,stdio:['ignore','pipe','pipe']});record.phase=label;record.pid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  const exit=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});await new Promise(ok=>log.end(ok));log=null;fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
  const r=JSON.parse(fs.readFileSync(report,'utf8'));return{source,exit,suites:r.numTotalTestSuites,total:r.numTotalTests,pass:r.numPassedTests,fail:r.numFailedTests,pending:r.numPendingTests,scope:tests.length?'Additional focused QA, not canonical suite or global acceptance':'Canonical existing full suite on NEW frozenf8f7 source, original configuration/assertions, no custom370 adapter'};
 }
 record.canonical=await run('593');save();
 record.phase='finished';if(record.canonical.fail)process.exitCode=1;
}catch(error){record.phase='qa-setup-or-run-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{
 if(child&&child.exitCode===null){const done=new Promise(ok=>child.once('exit',ok));child.kill();await Promise.race([done,new Promise(ok=>setTimeout(ok,5000))]);}
 if(log)await new Promise(ok=>log.end(ok));for(const[file,bytes]of snapshots)fs.writeFileSync(file,bytes);
 if(qa){record.preCleanupDiff=git(['diff','--name-only'],qa);if(record.preCleanupDiff){const changed=record.preCleanupDiff.split('\n');assert(changed.every(f=>snapshots.has(path.join(qa,f))),'Never restore unexpected app code');await new Promise(ok=>setTimeout(ok,2000));for(const[file,bytes]of snapshots)fs.writeFileSync(file,bytes);}record.sourceDiff=git(['diff','--name-only'],qa);if(record.sourceDiff)process.exitCode=2;}
 record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));
}
