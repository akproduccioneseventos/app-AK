import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read = name => JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
const prior=read('198-consolidado.json'), sdk=read('200-solicitudes-portal-sdk.json'), ui=read('201-solicitudes-ui.json'), execution=read('200-ejecucion.json');
for(const result of [sdk,ui]) { assert.equal(result.source,prior.source);assert.ok(!result.unexpected);assert.ok(!result.observedErrors?.some(item=>item.startsWith('QA_HARNESS'))); }
assert.deepEqual(sdk.summary,{total:9,pass:6,fail:3});assert.deepEqual(ui.summary,{total:8,pass:6,fail:2});
assert.equal(sdk.remainingDocuments,0);assert.equal(execution.cleanupStatus,200);assert.equal(execution.exitCode,1);assert.ok(!execution.error);
const extra=[['200-solicitudes-portal-sdk.json',sdk],['201-solicitudes-ui.json',ui]].map(([name,result])=>({file:name,sha256:crypto.createHash('sha256').update(fs.readFileSync(new URL(name,import.meta.url))).digest('hex'),...result.summary,failedIds:result.cases.filter(row=>!row.pass).map(row=>row.id)}));
const final={source:prior.source,checkedAt:new Date().toISOString(),previous:prior.summary,extension:extra,
  summary:{total:prior.summary.total+17,pass:prior.summary.pass+12,fail:prior.summary.fail+5},
  uniqueDefects:10,uxFriction:1,sdkCleaned:true,appChanged:false,entireAppAccepted:false,
  limits:'Final count is criteria, not independent bugs.200 three failures share stale request-list overwrite;201 two failures share explicit0 lost. SDK200 real actions/saveFiesta/transaction demo;201 actual UI/actions with store adapters.198 older cut preserved. No real integrations, native current-source build, Hosting or zero-error certificate.'};
fs.writeFileSync(new URL('202-consolidado.json',import.meta.url),JSON.stringify(final,null,2)+'\n');console.log(JSON.stringify(final));
