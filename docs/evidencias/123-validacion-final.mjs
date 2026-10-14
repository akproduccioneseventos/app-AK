import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const read=name=>{const f=`docs/evidencias/123-${name}.json`;return JSON.parse(fs.existsSync(f)?fs.readFileSync(f):zlib.gunzipSync(fs.readFileSync(f+'.gz')));};
const sha=read('build-execution').sha;
const auxiliary=f=>/^(docs\/|tests\/|src\/__tests__\/|graphify-out\/|ESTADO-ACTUAL\.md$|AGENTS\.md$)/.test(f);
for(const args of [['diff','--name-only',sha,'HEAD'],['diff','--name-only','HEAD']])assert(execFileSync('git',args,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).every(auxiliary),'Application source changed after build');
for(const mode of ['unit','build','acentos']){const r=read(mode+'-execution');assert.equal(r.applicationSourceSha,sha);assert.equal(r.status,'finished');assert.equal(r.exitCode,0);if(r.cleanup)assert.equal(r.cleanup.bytesRestored,true);}
const tests=read('jest-consolidado');assert.equal(tests.applicationSourceSha,sha);assert.equal(tests.status,'PASS_COMPOSITE_SAME_APP_SHA');assert(tests.success);assert.equal(tests.numPassedTestSuites,tests.numTotalTestSuites);assert.equal(tests.numPassedTests,tests.numTotalTests);
for(const k of ['numFailedTestSuites','numPendingTestSuites','numFailedTests','numPendingTests','numTodoTests'])assert.equal(tests[k],0);
let nativeCases=0;
for(const [name,count]of [['chat-aceptacion-resultados',16],['ia-final-resultados',34],['posicion-resultados',2]]){
  const r=read(name);assert.equal(r.applicationSourceSha,sha);assert.equal(r.results.length,count);assert(r.results.every(c=>c.status==='PASS'));assert.equal(r.cleanup.bytesRestored,true);
  if(r.provider)assert.equal(r.provider,'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS');nativeCases+=count;
}
const ia=read('ia-final-resultados');
for(const viewport of ['desktop','mobile']){
  const rows=ia.results.filter(r=>r.viewport===viewport);assert.equal(rows.length,17);
  for(const [name,total]of [['por-persona-base',75000],['tramos',12000],['ratio',3000],['duplicate-service',1000],['menu-infantil',25000]])assert.equal(rows.find(r=>r.name===name).details.actual,total);
  for(const name of ['partial-catalog','categoria-ambigua','menu-sin-edades','sin-tramo'])assert.equal(rows.find(r=>r.name===name).details.actual,null);
  const interleaved=rows.find(r=>r.name==='uncertain-A-confirmed-B-reload-retry-A').details;assert.equal(interleaved.afterRetry,1);assert.equal(interleaved.deliberateNewQuote,2);
}
for(const r of read('posicion-resultados').results){assert(r.hitbox.every(p=>p.uncovered));assert(r.keyboardFocus);assert(r.canvasColors>30);assert(r.cameraMoves);}
const smoke=read('deps-smoke');assert.equal(smoke.applicationSourceSha,sha);assert.equal(smoke.results.length,9);assert(smoke.results.every(r=>r.status==='PASS'));
assert.equal(read('limpieza-sdk').total,0);const stopped=read('entorno-detenido');assert.equal(stopped.stopped.length,2);assert.equal(stopped.listeners.length,0);assert(stopped.stopped.every(s=>s.intentionalTermination));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/data/marketing-checklist.json')).digest('hex'),'f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5');
const graph=JSON.parse(fs.readFileSync('graphify-out/graph.json'));assert.equal(graph.built_at_commit,sha);
const npm=read('npm-audit-despues');assert(npm.metadata?.vulnerabilities);
const result={status:'PASS_AI_PRICING_CHAT_POSITION_COMPATIBLE_PATCHES_ONLY',applicationSourceSha:sha,provider:'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS',suites:tests.numTotalTestSuites,tests:tests.numTotalTests,failed:0,omitted:0,nativeCases,dependencySmokeCases:9,
  jestEvidence:tests.evidence,
  residualDependencyAudit:npm.metadata.vulnerabilities,allDependencySecurityCertified:false,
  graph:{nodes:graph.nodes.length,links:graph.links.length,communities:new Set(graph.nodes.map(n=>n.community)).size,llmCalls:0},sdkRemaining:0,ownedServicesStopped:2,foreignBytesRestored:true,
  mergeOwner:'Claude',privateClaude:'NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE',allAppCertified:false,externalModelCertified:false,realVoiceCertified:false,publishedCertified:false,
  limits:['Only named native scenarios, not all421 routes or14 areas','Discounts/gifts use existing financial-engine unit tests; model instruction semantics not certified','Real Gemini/voice, OAuth/Hosting,19original budgets and physical equipment not tested','Residual dependency advisories requiring structural/major review remain recorded, including Firebase CLI tar6']};
fs.writeFileSync('docs/evidencias/123-aceptacion.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
