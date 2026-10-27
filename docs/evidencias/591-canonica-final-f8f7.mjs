import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'591-continuidad.json');assert(!fs.existsSync(target));
const record={source:'f8f7cf34e8778de784b20e2654058fd722b2a2ec',started:new Date().toISOString(),phase:'waiting-audio589',appEdited:false,realServices:false,reason:'577 preflight correctly rejected old QA978 path before Jest; no f8f7 full suite ran there. Preserve original rejection. This is the sole actual final-source canonical run.'};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const end=Date.now()+220*60000;while(true){let done=false;try{done=!!JSON.parse(fs.readFileSync(path.join(dir,'589-audio-procesador.json'),'utf8')).finished;}catch(e){if(e.code!=='ENOENT')throw e;}if(done)break;if(Date.now()>end)throw Error('Prior audio QA still active');await new Promise(ok=>setTimeout(ok,15000));}
 const build=JSON.parse(fs.readFileSync(path.join(dir,'574-entorno.json'),'utf8'));assert.equal(build.source,record.source);assert.equal(build.phase,'built');
 let code=fs.readFileSync(path.join(dir,'577-canonica-generada.mjs'),'utf8').replaceAll('577','592').replaceAll('576','593');
 const start=code.indexOf('\n qa='),finish=code.indexOf(';record.qa=qa',start);assert(start>0&&finish>start);code=code.slice(0,start)+'\n qa='+JSON.stringify(build.qa)+code.slice(finish);
 const file=path.join(dir,'592-canonica-generada.mjs');assert(!fs.existsSync(file));fs.writeFileSync(file,code);record.phase='canonical593';save();process.exitCode=0;await import(pathToFileURL(file).href);
 const result=JSON.parse(fs.readFileSync(path.join(dir,'592-delta-publico.json'),'utf8'));record.canonical=result.canonical;record.sourceDiff=result.sourceDiff;assert(record.canonical&&record.canonical.total>=5000,'No false acceptance after a preflight rejection');record.phase='finished';if(record.canonical.fail||record.sourceDiff)process.exitCode=1;
}catch(e){record.phase='qa-setup-or-run-error';record.error=String(e.stack||e);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
