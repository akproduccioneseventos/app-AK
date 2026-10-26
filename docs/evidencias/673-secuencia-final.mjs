import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{spawn}from'node:child_process';import{fileURLToPath}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='cce8299c18237d9dd432120751d39d4154b7e58b',target=path.join(dir,'673-secuencia.json');assert(!fs.existsSync(target));
const record={source,started:new Date().toISOString(),ownerPid:process.pid,phase:'waiting-build',appEdits:false};const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
const run=async(file,args=[])=>{const p=spawn(process.execPath,[path.join(dir,file),...args],{cwd:path.resolve(dir,'../..'),stdio:'inherit'});record.childPid=p.pid;save();return await new Promise((ok,no)=>{p.once('exit',ok);p.once('error',no);});};
try{
 const deadline=Date.now()+60*60000;let build;
 while(true){if(fs.existsSync(path.join(dir,'669-entorno.json'))){build=JSON.parse(fs.readFileSync(path.join(dir,'669-entorno.json'),'utf8'));assert.equal(build.source,source);if(build.finished)break;}assert(Date.now()<deadline,'Build did not finish in bounded window');await new Promise(ok=>setTimeout(ok,10000));}
 assert.equal(build.buildExit,0);assert.equal(build.sourceDiff,'');record.buildExit=0;record.phase='canonical';save();
 record.canonicalExit=await run('670-jest-final.mjs',['canonical']);const canonical=JSON.parse(fs.readFileSync(path.join(dir,'670-canonical.json'),'utf8'));record.canonicalCounts=canonical.counts;assert.equal(record.canonicalExit,0);assert.equal(canonical.diff,'');
 assert(!fs.existsSync(path.join(dir,'672-nativos.json')));record.phase='native';save();record.nativeExit=await run('672-nativos-final.mjs');
 if(fs.existsSync(path.join(dir,'672-nativos.json'))){const n=JSON.parse(fs.readFileSync(path.join(dir,'672-nativos.json'),'utf8'));record.nativePhase=n.phase;record.nativeCounts=n.counts;}record.phase='finished-review-results';
}catch(error){record.error=String(error.stack||error);record.phase='not-completed';process.exitCode=1;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
