import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'526-continuidad.json');assert(!fs.existsSync(target));
const source='978af7d65a60bd287f3ee3cc05037a29566074f4';
const record={source,started:new Date().toISOString(),phase:'waiting-native512',appEdited:false,realServices:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
async function waitFor(check,minutes){const end=Date.now()+minutes*60000;while(!await check()){if(Date.now()>end)throw Error('Bounded QA wait exceeded, no overlapping run started');await new Promise(ok=>setTimeout(ok,15000));}}
try{
 await waitFor(()=>{const s=JSON.parse(fs.readFileSync(path.join(dir,'510-emuladores.json'),'utf8'));assert.equal(s.source,source);return !!s.finished;},260);
 record.native512=JSON.parse(fs.readFileSync(path.join(dir,'512-ejecucion.json'),'utf8'));delete record.native512.manifest;save();
 await waitFor(()=>os.freemem()>=2*1024**3,45);record.phase='running-local520';save();
 try{await import(pathToFileURL(path.join(dir,'518-controles-modo-local.mjs')).href);record.localExitCode=process.exitCode||0;}
 catch(e){record.localError=String(e.stack||e);}
 record.local520=fs.existsSync(path.join(dir,'520-ejecucion.json'))?JSON.parse(fs.readFileSync(path.join(dir,'520-ejecucion.json'),'utf8')):null;if(record.local520)delete record.local520.manifest;
 if(record.localError||record.local520?.sourceDiff)throw Error('Local QA setup/cleanup must be resolved before another QA');
 process.exitCode=0;record.phase='waiting-resources-for-media525';save();await waitFor(()=>os.freemem()>=2*1024**3,45);
 record.phase='running-media525';save();await import(pathToFileURL(path.join(dir,'524-sdk-emuladores.mjs')).href);
 record.media525=JSON.parse(fs.readFileSync(path.join(dir,'524-emuladores.json'),'utf8'));record.phase='finished';
 if(record.localExitCode||record.media525.exitCode)process.exitCode=1;
}catch(e){record.phase='qa-setup-or-run-error';record.error=String(e.stack||e);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
