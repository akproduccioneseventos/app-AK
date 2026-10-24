import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const target=path.join(dir,'309-reinicio.json');assert(!fs.existsSync(target));
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
const run=JSON.parse(fs.readFileSync(path.join(dir,'296-ejecucion.json'),'utf8'));
const control=JSON.parse(fs.readFileSync(path.join(dir,'305-continuidad.json'),'utf8'));
assert.equal(run.source,source);assert.equal(control.source,source);assert.equal(control.jobs.length,0);
assert.equal(control.pid,2268);assert.equal(run.serverPid,10628);
const record={source,started:new Date().toISOString(),reason:'Memory repeatedly below128MiB during long camera batches; preserve failures, restart only own verified processes and reduce batch to ONE file. Not app diagnosis.',freeBytesBefore:os.freemem(),completedBatches:run.batches,partialBatch:run.currentBatch,appEdited:false};
for(const name of['296-ejecucion.json','305-continuidad.json'])fs.copyFileSync(path.join(dir,name),path.join(dir,'309-antes-'+name),fs.constants.COPYFILE_EXCL);
const ps=`$ErrorActionPreference='Stop';$targets=@(@{Id=2268;Created=1792806880787;Need='305-orquestar-cierre.mjs'},@{Id=5312;Created=1792806258828;Need='295-ejecutar-nativos-focales.mjs failed-files'});foreach($t in $targets){$p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$t.Id);if(!$p){continue};$ms=([DateTimeOffset]$p.CreationDate).ToUnixTimeMilliseconds();if($ms -ne $t.Created -or $p.CommandLine -notlike ('*'+$t.Need+'*')){throw 'Identity changed: refuse stop'};& taskkill.exe /PID $t.Id /T /F;if($LASTEXITCODE -ne 0){throw 'Own taskkill failed'}}`;
const stopped=spawnSync('powershell.exe',['-NoProfile','-Command',ps],{encoding:'utf8',timeout:60000});record.stop={code:stopped.status,stdout:stopped.stdout,stderr:stopped.stderr};assert.equal(stopped.status,0,stopped.stderr);
const qa=path.resolve(run.qa);assert.match(qa.replaceAll('\\','/'),/\/Temp\/ak-qa-280-[^/]+$/);
const git=args=>{const r=spawnSync('git',args,{cwd:qa,encoding:'utf8',maxBuffer:16*1024**2});assert.equal(r.status,0,r.stderr);return r.stdout;};
assert.equal(git(['rev-parse','HEAD']).trim(),source);
const original=git(['ls-files','-z','--','data','src/data']).split('\0').filter(n=>n.endsWith('.json'));
const originalSet=new Set(original.map(n=>n.replaceAll('\\','/')));record.restoredFromFrozenGit=[];record.deletedOwnQaJson=[];
const inside=file=>{const absolute=path.resolve(file);assert(absolute.startsWith(qa+path.sep));return absolute;};
const walk=folder=>{if(!fs.existsSync(folder))return;for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=inside(path.join(folder,entry.name));if(entry.isDirectory()&&!entry.isSymbolicLink())walk(file);else if(entry.isFile()&&file.endsWith('.json')){const relative=path.relative(qa,file).replaceAll('\\','/');if(!originalSet.has(relative)){fs.unlinkSync(file);record.deletedOwnQaJson.push(relative);}}}};
walk(path.join(qa,'data'));walk(path.join(qa,'src/data'));
for(const relative of original){const file=inside(path.join(qa,relative));fs.mkdirSync(path.dirname(file),{recursive:true});const result=spawnSync('git',['show',`${source}:${relative}`],{cwd:qa,maxBuffer:16*1024**2});assert.equal(result.status,0);fs.writeFileSync(file,result.stdout);record.restoredFromFrozenGit.push(relative);}
for(const relative of[...run.manifest.map(m=>m.copy),'208-config.ts','208-egress-guard.cjs']){const file=inside(path.join(qa,relative));if(fs.existsSync(file))fs.unlinkSync(file);}
record.sourceDiff=git(['diff','--name-only']).trim();assert.equal(record.sourceDiff,'');
record.cleanupLimit='Process interruption discarded in-memory snapshots;76tracked JSON restored byte-for-byte from frozenGit and untracked QAJSON removed. Do not claim comparison to lost memory snapshots.';
for(const name of['296-servidor.log','296-pruebas.log']){const file=path.join(dir,name);if(fs.existsSync(file))fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));}
for(const[name,r]of[['296-ejecucion.json',run],['305-continuidad.json',control]]){r.phase='interrupted-resource-restart';r.finished=new Date().toISOString();r.interruptionReceipt='309-reinicio.json';fs.writeFileSync(path.join(dir,name),JSON.stringify(r,null,2)+'\n');}
record.freeBytesAfter=os.freemem();record.finished=new Date().toISOString();fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
