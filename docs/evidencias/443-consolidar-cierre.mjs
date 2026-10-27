import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),repo=path.resolve(dir,'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const completed=read('442-ejecucion.json'),emulators=read('440-emuladores.json');
assert.equal(completed.phase,'finished');assert.equal(completed.exitCode,0);
assert.equal(completed.stats.expected,8);assert.equal(completed.stats.unexpected,0);
assert.equal(emulators.phase,'finished');assert.equal(emulators.cleanupStatus,200);
assert.equal(completed.sourceDiff,'');
const tests=[];
function walk(node,report){
 for(const s of node.suites||[])walk(s,report);
 for(const s of node.specs||[])for(const t of s.tests||[]){
  const result=t.results?.at(-1),attachments=(result?.attachments||[])
   .filter(a=>a.contentType==='application/json'&&a.body)
   .map(a=>({name:a.name,data:JSON.parse(Buffer.from(a.body,'base64').toString('utf8'))}));
  tests.push({report,file:s.file,title:s.title,project:t.projectName,status:result?.status,attachments});
 }
}
for(let i=1;i<=3;i++){const name=`442-batch-00${i}-resultados.json`;walk(read(name),name);}
assert.equal(tests.length,8);assert(tests.every(t=>t.status==='passed'));
const simulator=tests.find(t=>t.file.includes('prospecto-simulador'));
const persistence=simulator.attachments.find(a=>a.name==='qa439-sdk-persistence').data;
assert.equal(persistence.budgets.length,1);assert.equal(persistence.leads.length,1);
const trackedDiff=execFileSync('git',['diff','--name-only'],{cwd:completed.qa,encoding:'utf8'}).trim();
assert.equal(trackedDiff,'');
const processIds=[completed.serverPid,completed.testPid,emulators.firestorePid,emulators.storageCliPid];
const running=processIds.filter(pid=>{try{process.kill(pid,0);return true;}catch{return false;}});
assert.deepEqual(running,[],'Owned processes must be closed before publication');
const output={created:new Date().toISOString(),source:completed.source,build:'406',runtimeCopy:'427',
 result:'PASS_EIGHT_SCOPED_CONTROLS_NOT_GLOBAL_ACCEPTANCE',tests,
 observed:{simulatorBudgets:1,simulatorLeads:1,cleanupStatus:200,trackedDiff,ownedProcessesRunning:running},
 limitations:[
  'Photo preview stable with synthetic camera and real local Firestore, not hardware/printing/face model quality.',
  'Three-photo control records invalid-transition responses: preview PASS is not synchronized state acceptance.',
  'Photo rejection is a controlled client response AFTER real local upload; not real provider rejection.',
  'Photo network loss confirms local backup and truthful UI, not later automatic upload delivery.',
  'Vision unavailable scenario uses dummy key/local failure, not external Vision service.',
  'Original simulator failure skipped clicking Ver Resumen; readiness adaptation preserves business assertions.',
  '421 old QA data snapshot incomplete: quarantine .qa-392, no claim of exact restoration. Fresh427 source/runtime verified and restored.',
  'Existing estree type artifact mismatch disclosed in406; not clean npm-ci.',
  'No global zero-error, every-role/every-control or production approval.'
 ]};
fs.writeFileSync(path.join(dir,'443-cierre-observado.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({tests:tests.length,pass:8,simulatorBudgets:1,simulatorLeads:1,cleanupStatus:200,trackedDiff,ownedProcessesRunning:running}));
