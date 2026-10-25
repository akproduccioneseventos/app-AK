import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(dir,'434-respuestas-traza.json'),'utf8'));const run=data.result.find(r=>r.title.includes('llega desde'));assert(run&&fs.existsSync(run.trace));
const script=`$ErrorActionPreference='Stop';Add-Type -AssemblyName System.IO.Compression.FileSystem
$z=[IO.Compression.ZipFile]::OpenRead($env:AK_QA_TRACE_ZIP);$out=@()
try{foreach($entry in @($z.Entries|Where-Object{$_.FullName.EndsWith('.trace')})){$r=[IO.StreamReader]::new($entry.Open());try{$lines=$r.ReadToEnd().Split([char]10)}finally{$r.Dispose()};foreach($line in $lines){if(-not $line.Trim()){continue};$x=$line|ConvertFrom-Json;if($x.type -eq 'console' -or ($x.type -eq 'event' -and $x.method -eq 'pageError')){$out+=$x}}}}finally{$z.Dispose()}
ConvertTo-Json -InputObject @($out) -Depth 12 -Compress`;
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));const r=spawnSync('powershell.exe',['-NoProfile','-Command',script],{env:{...safe,AK_QA_TRACE_ZIP:run.trace},encoding:'utf8',timeout:60000,maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);
const events=JSON.parse(r.stdout.trim()||'[]'),result={source:data.source,notNewExecution:true,trace:run.trace,events};fs.writeFileSync(path.join(dir,'436-eventos-presupuesto.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(events).slice(0,9000));
