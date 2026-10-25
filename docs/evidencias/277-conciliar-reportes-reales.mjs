import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {normalizeReport,mergeHistories} from './276-normalizar-casos.mjs';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'277-conciliacion-nativa.json');assert(!fs.existsSync(target),'Preserve');
const source='725e62ba2f909578628fad47402d125ed9632c70',collections=[],reports=[];
for(const run of ['269','274']){
 const execution=JSON.parse(fs.readFileSync(path.join(dir,`${run}-ejecucion.json`),'utf8'));assert.equal(execution.source,source);assert.equal(execution.phase,'finished');assert.equal(execution.sourceDiff,'');
 for(const batch of execution.batches){const bytes=fs.readFileSync(path.join(dir,batch.report));const raw=JSON.parse(bytes),rows=normalizeReport(raw,run);
  const stats=Object.fromEntries(['expected','unexpected','skipped','flaky'].map(key=>[key,rows.filter(r=>r.reportedOutcome===key).length]));
  assert.deepEqual(stats,Object.fromEntries(Object.keys(stats).map(k=>[k,raw.stats[k]])),`Actual producer totals ${batch.report}`);
  assert.equal(new Set(rows.map(r=>r.identity)).size,rows.length,`No identities collide ${batch.report}`);
  reports.push({file:batch.report,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),cases:rows.length,stats});collections.push(rows);
 }
}
const merged=mergeHistories(...collections),compact=merged.map(row=>{
 const actual=row.history.filter(h=>h.executed),last=actual.at(-1)||row.history.at(-1);
 return {identity:row.identity,file:row.sourceFile,title:row.fullTitle,project:row.project,executed:actual.length>0,lastExecutedStatus:actual.at(-1)?.status,kind:last.kind,everFailed:actual.some(h=>['failed','timedOut'].includes(h.status)),attempts:row.history.map(h=>({run:h.runId,status:h.status,reportedOutcome:h.reportedOutcome,expectedStatus:h.expectedStatus,kind:h.kind,annotations:h.annotations,errors:h.errors})),acceptance:false};
});
const selection=JSON.parse(fs.readFileSync(path.join(dir,'268-seleccion.json'),'utf8')).selected;
const seen=new Set(compact.map(r=>path.basename(r.file))),missingFiles=selection.filter(f=>!seen.has(f));
const summary={uniqueCases:compact.length,executed:compact.filter(c=>c.executed).length,passedLatest:compact.filter(c=>c.lastExecutedStatus==='passed').length,failedLatest:compact.filter(c=>['failed','timedOut'].includes(c.lastExecutedStatus)).length,neverExecuted:compact.filter(c=>!c.executed).length,fixmeNeverExecuted:compact.filter(c=>!c.executed&&c.kind==='fixme').length,declaredSkipNeverExecuted:compact.filter(c=>!c.executed&&c.kind==='skip').length,otherNeverExecuted:compact.filter(c=>!c.executed&&!['skip','fixme'].includes(c.kind)).length};
const skipGroups=new Map();for(const c of compact.filter(c=>!c.executed)){const reason=c.attempts.at(-1).annotations.map(a=>a.description||a.type).join('; '),key=JSON.stringify([c.file,c.kind,reason]);skipGroups.set(key,(skipGroups.get(key)||0)+1);}
const receipt={source,reports,summary,missingFiles,unexecutedGroups:[...skipGroups].map(([key,count])=>({key:JSON.parse(key),count})),cases:compact,acceptance:false,scope:'Normalized ACTUAL producer outcomes, projects and generated case identities; preserves every old attempt. Passes, expected failures, skipped/fixme and unstarted cases remain distinct. Not all functions/roles accepted. 273 preliminary counters are superseded for reporting; source results unchanged.'};
fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary,missingFiles,unexecutedGroups:receipt.unexecutedGroups}));
