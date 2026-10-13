import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
function read(name,prefix='122'){
  const file=`docs/evidencias/${prefix}-${name}.json`;
  return JSON.parse(fs.existsSync(file)?fs.readFileSync(file,'utf8'):zlib.gunzipSync(fs.readFileSync(file+'.gz')).toString('utf8'));
}
const sha=read('build-execution').sha;
const auxiliary=f=>/^(docs\/|tests\/|src\/__tests__\/|graphify-out\/|ESTADO-ACTUAL\.md$)/.test(f);
for(const args of [['diff','--name-only',sha,'HEAD'],['diff','--name-only','HEAD']]){
  assert(execFileSync('git',args,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).every(auxiliary),'Source differs from build');
}
for(const mode of ['build','jest','acentos','probe','indicador']){
  const run=read(`${mode}-execution`);assert.equal(run.applicationSourceSha,sha);assert.equal(run.status,'finished');assert.equal(run.exitCode,0);
  if(['build','jest'].includes(mode))assert.equal(run.cleanup.bytesRestored,true);
}
const tests=read('jest');assert.equal(tests.numTotalTestSuites,735);assert.equal(tests.numPassedTestSuites,735);assert.equal(tests.numTotalTests,4601);assert.equal(tests.numPassedTests,4601);
for(const key of ['numFailedTestSuites','numPendingTestSuites','numFailedTests','numPendingTests','numTodoTests'])assert.equal(tests[key],0);
const old=read('indicador-antes');assert.equal(old.applicationSourceSha,'87b74b7d809f2524c2d0fcade0176749f5f5c02a');
assert.equal(old.results[0].status,'DEFECT_REPRODUCED');assert.equal(old.results[0].opened,false);assert.equal(old.results[0].legacyTarget,0);assert.equal(old.results[1].status,'PASS');
const indicator=read('indicador-resultados');assert.equal(indicator.applicationSourceSha,sha);assert.equal(indicator.cleanup.bytesRestored,true);assert.equal(indicator.results.length,2);assert(indicator.results.every(r=>r.status==='PASS'));assert.equal(indicator.results[0].opened,true);
const baseline=read('chat-ack-resultados','121');assert.equal(baseline.applicationSourceSha,'3a3bc1c673476b75065e8063358c48797c071700');
assert.equal(baseline.results.length,2);assert(baseline.results.every(r=>r.status==='DEFECT_REPRODUCED'&&r.before.length===1&&r.after.length===2));
const native=read('chat-aceptacion-resultados');assert.equal(native.applicationSourceSha,sha);assert.equal(native.cleanup.bytesRestored,true);assert.equal(native.provider,'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS');assert.equal(native.results.length,16);
for(const viewport of ['desktop','mobile']){
  const rows=native.results.filter(r=>r.viewport===viewport);assert.equal(rows.length,8);assert(rows.every(r=>r.status==='PASS'));
  const reload=rows.find(r=>r.name==='reload-and-visible-same-attempt-retry-preserves-budget-and-crm').details;assert.equal(reload.count,2);assert.equal(reload.sameAttemptAfterReload,true);assert.equal(reload.crmUnchanged,true);
  const concurrent=rows.find(r=>r.name==='two-concurrent-first-confirmations-create-only-one-new-budget').details;assert.equal(concurrent.countBefore,3);assert.equal(concurrent.countAfter,4);assert.equal(concurrent.concurrentFirstWrites,2);assert.equal(concurrent.total,1000);assert.equal(concurrent.numero,4);
  assert.equal(rows.find(r=>r.name==='saved-budget-document-visible-and-persistent-after-reload').details.persistentAfterReload,true);
}
assert.equal(read('limpieza-sdk').total,0);const stopped=read('entorno-detenido');assert.equal(stopped.stopped.length,2);assert.equal(stopped.listeners.length,0);assert(stopped.stopped.every(s=>s.intentionalTermination));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/data/marketing-checklist.json')).digest('hex'),'f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5');
const graph=JSON.parse(fs.readFileSync('graphify-out/graph.json'));assert.equal(graph.built_at_commit,sha);
const result={status:'PASS_INDICATOR_AND_CHAT_BUDGET_ACK_ONLY',applicationSourceSha:sha,evidenceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),suites:735,tests:4601,failed:0,omitted:0,nativeCases:18,
  graph:{nodes:graph.nodes.length,links:graph.links.length,communities:new Set(graph.nodes.map(n=>n.community)).size,llmCalls:0,partialParserWarnings:25},
  sdkRemaining:0,ownedServicesStopped:2,foreignBytesRestored:true,privateClaude:'NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE',externalModelCertified:false,allAppCertified:false,publishedCertified:false,
  limits:['Friccion152 de posicion sigue separada, control puede moverse/minimizarse','Otras acciones/modelo externo/voz no certificados','Catalogo variable/fecha inferida pueden rechazar reintento distinto sin duplicar','Dependencias pendientes y cobertura109 por conciliar','Hosting OAuth19originales hardware no probados']};
fs.writeFileSync('docs/evidencias/122-aceptacion.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
