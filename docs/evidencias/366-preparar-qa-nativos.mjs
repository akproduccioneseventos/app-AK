import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'366-continuidad.json');
assert(!fs.existsSync(target),'Preserve controller receipt');
const record={phase:'waiting-focused-jest364',started:new Date().toISOString(),source:'3e45a4ac6b479f89605163168e31b37dc84f2d0f',reason:'Prior frozen main QA artifact missing; reconstruct ONLY to conclude the27 recorded native criteria, no repeated full Jest/374 routes.',appEdited:false};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+65*60*1000;let last;
 do{
  try{last=JSON.parse(fs.readFileSync(path.join(dir,'364-retest-siete-suites.json'),'utf8'));}catch{}
  if(last?.finished)break;if(Date.now()>deadline)throw new Error('Focused364 did not finish within bounded wait');
  await new Promise(ok=>setTimeout(ok,30000));
 }while(true);
 assert(last?.finished);record.jest364Phase=last.phase;save();
 let code=fs.readFileSync(path.join(dir,'347-entorno-actual.mjs'),'utf8')
  .replaceAll('347','366').replaceAll('3f9460185143ef034dcd713e975d2a0af5e20f1a',record.source);
 const old="path.join(os.tmpdir(),'ak-qa-366-')",replacement=JSON.stringify('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-366-main-');
 assert(code.includes(old));code=code.replace(old,replacement);
 const file=path.join(dir,'366-entorno-actual.mjs');assert(!fs.existsSync(file));fs.writeFileSync(file,code);
 record.phase='running-resource-guarded-builder';save();await import('./366-entorno-actual.mjs');
 record.phase='finished';record.build=JSON.parse(fs.readFileSync(path.join(dir,'366-entorno.json'),'utf8')).phase;
}catch(error){record.phase='controller-or-setup-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
