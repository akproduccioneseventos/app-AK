import fs from 'node:fs';
import net from 'node:net';
import {execFileSync} from 'node:child_process';
import admin from 'firebase-admin';

if(process.argv[2]!=='emulator-only') {
const next=JSON.parse(fs.readFileSync('docs/evidencias/126-start-execution.json'));
const metadata=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',`Get-CimInstance Win32_Process -Filter "ProcessId=${Number(next.child)}" | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress`],{encoding:'utf8'}));
if(metadata.ParentProcessId!==next.launcher||!metadata.CommandLine.includes('node_modules/next/dist/bin/next'))throw Error('Owned Next process mismatch');
process.kill(next.child);
let closed=false;
for(let i=0;i<60;i++) {
  closed=await new Promise(resolve=>{const s=net.connect(3301,'127.0.0.1');s.once('connect',()=>{s.destroy();resolve(false);});s.once('error',()=>resolve(true));});
  if(closed)break;await new Promise(resolve=>setTimeout(resolve,200));
}
if(!closed)throw Error('Next must stop before byte restoration');
fs.writeFileSync('docs/evidencias/126-next-stop.json',JSON.stringify({pid:next.child,parent:next.launcher,intentionalTermination:true,stoppedAt:new Date().toISOString()},null,2)+'\n');
const response=await fetch('http://127.0.0.1:3302/cerrar',{method:'POST',headers:{'x-ak-qa-close':'owned-qa126'}});
if(!response.ok)throw Error(`Fixture cleanup HTTP ${response.status}`);
console.log(await response.text());
}
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8085';
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa126-shutdown');
const counts={};for(const c of await app.firestore().listCollections())counts[c.id]=(await c.get()).size;
await app.delete();
const total=Object.values(counts).reduce((a,b)=>a+b,0);
fs.writeFileSync('docs/evidencias/126-limpieza-sdk.json',JSON.stringify({total,counts},null,2)+'\n');
if(total!==0)throw Error('Fictitious SDK documents remain');
const emulator=JSON.parse(fs.readFileSync('docs/evidencias/126-emulator-execution.json'));
const all=JSON.parse(execFileSync('powershell',['-NoProfile','-Command','Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'],{encoding:'utf8'}));
const root=all.find(p=>p.ProcessId===emulator.child);
if(!root||root.ParentProcessId!==emulator.launcher||!root.CommandLine.includes('node_modules/firebase-tools/lib/bin/firebase.js'))throw Error('Owned emulator mismatch');
const ids=new Set([root.ProcessId]);
let size;do{size=ids.size;for(const p of all)if(ids.has(p.ParentProcessId))ids.add(p.ProcessId);}while(size!==ids.size);
const stopped=[];
for(const id of [...ids].reverse()) {
  const old=all.find(p=>p.ProcessId===id);
  const text=execFileSync('powershell',['-NoProfile','-Command',`Get-CimInstance Win32_Process -Filter "ProcessId=${id}" | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress`],{encoding:'utf8'}).trim();
  if(!text)continue;const current=JSON.parse(text);
  if(current.CommandLine!==old.CommandLine||current.ParentProcessId!==old.ParentProcessId)throw Error('Process identity changed');
  process.kill(id);stopped.push(current);
}
await new Promise(resolve=>setTimeout(resolve,800));
const listeners=execFileSync('powershell',['-NoProfile','-Command','@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -in 3301,3302,8085} | Select-Object LocalPort,OwningProcess) | ConvertTo-Json -Compress'],{encoding:'utf8'}).trim();
if(listeners&&listeners!=='[]')throw Error(`Audited ports still active ${listeners}`);
fs.writeFileSync('docs/evidencias/126-entorno-detenido.json',JSON.stringify({stopped,listeners:[],bytesRestored:JSON.parse(fs.readFileSync('docs/evidencias/126-fixtures-limpieza.json')).cleanup.bytesRestored,total,finishedAt:new Date().toISOString()},null,2)+'\n');
console.log('Owned services stopped, SDK0 and original bytes restored; no execution policy changed.');
