import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const maximum=process.argv.includes('--all-closed')?26:19,id=maximum===26?'319':'317',target=path.join(dir,`${id}-origen-errores-consola.json`);assert(!fs.existsSync(target));
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f',build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8'));assert.equal(build.source,source);
const chunk='97757.f9560f5d593e1aa2.js',chunkFile=path.join(build.qa,'.next/static/chunks',chunk),bytes=fs.readFileSync(chunkFile),chunkSha256=crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(chunkSha256,'ad3c20d4cafaee90af32ace5013c66eb7d5126244a80bb0994da12821e4b567b');assert(bytes.toString().includes('firebaseinstallations.googleapis.com'));
const run=JSON.parse(fs.readFileSync(path.join(dir,'310-ejecucion.json'),'utf8'));assert.equal(run.source,source);
const reports=run.batches.filter(b=>b.index<=maximum);const cases=[];let unexpected=0;
const tar=(zip,args)=>{const r=spawnSync('C:/Windows/System32/tar.exe',[...args,zip],{encoding:'utf8',maxBuffer:64*1024**2,timeout:30000});assert.equal(r.status,0,r.stderr);return r.stdout;};
for(const batch of reports){
 const report=JSON.parse(fs.readFileSync(path.join(dir,batch.report),'utf8'));let producerCount=0;
 const visit=suite=>{
  for(const spec of suite.specs||[])for(const test of spec.tests||[]){if(test.status!=='unexpected')continue;producerCount++;const errors=(test.results||[]).flatMap(r=>r.errors||[]).map(e=>e.message||'');if(!errors.some(e=>e.includes('Failed to fetch')))continue;
   assert(spec.id&&test.projectName);const row={caseId:spec.id+'|'+test.projectName,file:spec.file,title:spec.title,project:test.projectName,report:batch.report,errors,traces:[],pageErrors:[],matchingKnownFirebaseInstallations:false};
   for(const attachment of(test.results||[]).flatMap(r=>r.attachments||[]).filter(a=>a.name==='trace'&&a.path)){
    const zip=path.resolve(attachment.path);assert(zip.startsWith(path.resolve(dir)+path.sep+'310-batch-'));if(!fs.existsSync(zip)){row.traces.push({zip,missing:true});continue;}
    const files=tar(zip,['-tf']).split(/\r?\n/).filter(n=>n.endsWith('.trace'));row.traces.push({zip,files});
    for(const name of files){const r=spawnSync('C:/Windows/System32/tar.exe',['-xOf',zip,name],{encoding:'utf8',maxBuffer:64*1024**2,timeout:30000});assert.equal(r.status,0,r.stderr);
     for(const line of r.stdout.split('\n').filter(Boolean)){let event;try{event=JSON.parse(line);}catch{continue;}if(event.type!=='event'||event.method!=='pageError')continue;const error=event.params?.error?.error||event.params?.error||{};const stack=error.stack||'';const known=stack.includes(chunk+':1:1715');row.pageErrors.push({message:error.message,stack,matchingKnownFirebaseInstallations:known});}
    }
   }
   row.matchingKnownFirebaseInstallations=row.pageErrors.length>0&&row.pageErrors.every(e=>e.matchingKnownFirebaseInstallations);cases.push(row);
  }
  for(const child of suite.suites||[])visit(child);
 };for(const suite of report.suites||[])visit(suite);
 assert.equal(producerCount,report.stats.unexpected,'Use actual Playwright producer count');unexpected+=producerCount;
}
const result={source,scope:`Closed310batches1..${maximum} only; actual captured browser errors, no new app run.`,reports:reports.map(b=>b.report),unexpectedProducerCount:unexpected,casesWithFailedFetch:cases.length,casesAllErrorsKnownFirebaseInstallations:cases.filter(c=>c.matchingKnownFirebaseInstallations).length,chunk,chunkSha256,cases,limits:'Matching the first stack frame identifies this denied FirebaseInstallations registration, NOT a broken agenda/financial/report button. No area accepted, no offline/realFirebase certification, no source change. Other assertion/capture/time failures still require separate classification. Cheap helper could not finish extraction or create files; principal implemented this small archive reader and checked producer counts.'};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,cases:undefined,reports:undefined}));
