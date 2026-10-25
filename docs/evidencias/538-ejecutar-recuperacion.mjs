import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'538-continuidad.json');assert(!fs.existsSync(target));
assert(JSON.parse(fs.readFileSync(path.join(dir,'526-continuidad.json'),'utf8')).finished);
const record={source:'978af7d65a60bd287f3ee3cc05037a29566074f4',started:new Date().toISOString(),phase:'waiting-resources',appEdited:false,realServices:false};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const end=Date.now()+45*60000;while(os.freemem()<2*1024**3){if(Date.now()>end)throw Error('No2GiB available for isolated SDK recovery; no foreign process stopped');await new Promise(ok=>setTimeout(ok,15000));}
 record.phase='running-sdk542';save();await import(pathToFileURL(path.join(dir,'540-sdk-emuladores.mjs')).href);record.phase='finished';record.emulator=JSON.parse(fs.readFileSync(path.join(dir,'540-emuladores.json'),'utf8'));
}catch(e){record.phase='qa-setup-or-run-error';record.error=String(e.stack||e);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
