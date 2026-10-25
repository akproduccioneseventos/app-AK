import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),result=[];
const script=`$ErrorActionPreference='Stop';Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[System.IO.Compression.ZipFile]::OpenRead($env:AK_QA_TRACE_ZIP);$out=@()
try{foreach($entry in @($zip.Entries | Where-Object {$_.FullName.EndsWith('.network')})){
 $reader=[IO.StreamReader]::new($entry.Open());try{$lines=$reader.ReadToEnd().Split([char]10)}finally{$reader.Dispose()}
 foreach($line in $lines){if(-not $line.Trim()){continue};$row=$line|ConvertFrom-Json;$s=$row.snapshot
 if($s.request.method -ne 'POST'){continue}
 $sha=$s.response.content._sha1;if(-not $sha){continue};$resource=$zip.GetEntry('resources/'+$sha);if(-not $resource){continue}
 $r=[IO.StreamReader]::new($resource.Open());try{$body=$r.ReadToEnd()}finally{$r.Dispose()}
 $fields=@([regex]::Matches($body,'"(?:success|error|fotosPorTanda|segundosCuentaRegresiva|countdownSeconds|consentRequired)"\\s*:\\s*(?:"(?:\\\\.|[^"\\\\])*"|true|false|[0-9]+)')|ForEach-Object {$_.Value})
 if($fields.Count -gt 0){$out+=@{url=$s.request.url;status=$s.response.status;fields=@($fields|Select-Object -First 18)}}
 }
}}finally{$zip.Dispose()}
ConvertTo-Json -InputObject @($out) -Depth 7 -Compress`;
for(const id of['003','005']){
 const report=JSON.parse(fs.readFileSync(path.join(dir,'425-batch-'+id+'-resultados.json'),'utf8'));
 const visit=s=>{for(const spec of s.specs||[])for(const t of spec.tests||[]){const last=t.results.at(-1),trace=last.attachments?.find(a=>a.name==='trace');if(trace?.path){assert(path.resolve(trace.path).startsWith(path.resolve(dir)+path.sep));const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));const r=spawnSync('powershell.exe',['-NoProfile','-Command',script],{env:{...safe,AK_QA_TRACE_ZIP:trace.path},encoding:'utf8',timeout:60000,maxBuffer:4*1024**2});assert.equal(r.status,0,r.stderr);result.push({title:spec.title,project:t.projectName,trace:trace.path,responses:JSON.parse(r.stdout.trim()||'[]')});}}for(const sub of s.suites||[])visit(sub);};visit(report);
}
const target=path.join(dir,'434-respuestas-traza.json');assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify({source:'917a98e32c63fe2f832f5cdc16db87f4fc722b6c',at:new Date().toISOString(),notNewExecution:true,result},null,2)+'\n');console.log(JSON.stringify(result.map(r=>({...r,trace:undefined,responses:r.responses.filter(x=>x.fields.some(f=>f.startsWith('"error"'))).slice(-3)}))));
