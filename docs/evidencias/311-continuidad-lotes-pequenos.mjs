import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'311-continuidad.json');
assert(!fs.existsSync(target));assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'312-recuperacion.json'))).sourceDiff,'');
const record={source:'3e45a4ac6b479f89605163168e31b37dc84f2d0f',pid:process.pid,started:new Date().toISOString(),phase:'running',jobs:[],appEdited:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 for(const file of['307-home-estado-ejecutar.mjs','303-almacenamiento-sdk-ejecutar.mjs','310-archivos-restantes-ejecutar.mjs','301-recorrido-contexto-seguro.mjs']){
  const minimum=(file.startsWith('303')?2:1)*1024**3,deadline=Date.now()+5*60*1000;
  while(os.freemem()<minimum&&Date.now()<deadline)await new Promise(yes=>setTimeout(yes,15000));
  const job={file,started:new Date().toISOString(),freeBytesBefore:os.freemem()};record.jobs.push(job);save();
  if(os.freemem()<minimum){job.notStarted='Insufficient memory after own cleanup; no foreign process stopped';continue;}
  const log=fs.createWriteStream(path.join(dir,file.replace('.mjs','-control.log')));
  const child=spawn(process.execPath,[path.join(dir,file)],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});job.pid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  try{job.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}
  catch(error){job.error=String(error);}
  finally{await new Promise(yes=>log.end(yes));job.finished=new Date().toISOString();save();}
  if(file.startsWith('301')){
   const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));
   for(const name of['resultados.json','informe.md']){const from=path.join(build.qa,'test-results/recorrido',name);if(fs.existsSync(from))fs.copyFileSync(from,path.join(dir,'297-recorrido-'+name));}
  }
 }
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
