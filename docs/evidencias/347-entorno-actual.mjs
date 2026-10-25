import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='3f9460185143ef034dcd713e975d2a0af5e20f1a',baseline='fa3b492b8f1d6a77433a92f4d63b665cfea3747c';
const deps='C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const target=path.join(dir,'347-entorno.json');assert(!fs.existsSync(target),'Preserve receipt');
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const git=(args,cwd=root)=>{const r=spawnSync('git',args,{cwd,env:safe,encoding:'utf8',maxBuffer:20*1024**2});assert.equal(r.status,0,r.stderr||r.stdout);return r.stdout.trim();};
const record={source,baseline,started:new Date().toISOString(),phase:'waiting-resource-safe',probes:[],appEdited:false,realServices:false,foreignProcessesStopped:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
let child;
try{
 const deadline=Date.now()+30*60*1000;let ready=false;
 do{
  const p=spawnSync('powershell.exe',['-NoProfile','-Command',`@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next[\\/]dist[\\/]bin[\\/]next.*build|build-next-with-memory|jest|graphify' } | Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress`],{encoding:'utf8',timeout:20000});
  const parsed=p.status===0?JSON.parse(p.stdout.trim()||'[]'):null,list=Array.isArray(parsed)?parsed:parsed?[parsed]:[];
  const probe={at:new Date().toISOString(),freeBytes:os.freemem(),probeExit:p.status,foreignHeavy:list};record.probes.push(probe);save();
  ready=p.status===0&&!list.length&&probe.freeBytes>=2*1024**3;if(ready||Date.now()>=deadline)break;
  await new Promise(ok=>setTimeout(ok,60000));
 }while(true);
 if(!ready){record.phase='not-started-resource-busy';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));process.exitCode=2;}
 else{
  const before=JSON.parse(git(['show',`${baseline}:package.json`])),after=JSON.parse(git(['show',`${source}:package.json`]));
  for(const key of ['dependencies','devDependencies','optionalDependencies','peerDependencies','overrides','engines'])assert.deepEqual(after[key],before[key],key);
  const prior=JSON.parse(git(['show',`${baseline}:package-lock.json`])),next=JSON.parse(git(['show',`${source}:package-lock.json`]));assert.deepEqual(next.packages,prior.packages,'Unknown dependency change');
  const installedEstree=JSON.parse(fs.readFileSync(path.join(deps,'@types/estree/package.json'),'utf8')).version;
  assert.equal(installedEstree,'1.0.8');assert.equal(next.packages['node_modules/@types/estree'].version,'1.0.9');
  record.dependencyLimit='Reused existing dependency artifact as206: sole disclosed type mismatch @types/estree installed1.0.8 vs locked1.0.9. Not clean npm-ci/type-patch validation. Package dependency sections and lock.packages equal206 sourcefa3b.';
  const qa=fs.mkdtempSync(path.join(os.tmpdir(),'ak-qa-347-'));record.qa=qa;git(['worktree','add','--detach',qa,source]);fs.symlinkSync(deps,path.join(qa,'node_modules'),'junction');
  assert.equal(git(['rev-parse','HEAD'],qa),source);assert.equal(git(['diff','--name-only'],qa),'');assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
  const e=spawnSync(process.execPath,['scripts/entorno-de-pruebas.mjs'],{cwd:qa,env:{...safe,AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE:'true'},encoding:'utf8'});assert.equal(e.status,0,e.stderr);
  const home=path.join(qa,'.qa347-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});const env={...safe,...JSON.parse(e.stdout).forzadas,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source,NODE_ENV:'production'};
  assert(os.freemem()>=2*1024**3,'No heavy build under2GiB after preparation');
  const file=path.join(dir,'347-build.log'),log=fs.createWriteStream(file);record.phase='building';
  child=spawn(process.execPath,['scripts/build-next-with-memory.mjs'],{cwd:qa,env,stdio:['ignore','pipe','pipe']});record.buildPid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  record.buildExit=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});await new Promise(ok=>log.end(ok));fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
  record.sourceDiff=git(['diff','--name-only'],qa);record.phase=record.buildExit===0&&!record.sourceDiff?'built':'build-failed';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));if(record.phase!=='built')process.exitCode=1;
 }
}catch(e){record.error=String(e.stack||e);record.phase='qa-setup-or-build-error';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));process.exitCode=1;}
