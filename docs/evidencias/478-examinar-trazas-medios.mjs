import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));assert(JSON.parse(fs.readFileSync(path.join(dir,'477-ejecucion.json'),'utf8')).finished);
const records=[];for(const suffix of['001','002']){const r=JSON.parse(fs.readFileSync(path.join(dir,'472-batch-'+suffix+'-resultados.json'),'utf8'));const visit=n=>{for(const s of n.specs||[])for(const t of s.tests||[]){const trace=t.results.at(-1).attachments.find(a=>a.name==='trace');if(trace)records.push({title:s.title,trace:trace.path});}for(const s of n.suites||[])visit(s);};visit(r);}
const shell=`$ErrorActionPreference='Stop';Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead($env:AK_QA_TRACE_ZIP);$console=@();$blobs=@();$lastSnapshot=$null;$lastScreen=$null;$seen=@{}
try{foreach($entry in @($zip.Entries|Where-Object{$_.FullName.EndsWith('.trace') -or $_.FullName.EndsWith('.network')})){$reader=[IO.StreamReader]::new($entry.Open());try{$lines=$reader.ReadToEnd().Split([char]10)}finally{$reader.Dispose()};foreach($line in $lines){if(-not $line.Trim()){continue};$x=$line|ConvertFrom-Json
 if($x.type -eq 'console'){$console+=@{type=$x.messageType;text=$x.text}}
 if($x.type -eq 'frame-snapshot'){$lastSnapshot=$x.snapshot}
 if($x.type -eq 'screencast-frame'){$lastScreen=$x.sha1}
 $s=$x.snapshot;if($s.request.url -like 'blob:*' -and $s.response.content._sha1){$sha=$s.response.content._sha1;if(-not $seen.ContainsKey($sha)){$seen[$sha]=$true;$resource=$zip.GetEntry('resources/'+$sha);if($resource){$dest=$env:AK_QA_OUTPUT+'-'+$blobs.Count+'.bin';$a=$resource.Open();$b=[IO.File]::Create($dest);try{$a.CopyTo($b)}finally{$a.Dispose();$b.Dispose()};$blobs+=@{file=$dest;mime=$s.response.content.mimeType;resource=$sha}}}}
 }}
 if($lastScreen){$s=$zip.GetEntry('resources/'+$lastScreen);if($s){$a=$s.Open();$b=[IO.File]::Create($env:AK_QA_OUTPUT+'-last.jpg');try{$a.CopyTo($b)}finally{$a.Dispose();$b.Dispose()}}}
 $text='';if($lastSnapshot){$text=ConvertTo-Json -InputObject $lastSnapshot.html -Depth 90 -Compress}
 ConvertTo-Json -InputObject @{console=$console;blobs=$blobs;lastDOM=$text} -Depth 95 -Compress
}finally{$zip.Dispose()}`;
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const ffmpeg='C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/codex-media/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
for(const [index,row]of records.entries()){
 assert(path.resolve(row.trace).startsWith(path.resolve(dir)+path.sep));const prefix=path.join(dir,'478-trace-'+index);
 const r=spawnSync('powershell.exe',['-NoProfile','-Command',shell],{encoding:'utf8',timeout:60000,maxBuffer:16*1024**2,env:{...safe,AK_QA_TRACE_ZIP:row.trace,AK_QA_OUTPUT:prefix}});assert.equal(r.status,0,r.stderr);
 const data=JSON.parse(r.stdout);row.console=data.console;row.lastDOM=data.lastDOM;row.blobs=[];
 for(const b of data.blobs){const bytes=fs.readFileSync(b.file),samples=[];for(const at of['0.1','0.75','1.25']){
  const frame=spawnSync(ffmpeg,['-v','error','-ss',at,'-i',b.file,'-frames:v','1','-vf','scale=640:480','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{timeout:10000,maxBuffer:2*1024**2});let green=0,nonblack=0;
  if(frame.status===0&&frame.stdout.length===640*480*3)for(let y=0;y<480;y++)for(let x=0;x<640;x++){const i=(y*640+x)*3,red=frame.stdout[i],g=frame.stdout[i+1],blue=frame.stdout[i+2];if(red+g+blue>20)nonblack++;if(x<40&&g>170&&g>red*1.25&&blue>100)green++;}
  samples.push({at,decodeExit:frame.status,decodedBytes:frame.stdout.length,greenLeft40:green,nonblack});
 }
 row.blobs.push({...b,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),samples});}
}
const result={created:new Date().toISOString(),source:'917a98e32c63fe2f832f5cdc16db87f4fc722b6c',notNewExecution:true,scope:'Passive Playwright traces; optional captured blob bytes independently decoded by FFmpeg. No app rewrite/retest or real data.',records};
fs.writeFileSync(path.join(dir,'478-trazas-medios.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(records.map(r=>({title:r.title,console:r.console?.slice(-5),blobs:r.blobs,lastDOMTail:r.lastDOM?.slice(-2800)}))));
