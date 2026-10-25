import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),prepared=JSON.parse(fs.readFileSync(path.join(dir,'280-entorno.json'),'utf8'));
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',target=path.join(dir,'291-entorno.json');assert(!fs.existsSync(target));assert.equal(prepared.source,source);assert(!prepared.buildPid,'Never overlap or replace a build');
const qa=prepared.qa,record={source,qa,preparedReceipt:'280-entorno.json',dependencyLimit:prepared.dependencyLimit,started:new Date().toISOString(),phase:'preflight',probes:[],appEdited:false,realServices:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const git=args=>{const r=spawnSync('git',args,{cwd:qa,env:safe,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
try{
 assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only']),'');assert(!fs.readdirSync(qa).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)));
 const deadline=Date.now()+15*60*1000;let ready=false;
 do{const p=spawnSync('powershell.exe',['-NoProfile','-Command',`@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next[\\/]dist[\\/]bin[\\/]next.*build|build-next-with-memory|jest|graphify' } | Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress`],{encoding:'utf8',timeout:20000});const raw=p.status===0?JSON.parse(p.stdout.trim()||'[]'):null,list=Array.isArray(raw)?raw:raw?[raw]:[];const probe={at:new Date().toISOString(),freeBytes:os.freemem(),foreignHeavy:list,probeExit:p.status};record.probes.push(probe);save();ready=p.status===0&&!list.length&&probe.freeBytes>=2*1024**3;if(ready||Date.now()>=deadline)break;await new Promise(ok=>setTimeout(ok,30000));}while(true);
 assert(ready,'No safe resources within bounded wait; build NOT started');
 const e=spawnSync(process.execPath,['scripts/entorno-de-pruebas.mjs'],{cwd:qa,env:{...safe,AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE:'true'},encoding:'utf8'});assert.equal(e.status,0,e.stderr);
 const home=path.join(qa,'.qa291-home');fs.mkdirSync(path.join(home,'config'),{recursive:true});const env={...safe,...JSON.parse(e.stdout).forzadas,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),AK_DISABLE_STANDALONE:'true',COMMIT_SHA:source,NODE_ENV:'production'};
 assert(os.freemem()>=2*1024**3,'No build under2GiB after environment preparation');
 const file=path.join(dir,'291-build.log'),log=fs.createWriteStream(file),child=spawn(process.execPath,['scripts/build-next-with-memory.mjs'],{cwd:qa,env,stdio:['ignore','pipe','pipe']});record.phase='building';record.buildPid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});record.buildExit=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});await new Promise(ok=>log.end(ok));fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));record.sourceDiff=git(['diff','--name-only']);record.phase=record.buildExit===0&&!record.sourceDiff?'built':'build-failed';if(record.phase!=='built')process.exitCode=1;
}catch(e){record.error=String(e.stack||e);record.phase=record.buildPid?'build-or-qa-error':'not-started-qa-preflight';process.exitCode=1;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
