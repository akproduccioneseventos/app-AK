import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const geometry=read('455-ejecucion.json'),media=read('457-ejecucion.json'),sdk=read('456-emuladores.json');
assert(geometry.finished&&media.finished&&sdk.finished,'Do not publish running jobs as concluded');
assert.equal(sdk.cleanupStatus,200);assert.equal(geometry.source,media.source);assert.equal(media.source,'917a98e32c63fe2f832f5cdc16db87f4fc722b6c');
assert.equal(geometry.sourceDiff,'');assert.equal(media.sourceDiff,'');
const cases=[];
function walk(node,report,scope){for(const s of node.suites||[])walk(s,report,scope);for(const s of node.specs||[])for(const t of s.tests||[]){const r=t.results?.at(-1);cases.push({scope,report,file:s.file,title:s.title,project:t.projectName,status:r?.status,errors:r?.errors?.map(e=>e.message?.replace(/\u001b\[[0-9;]*m/g,'').slice(0,5000)),jsonAttachments:(r?.attachments||[]).filter(a=>a.contentType==='application/json'&&a.body).map(a=>({name:a.name,data:JSON.parse(Buffer.from(a.body,'base64').toString('utf8'))}))});}}
for(const [record,scope]of[[geometry,'geometry-and-stock'],[media,'media-and-sales']])for(const b of record.batches)walk(read(b.report),b.report,scope);
assert.equal(cases.length,18);assert.equal(cases.filter(c=>c.status==='skipped').length,0);
const diff=execFileSync('git',['diff','--name-only'],{cwd:media.qa,encoding:'utf8'}).trim();assert.equal(diff,'');
const owned=[geometry.serverPid,geometry.testPid,media.serverPid,media.testPid,sdk.firestorePid,sdk.storageCliPid];
const active=owned.filter(pid=>{try{process.kill(pid,0);return true;}catch{return false;}});assert.deepEqual(active,[],'Owned processes must be closed');
const counts={};for(const c of cases)counts[c.status]=(counts[c.status]||0)+1;
const result={created:new Date().toISOString(),source:media.source,build:'406 runtime copy427',counts,cases,cleanup:{sdk:sdk.cleanupStatus,trackedDiff:diff,ownedRunning:active},
 interpretation:'All18 selected concrete cases executed, not all app controls/roles. Original assertions retained where originals reused; split sales walk uses same nine route checks. Baseline mismatch is not automatically bad UX; no reference reset. Original earlier failures remain preserved. Provider/hardware/production not certified.'};
fs.writeFileSync(path.join(dir,'462-pendientes-resultados.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({counts,total:cases.length,cleanup:result.cleanup}));
