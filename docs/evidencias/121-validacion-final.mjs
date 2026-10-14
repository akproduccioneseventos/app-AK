import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const read=name=>JSON.parse(fs.existsSync(`docs/evidencias/121-${name}.json`)
  ?fs.readFileSync(`docs/evidencias/121-${name}.json`,'utf8')
  :zlib.gunzipSync(fs.readFileSync(`docs/evidencias/121-${name}.json.gz`)).toString('utf8'));
const build=read('build-execution'),sha=build.sha;
const auxiliary=f=>/^(docs\/|tests\/|src\/__tests__\/|graphify-out\/|ESTADO-ACTUAL\.md$)/.test(f);
for(const args of [['diff','--name-only',sha,'HEAD'],['diff','--name-only','HEAD']]){
  const files=execFileSync('git',args,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  assert(files.every(auxiliary),'Source differs from frozen build');
}
for(const mode of ['build','jest','acentos','probe']){
  const run=read(`${mode}-execution`);assert.equal(run.applicationSourceSha,sha);assert.equal(run.status,'finished');assert.equal(run.exitCode,0);
  if(['build','jest'].includes(mode))assert.equal(run.cleanup.bytesRestored,true);
}
const tests=read('jest');assert.equal(tests.numTotalTestSuites,734);assert.equal(tests.numPassedTestSuites,734);
assert.equal(tests.numTotalTests,4600);assert.equal(tests.numPassedTests,4600);
for(const key of ['numFailedTestSuites','numPendingTestSuites','numFailedTests','numPendingTests','numTodoTests'])assert.equal(tests[key],0);
const baseline=read('chat-ack-resultados');assert.equal(baseline.applicationSourceSha,'3a3bc1c673476b75065e8063358c48797c071700');
assert.equal(baseline.results.length,2);for(const r of baseline.results){assert.equal(r.status,'DEFECT_REPRODUCED');assert.equal(r.before.length,1);assert.equal(r.after.length,2);assert.equal(r.expectedCount,1);}
const native=read('chat-aceptacion-resultados');assert.equal(native.applicationSourceSha,sha);assert.equal(native.cleanup.bytesRestored,true);
assert.equal(native.provider,'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS');assert.equal(native.results.length,16);
for(const viewport of ['desktop','mobile']){
  const rows=native.results.filter(r=>r.viewport===viewport);assert.equal(rows.length,8);assert(rows.every(r=>r.status==='PASS'));
  const reload=rows.find(r=>r.name==='reload-and-visible-same-attempt-retry-preserves-budget-and-crm').details;
  assert.equal(reload.count,2);assert.equal(reload.sameAttemptAfterReload,true);assert.equal(reload.crmUnchanged,true);
  const concurrent=rows.find(r=>r.name==='two-concurrent-first-confirmations-create-only-one-new-budget').details;
  assert.equal(concurrent.countBefore,3);assert.equal(concurrent.countAfter,4);assert.equal(concurrent.concurrentFirstWrites,2);
  assert.equal(concurrent.total,1000);assert.equal(concurrent.numero,4);
  const doc=rows.find(r=>r.name==='saved-budget-document-visible-and-persistent-after-reload').details;assert.equal(doc.documentVisible,true);assert.equal(doc.persistentAfterReload,true);
}
const clean=read('limpieza-sdk');assert.equal(clean.total,0);
const stopped=read('entorno-detenido');assert.equal(stopped.stopped.length,2);assert.equal(stopped.listeners.length,0);assert.equal(stopped.appFailure,false);assert(stopped.stopped.every(s=>s.intentionalTermination));
const marketingHash=crypto.createHash('sha256').update(fs.readFileSync('src/data/marketing-checklist.json')).digest('hex');
assert.equal(marketingHash,'f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5');
const graph=JSON.parse(fs.readFileSync('graphify-out/graph.json'));assert.equal(graph.built_at_commit,sha);
const result={status:'PASS_CHAT_BUDGET_ACK_ONLY',applicationSourceSha:sha,evidenceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  suites:734,tests:4600,failed:0,omitted:0,nativeCases:16,graph:{nodes:graph.nodes.length,links:graph.links.length,communities:new Set(graph.nodes.map(n=>n.community)).size,llmCalls:0,partialParserWarnings:25},
  sdkRemaining:0,ownedServicesStopped:2,foreignBytesRestored:true,privateClaude:'NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE',
  externalModelCertified:false,allAppCertified:false,publishedCertified:false,
  limits:['Otros efectos del chat no idempotentes por este parche','Modelo externo, voz y respuestas no deterministas no certificados','Catalogo cambiante o fecha inferida pueden rechazar un reintento distinto sin duplicar','Hosting OAuth 19 originales hardware no probados']};
fs.writeFileSync('docs/evidencias/121-aceptacion.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
