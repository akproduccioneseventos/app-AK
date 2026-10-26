import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{spawn}from'node:child_process';import{fileURLToPath}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'667-secuencia.json');assert(!fs.existsSync(target));
const record={started:new Date().toISOString(),ownerPid:process.pid,phase:'waiting-canonical',appEdits:false};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const deadline=Date.now()+45*60000;let canonical;
 while(true){canonical=JSON.parse(fs.readFileSync(path.join(dir,'665-canonical.json'),'utf8'));assert.equal(canonical.source,'acc1cb968f06f705d11457c8fed0e2f01464d712');if(canonical.finished)break;assert(Date.now()<deadline,'Canonical did not finish in bounded window');await new Promise(ok=>setTimeout(ok,10000));}
 assert.equal(canonical.diff,'');record.canonicalExit=canonical.exit;record.canonicalCounts=canonical.counts;
 assert(!fs.existsSync(path.join(dir,'663-nativos.json')),'Do not duplicate a native run');record.phase='native';save();
 const child=spawn(process.execPath,[path.join(dir,'663-nativos.mjs')],{cwd:path.resolve(dir,'../..'),stdio:'inherit'});record.childPid=child.pid;save();record.nativeExit=await new Promise((ok,no)=>{child.once('exit',ok);child.once('error',no);});
 if(fs.existsSync(path.join(dir,'663-nativos.json'))){const native=JSON.parse(fs.readFileSync(path.join(dir,'663-nativos.json'),'utf8'));record.nativePhase=native.phase;record.nativeCounts=native.counts;}
 record.phase='finished-review-results';
}catch(error){record.error=String(error.stack||error);record.phase='not-completed';process.exitCode=1;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
