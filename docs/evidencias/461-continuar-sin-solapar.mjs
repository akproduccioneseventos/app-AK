import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'461-continuidad.json');assert(!fs.existsSync(target));
const record={started:new Date().toISOString(),phase:'waiting-for455',source:'917a98e32c63fe2f832f5cdc16db87f4fc722b6c',appEdited:false,realServices:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+25*60*1000;let previous;
 while(true){previous=JSON.parse(fs.readFileSync(path.join(dir,'455-ejecucion.json'),'utf8'));record.freeBytes=os.freemem();record.previousPhase=previous.phase;save();if(previous.finished&&os.freemem()>=2*1024**3)break;if(Date.now()>deadline)throw Error('Resources unavailable after previous native run; no foreign process stopped');await new Promise(ok=>setTimeout(ok,15000));}
 assert.equal(previous.sourceDiff,'');
 const prepared=execFileSync(process.execPath,[path.join(dir,'451-preparar-medios-y-venta.mjs'),'--refresh'],{encoding:'utf8'});record.preparation=prepared.trim();
 const generated=fs.readFileSync(path.join(dir,'451-medios-generado.mjs'),'utf8');assert(generated.includes('^e2e[-_]'),'Hyphenated fictitious station must seed');
 record.phase='running-sdk456';save();await import(pathToFileURL(path.join(dir,'456-sdk-emuladores.mjs')).href);record.phase='finished';
}catch(error){record.phase='qa-block-or-run-error';record.error=String(error.stack||error);process.exitCode=1;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
