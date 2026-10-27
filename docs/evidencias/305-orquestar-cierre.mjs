import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',target=path.join(dir,'305-continuidad.json');
assert(!fs.existsSync(target),'Preserve previous execution');
const record={source,pid:process.pid,started:new Date().toISOString(),phase:'waiting-own-296',jobs:[],appEdited:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const run=async(file)=>{
 const log=fs.createWriteStream(path.join(dir,`${path.basename(file,'.mjs')}-orquestacion.log`));
 const child=spawn(process.execPath,[path.join(dir,file)],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});
 const job={file,pid:child.pid,started:new Date().toISOString()};record.jobs.push(job);save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 try{job.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}finally{await new Promise(yes=>log.end(yes));job.finished=new Date().toISOString();save();}
};
try{
 const deadline=Date.now()+3*60*60*1000;
 while(true){const previous=JSON.parse(fs.readFileSync(path.join(dir,'296-ejecucion.json'),'utf8'));assert.equal(previous.source,source);if(previous.phase==='finished')break;assert(Date.now()<deadline,'Own296 exceeded bounded wait');await new Promise(yes=>setTimeout(yes,15000));}
 record.phase='route-walk';save();await run('301-recorrido-contexto-seguro.mjs');
 const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));
 const reports=['resultados.json','informe.md'];for(const name of reports){const from=path.join(build.qa,'test-results/recorrido',name);if(fs.existsSync(from))fs.copyFileSync(from,path.join(dir,'297-recorrido-'+name));}
 record.phase='sdk-preflight';save();const resourceDeadline=Date.now()+5*60*1000;
 while(os.freemem()<2*1024**3&&Date.now()<resourceDeadline)await new Promise(yes=>setTimeout(yes,15000));
 record.freeBytesForSdk=os.freemem();save();
 if(os.freemem()>=2*1024**3){record.phase='sdk';save();await run('303-almacenamiento-sdk-ejecutar.mjs');}
 else record.sdkNotStarted='Less than2GiB after own browser cleanup; no foreign process stopped.';
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
