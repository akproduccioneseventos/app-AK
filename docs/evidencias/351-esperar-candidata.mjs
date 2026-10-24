import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),target=path.join(dir,'351-continuidad-candidata.json');assert(!fs.existsSync(target));
const source='3f9460185143ef034dcd713e975d2a0af5e20f1a',record={source,pid:process.pid,phase:'waiting-own347',started:new Date().toISOString(),appEdited:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+90*60*1000;
 while(true){const r=JSON.parse(fs.readFileSync(path.join(dir,'347-entorno.json'),'utf8'));assert.equal(r.source,source);if(r.phase==='built')break;if(['build-failed','qa-setup-or-build-error','not-started-resource-busy'].includes(r.phase))throw Error('Build not accepted: '+r.phase);assert(Date.now()<deadline,'Own build wait deadline');await new Promise(yes=>setTimeout(yes,15000));}
 record.phase='waiting-resource-safe';save();const resourceDeadline=Date.now()+5*60*1000;while(os.freemem()<2*1024**3&&Date.now()<resourceDeadline)await new Promise(yes=>setTimeout(yes,15000));assert(os.freemem()>=2*1024**3,'No canonical suite under2GiB');
 record.phase='canonical-candidate-suite';record.freeBytesBefore=os.freemem();save();
 const child=spawn(process.execPath,[path.join(dir,'349-jest-candidata.mjs')],{cwd:root,env:process.env,stdio:'inherit'});record.childPid=child.pid;save();record.exitCode=await new Promise((yes,no)=>{child.once('exit',yes);child.once('error',no);});
}catch(error){record.error=String(error.stack||error);process.exitCode=1;}
finally{record.phase='finished';record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
