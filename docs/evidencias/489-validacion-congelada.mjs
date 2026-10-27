import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'489-continuidad.json');assert(!fs.existsSync(target));
const record={source:'978af7d65a60bd287f3ee3cc05037a29566074f4',started:new Date().toISOString(),phase:'waiting-build486',appEdited:false,realServices:false};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const end=Date.now()+75*60*1000;let build;
 while(true){build=JSON.parse(fs.readFileSync(path.join(dir,'486-entorno.json'),'utf8'));if(build.finished)break;if(Date.now()>end)throw Error('Build486 still active; never start overlapping validation');await new Promise(ok=>setTimeout(ok,15000));}
 assert.equal(build.source,record.source);record.buildPhase=build.phase;record.qa=build.qa;save();
 let code=fs.readFileSync(path.join(dir,'385-validar-delta-publico.mjs'),'utf8').replaceAll('385','491').replaceAll('386','490').replaceAll('917a98e32c63fe2f832f5cdc16db87f4fc722b6c',record.source);
 const start=code.indexOf(' qa=fs.mkdtempSync('),endQa=code.indexOf('\n assert.equal(git(',start);assert(start>0&&endQa>start);
 code=code.slice(0,start)+' qa='+JSON.stringify(build.qa)+';record.qa=qa;record.reusedCompiledSource=true;'+code.slice(endQa);
 const extra=code.indexOf(" const file=path.join(qa,'src/__tests__/qa387-"),endExtra=code.indexOf(" record.phase='finished';",extra);assert(extra>0&&endExtra>extra);code=code.slice(0,extra)+code.slice(endExtra);
 code=code.replace('record.canonical.fail||record.invoiceState.fail','record.canonical.fail');
 const generated=path.join(dir,'491-canonica-generada.mjs');assert(!fs.existsSync(generated));fs.writeFileSync(generated,code);record.phase='running-canonical490';save();
 await import(pathToFileURL(generated).href);record.phase='finished';
}catch(error){record.phase='qa-block-or-run-error';record.error=String(error.stack||error);process.exitCode=1;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
