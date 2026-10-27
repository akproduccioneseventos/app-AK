import fs from'node:fs';import path from'node:path';import os from'node:os';import assert from'node:assert/strict';import{spawnSync}from'node:child_process';import{fileURLToPath,pathToFileURL}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'630-continuidad.json');assert(!fs.existsSync(target));
const r={source:'f8f7cf34e8778de784b20e2654058fd722b2a2ec',phase:'waiting-foreign-build',started:new Date().toISOString(),appEdited:false,foreignProcessesStopped:false,realServices:false,preflights:[]};
const save=()=>fs.writeFileSync(target,JSON.stringify(r,null,2)+'\n');save();
const query="Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'next[\\\\/]dist[\\\\/]bin[\\\\/]next[ ]+build' } | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress";
const until=Date.now()+45*60000;
while(true){assert(Date.now()<until,'No safe opportunity while another build uses the machine');const p=spawnSync('powershell.exe',['-NoProfile','-Command',query],{encoding:'utf8',windowsHide:true,timeout:30000});assert.equal(p.status,0);const txt=p.stdout.trim(),builds=txt?JSON.parse(txt):[];const free=os.freemem();
 const observation={at:new Date().toISOString(),free,foreignBuilds:builds};if(!r.preflights.length||JSON.stringify(r.preflights.at(-1).foreignBuilds)!==JSON.stringify(builds))r.preflights.push(observation);save();if((Array.isArray(builds)?builds.length:1)===0&&free>=3*1024**3)break;await new Promise(ok=>setTimeout(ok,30000));}
fs.copyFileSync(path.join(dir,'626-config.ts'),path.join(dir,'632-config.ts'));
let b=fs.readFileSync(path.join(dir,'627-preparador-generado.mjs'),'utf8').replaceAll('627','631').replaceAll('628','633').replaceAll('626-config.ts','632-config.ts');const builder=path.join(dir,'631-muro-final.mjs');assert(!fs.existsSync(builder));fs.writeFileSync(builder,b);
let s=fs.readFileSync(path.join(dir,'584-supervisor-aislado.mjs'),'utf8').replaceAll('584','634').replaceAll('583','631').replaceAll('585','633').replaceAll('631-medios-generado.mjs','631-muro-final.mjs').replace('os.freemem()<2*1024**3','os.freemem()<3*1024**3');
const sup=path.join(dir,'634-supervisor-generado.mjs');assert(!fs.existsSync(sup));fs.writeFileSync(sup,s);r.phase='running634';save();
try{await import(pathToFileURL(sup).href);}finally{r.phase='finished';r.finished=new Date().toISOString();save();}
