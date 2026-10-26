import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'497-continuidad.json');assert(!fs.existsSync(target));
const record={source:'978af7d65a60bd287f3ee3cc05037a29566074f4',started:new Date().toISOString(),phase:'waiting-canonical490',appEdited:false,realServices:false};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const end=Date.now()+90*60*1000;let unit;
 while(true){try{unit=JSON.parse(fs.readFileSync(path.join(dir,'491-delta-publico.json'),'utf8'));if(unit.finished)break;}catch(e){if(e.code!=='ENOENT')throw e;}if(Date.now()>end)throw Error('Canonical run still active; no overlapping SDK');await new Promise(ok=>setTimeout(ok,15000));}
 assert.equal(unit.source,record.source);const build=JSON.parse(fs.readFileSync(path.join(dir,'486-entorno.json'),'utf8'));assert.equal(build.phase,'built');
 record.canonical=unit.canonical;record.phase='signed-profile-control499';save();await import(pathToFileURL(path.join(dir,'499-perfiles-firma-y-guardia.mjs')).href);
 record.phase='preparing-native493';save();await import(pathToFileURL(path.join(dir,'493-preparar-matriz-nativa.mjs')).href);
 record.phase='running-native492-496';save();await import(pathToFileURL(path.join(dir,'492-sdk-emuladores.mjs')).href);record.phase='finished';
}catch(e){record.phase='qa-block-or-run-error';record.error=String(e.stack||e);process.exitCode=1;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
