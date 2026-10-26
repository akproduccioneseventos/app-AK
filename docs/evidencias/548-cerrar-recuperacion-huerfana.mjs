import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),root=path.resolve(dir,'../..');
const build=JSON.parse(fs.readFileSync(path.join(dir,'486-entorno.json'),'utf8')),qa=path.resolve(build.qa),source=build.source;
assert.equal(qa,path.resolve('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-480-delta-Apsy7q'));
const parent=JSON.parse(fs.readFileSync(path.join(dir,'540-emuladores.json'),'utf8'));assert(parent.finished&&parent.exitCode===2);
const debug=fs.readFileSync(path.join(parent.qa,'firebase-debug.log'),'utf8');assert(debug.includes('ENOENT')&&debug.includes('storage\\blobs'));
const query=spawnSync('powershell.exe',['-NoProfile','-Command',"Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match '539-recorridos-sdk\\.mjs' } | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress"],{encoding:'utf8',timeout:60000});assert.equal(query.status,0,query.stderr);
const parsed=query.stdout.trim()?JSON.parse(query.stdout):[],owned=Array.isArray(parsed)?parsed:[parsed];assert(owned.length<=1);
for(const p of owned){assert(p.CommandLine.replaceAll('\\','/').includes(path.join(dir,'539-recorridos-sdk.mjs').replaceAll('\\','/')));const k=spawnSync('taskkill.exe',['/PID',String(p.ProcessId),'/T','/F'],{encoding:'utf8',timeout:30000});assert.equal(k.status,0,k.stderr);}
const inside=file=>{const p=path.resolve(file);assert(p.startsWith(qa+path.sep));return p;};
const backup=path.join(qa,'.qa539-private-data-snapshot.json');const rows=JSON.parse(fs.readFileSync(backup,'utf8'));const originals=new Map(rows.map(([p,b])=>[inside(p),Buffer.from(b,'base64')]));
const now=[];function walk(folder){if(!fs.existsSync(folder))return;for(const e of fs.readdirSync(folder,{withFileTypes:true})){const p=inside(path.join(folder,e.name));if(e.isDirectory()&&!e.isSymbolicLink())walk(p);else if(e.isFile()&&p.endsWith('.json'))now.push(p);}}for(const f of ['data','src/data'])walk(path.join(qa,f));
for(const p of now)if(!originals.has(p))fs.unlinkSync(p);for(const[p,b]of originals)fs.writeFileSync(p,b);
const git=args=>spawnSync('git',args,{cwd:qa,maxBuffer:16*1024*1024});const h=git(['show',source+':tests/e2e/helpers/fiesta-de-prueba.ts']);assert.equal(h.status,0);fs.writeFileSync(path.join(qa,'tests/e2e/helpers/fiesta-de-prueba.ts'),h.stdout);
const native=JSON.parse(fs.readFileSync(path.join(dir,'542-ejecucion.json'),'utf8'));
for(const m of native.manifest||[]){const p=inside(path.join(qa,m.copy));assert(path.basename(p).startsWith('ak207-'));if(fs.existsSync(p))fs.unlinkSync(p);}
for(const name of ['.qa528-fiesta-rest-bridge.cjs','208-config.ts','542-config.ts','208-egress-guard.cjs']){const p=inside(path.join(qa,name));if(fs.existsSync(p))fs.unlinkSync(p);}
fs.unlinkSync(backup);const d=git(['diff','--name-only']);assert.equal(d.status,0);assert.equal(d.stdout.toString().trim(),'');
const result={source,created:new Date().toISOString(),reason:'Storage CLI crashed on shared global TEMP/firebase/storage/blobs ENOENT at06:05:16UTC; native child remained alive after supervisor killed emulator. Do NOT accept recovery542 as a stable run.',ownedStopped:owned,foreignProcessesStopped:false,originalsRestored:originals.size,sourceDiff:'',scope:'Only owned orphan539 tree and own QA fixtures restored. Raw542 preserved, not rewritten to finished/PASS. Next attempt must isolate TEMP/TMP, hub/logging and storage blobs.'};
fs.writeFileSync(path.join(dir,'548-orphan-cleanup.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({ownedStopped:owned.map(x=>x.ProcessId),originalsRestored:originals.size,sourceDiff:''}));
