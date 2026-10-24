import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'320-continuidad-recorrido.json');assert(!fs.existsSync(target));
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',record={source,pid:process.pid,started:new Date().toISOString(),phase:'waiting-own315',appEdited:false,reason:'Initial301 generator SyntaxError before any route case; preserved source/log, fixed QA generator only. Broad Jest remains valid on same frozen app.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+90*60*1000;while(true){const r=JSON.parse(fs.readFileSync(path.join(dir,'315-continuidad-final.json'),'utf8'));assert.equal(r.source,source);if(r.phase==='finished')break;assert(Date.now()<deadline,'Own315 wait deadline');await new Promise(yes=>setTimeout(yes,15000));}
 const resourceDeadline=Date.now()+5*60*1000;while(os.freemem()<2*1024**3&&Date.now()<resourceDeadline)await new Promise(yes=>setTimeout(yes,15000));record.freeBytesBefore=os.freemem();assert(record.freeBytesBefore>=2*1024**3,'No second native run under2GiB');
 record.phase='route-walk';record.routeStarted=new Date().toISOString();save();
 const log=fs.createWriteStream(path.join(dir,'320-control.log'));
 const child=spawn(process.execPath,[path.join(dir,'301-recorrido-contexto-seguro.mjs')],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});record.childPid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 try{record.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}finally{await new Promise(yes=>log.end(yes));}
 const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));
 for(const name of['resultados.json','informe.md']){const from=path.join(build.qa,'test-results/recorrido',name);if(fs.existsSync(from)){const fresh=fs.statSync(from).mtimeMs>=Date.parse(record.routeStarted);(record.routeOutputs||=[]).push({name,fresh,modified:fs.statSync(from).mtime.toISOString()});if(fresh)fs.copyFileSync(from,path.join(dir,'297-recorrido-'+name));}}
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
