import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),state=JSON.parse(fs.readFileSync(path.join(dir,'554-ejecucion.json'),'utf8'));assert(state.finished);
const batch=state.batches.find(b=>b.files.some(f=>f.includes('prospecto-simulador'))),base=path.join(dir,'554-batch-'+String(batch.index).padStart(3,'0')+'-artifacts');
const folder=fs.readdirSync(base,{withFileTypes:true}).find(e=>e.isDirectory()&&e.name.includes('chromium-desktop')&&fs.existsSync(path.join(base,e.name,'trace.zip')));assert(folder);
const trace=path.join(base,folder.name,'trace.zip');assert(fs.existsSync(trace));
const shell=`$ErrorActionPreference='Stop';Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead($env:AK_QA_TRACE_ZIP);$clicks=@();$errors=@()
try{foreach($entry in @($zip.Entries|Where-Object{$_.FullName.EndsWith('.trace')})){$reader=[IO.StreamReader]::new($entry.Open());try{$lines=$reader.ReadToEnd().Split([char]10)}finally{$reader.Dispose()};foreach($line in $lines){if(-not $line.Trim()){continue};$x=$line|ConvertFrom-Json;if($x.type -eq 'before' -and ($x.method -eq 'click' -or $x.apiName -like '*.click')){$clicks+=@{api=$x.apiName;selector=$x.params.selector;time=$x.startTime}};if($x.type -eq 'after' -and $x.error){$errors+=@{callId=$x.callId;error=$x.error.message}}}}
ConvertTo-Json -InputObject @{clicks=$clicks;errors=$errors} -Depth 15 -Compress
}finally{$zip.Dispose()}`;
const r=spawnSync('powershell.exe',['-NoProfile','-Command',shell],{env:{...process.env,AK_QA_TRACE_ZIP:trace},encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});assert.equal(r.status,0,r.stderr);const observed=JSON.parse(r.stdout);
const summary={source:state.source,created:new Date().toISOString(),trace,observed,summaryClicks:observed.clicks.filter(c=>/Ver Resumen|Generar presupuesto|WhatsApp/i.test(c.selector||'')),scope:'Actual recorded browser click trace, no app execution/change. No inferred navigation success from DOM existence.'};
fs.writeFileSync(path.join(dir,'556-cierre-comercial-traza.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({source:summary.source,clicks:observed.clicks.length,closingClicks:summary.summaryClicks}));
