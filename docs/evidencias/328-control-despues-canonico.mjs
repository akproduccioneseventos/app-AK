import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'328-continuidad-control.json');assert(!fs.existsSync(target));
const record={source:'3e45a4ac6b479f89605163168e31b37dc84f2d0f',pid:process.pid,started:new Date().toISOString(),phase:'waiting-own322',appEdited:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+90*60*1000;while(true){const r=JSON.parse(fs.readFileSync(path.join(dir,'322-continuidad-canonica.json'),'utf8'));assert.equal(r.source,record.source);if(r.phase==='finished')break;assert(Date.now()<deadline,'Own322 deadline');await new Promise(yes=>setTimeout(yes,15000));}
 const resourceDeadline=Date.now()+5*60*1000;while(os.freemem()<2*1024**3&&Date.now()<resourceDeadline)await new Promise(yes=>setTimeout(yes,15000));record.freeBytesBefore=os.freemem();assert(record.freeBytesBefore>=2*1024**3);
 record.phase='fixture-control';save();const log=fs.createWriteStream(path.join(dir,'328-control.log'));
 const child=spawn(process.execPath,[path.join(dir,'327-control-fixture-ejecutar.mjs')],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});record.childPid=child.pid;save();child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 try{record.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});}finally{await new Promise(yes=>log.end(yes));}
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
