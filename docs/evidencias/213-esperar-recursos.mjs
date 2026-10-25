import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const runId=process.env.AK_AUDIT_RUN_ID||'213';assert.match(runId,/^\d+$/);
const recordPath=path.join(root,`docs/evidencias/${runId}-espera-recursos.json`);
assert.equal(fs.existsSync(recordPath),false,'Preserve resource receipt');
const record={started:new Date().toISOString(),probes:[],limitMinutes:20,foreignProcessesStopped:false};
const save=()=>fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n');
const deadline=Date.now()+20*60*1000;let ready=false;
do{
  const result=spawnSync('powershell.exe',['-NoProfile','-Command',`@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next[\\/]dist[\\/]bin[\\/]next.*build|build-next-with-memory' } | Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress`],{encoding:'utf8',timeout:20000});
  const builds=result.status===0?JSON.parse(result.stdout.trim()||'[]'):null;
  const list=Array.isArray(builds)?builds:builds?[builds]:[];
  const probe={at:new Date().toISOString(),freeBytes:os.freemem(),probeExit:result.status,builds:list};
  record.probes.push(probe);save();
  ready=result.status===0&&list.length===0&&probe.freeBytes>=1.5*1024**3;
  if(ready||Date.now()>=deadline)break;
  await new Promise(resolve=>setTimeout(resolve,30000));
}while(true);
record.ready=ready;record.finished=new Date().toISOString();save();
if(!ready){console.log(JSON.stringify({ready:false,reason:'No resource-safe isolated browser start within bounded wait',probes:record.probes.length}));process.exitCode=2;}
else{
  console.log(JSON.stringify({ready:true,probes:record.probes.length}));
  const child=spawn(process.execPath,['docs/evidencias/209-ejecutar-bateria.mjs'],{cwd:root,env:{...process.env,AK_AUDIT_RUN_ID:runId,AK_AUDIT_SPEC_FILTER:process.env.AK_AUDIT_SPEC_FILTER||'__only_new__'},stdio:'inherit'});
  process.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});
}
