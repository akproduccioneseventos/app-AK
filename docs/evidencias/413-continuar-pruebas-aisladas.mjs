import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'413-continuidad.json');assert(!fs.existsSync(target));
const record={started:new Date().toISOString(),phase:'waiting-build406',source:'917a98e32c63fe2f832f5cdc16db87f4fc722b6c',appEdited:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+80*60*1000;
 while(true){const build=JSON.parse(fs.readFileSync(path.join(dir,'406-entorno.json'),'utf8'));if(build.finished){assert.equal(build.phase,'built',build.error||'Frozen build not accepted');break;}if(Date.now()>deadline)throw new Error('Previous build still active; do not start another');await new Promise(ok=>setTimeout(ok,30000));}
 record.phase='409-consumers-camera';save();await import('./409-consumidores-y-camara.mjs');
 record.phase='411-additional-mobile';save();await import('./411-matriz-movil-adicional.mjs');
 record.phase='finished';
}catch(error){record.phase='controller-or-run-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
