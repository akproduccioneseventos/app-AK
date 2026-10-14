import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';

const read=name=>{
  const base=`docs/evidencias/124-${name}.json`;
  return JSON.parse(fs.existsSync(base)?fs.readFileSync(base):zlib.gunzipSync(fs.readFileSync(base+'.gz')));
};
const sha='74258c9ffa3c8926327f1d8da74f0fffb0100e60';
const auxiliary=f=>/^(docs\/|tests\/|src\/__tests__\/|graphify-out\/|ESTADO(?:-ACTUAL)?\.md$|AGENTS\.md$)/.test(f);
for(const args of [['diff','--name-only',sha,'HEAD'],['diff','--name-only','HEAD']]){
  const changed=execFileSync('git',args,{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  assert(changed.every(auxiliary),`Changes outside auxiliary evidence scope: ${changed.filter(f=>!auxiliary(f)).join(', ')}`);
}

for(const mode of ['build','acentos']){
  const r=read(`${mode}-execution`);
  assert.equal(r.applicationSourceSha,sha,`${mode} source SHA`);
  assert.equal(r.status,'finished',`${mode} status`);
  assert.equal(r.exitCode,0,`${mode} exit code`);
  if(r.cleanup)assert.equal(r.cleanup.bytesRestored,true,`${mode} restored bytes`);
}

const jestExecution=read('jest-execution');
assert.equal(jestExecution.applicationSourceSha,sha,'Jest execution source SHA');
assert.equal(jestExecution.status,'finished','Jest execution status');
assert.equal(jestExecution.exitCode,0,'Jest execution exit code');
const jest=read('jest');
assert(jest.startTime >= Date.parse(jestExecution.started)-2000,'Jest result belongs to this execution');
assert(jest.startTime <= Date.parse(jestExecution.finished),'Jest result time is within execution');
assert.equal(jestExecution.cleanup.bytesRestored,true,'Jest restored bytes');
assert.equal(jest.success,true,'Jest success');
for(const key of ['numFailedTestSuites','numPendingTestSuites','numFailedTests','numPendingTests','numTodoTests'])assert.equal(jest[key],0,`Jest ${key}`);
assert.equal(jest.numPassedTestSuites,jest.numTotalTestSuites,'all Jest suites passed');
assert.equal(jest.numPassedTests,jest.numTotalTests,'all Jest tests passed');

let nativeCases=0;
for(const [name,count]of [['chat-aceptacion-resultados',16],['ia-final-resultados',34],['posicion-resultados',2]]){
  const r=read(name);
  assert.equal(r.applicationSourceSha,sha,`${name} source SHA`);
  assert.equal(r.results.length,count,`${name} case count`);
  assert(r.results.every(c=>c.status==='PASS'&&c.reused!==true),`${name} must be native PASS evidence, not reused`);
  assert(!r.compositeNative,`${name} must not reuse an earlier run`);
  assert.equal(r.cleanup.bytesRestored,true,`${name} restored bytes`);
  if(r.provider)assert.equal(r.provider,'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS');
  nativeCases+=count;
}

const smoke=read('deps-smoke');
assert.equal(smoke.applicationSourceSha,sha,'dependency smoke source SHA');
assert.equal(smoke.results.length,9,'dependency smoke count');
assert(smoke.results.every(r=>r.status==='PASS'),'dependency smoke results');
assert.equal(read('limpieza-sdk').total,0,'remaining fictitious SDK documents');
const stopped=read('entorno-detenido');
assert.equal(stopped.stopped.length,2,'intentionally stopped services');
assert.equal(stopped.listeners.length,0,'remaining service listeners');
assert(stopped.stopped.every(s=>s.intentionalTermination),'intentional owned service shutdown');

for(const viewport of ['desktop','mobile']){
  const rows=read('ia-final-resultados').results.filter(r=>r.viewport===viewport);
  assert.equal(rows.length,17);
  for(const [name,total]of [['por-persona-base',75000],['tramos',12000],['ratio',3000],['duplicate-service',1000],['menu-infantil',25000]])
    assert.equal(rows.find(r=>r.name===name).details.actual,total);
  for(const name of ['partial-catalog','categoria-ambigua','menu-sin-edades','sin-tramo'])
    assert.equal(rows.find(r=>r.name===name).details.actual,null);
  const attempts=rows.find(r=>r.name==='uncertain-A-confirmed-B-reload-retry-A').details;
  assert.equal(attempts.afterRetry,1);assert.equal(attempts.deliberateNewQuote,2);
}
for(const row of read('posicion-resultados').results){
  assert(row.hitbox.every(p=>p.uncovered));assert(row.keyboardFocus);
  assert(row.canvasColors>30);assert(row.cameraMoves);
}

assert.equal(crypto.createHash('sha256').update(fs.readFileSync('src/data/marketing-checklist.json')).digest('hex'),'f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5','marketing checklist hash');
const graph=JSON.parse(fs.readFileSync('graphify-out/graph.json'));
assert.equal(graph.built_at_commit,sha,'local graph source commit');

const npm123=(()=>{
  const base='docs/evidencias/123-npm-audit-despues.json';
  return JSON.parse(fs.existsSync(base)?fs.readFileSync(base):zlib.gunzipSync(fs.readFileSync(base+'.gz')));
})();
assert(npm123.metadata?.vulnerabilities,'historical 123 dependency audit receipt');
const npm124=read('npm-audit-resumen');
assert.equal(npm124.applicationSourceSha,sha,'Fresh dependency audit source');
assert([0,1].includes(npm124.exitCode),'Completed audit including known residual risks');
assert.equal(npm124.uniqueAdvisories,30,'Residual advisory count');
for(const file of ['package.json','package-lock.json']){
  const old=execFileSync('git',['rev-parse',`34f45fbb1a75b7ddc92edadc7831d55f098a9cdb:${file}`],{encoding:'utf8'}).trim();
  const current=execFileSync('git',['rev-parse',`HEAD:${file}`],{encoding:'utf8'}).trim();
  assert.equal(current,old,`${file} unchanged since historical dependency audit123`);
}

const result={
  status:'PASS_INTEGRATED_DELTA123_ONLY',
  applicationSourceSha:sha,
  provider:'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS',
  jest:{suites:jest.numTotalTestSuites,tests:jest.numTotalTests,failed:0,omitted:0},
  nativeCases,
  dependencySmokeCases:9,
  residualDependencyAudit:{classification:'FRESH_124_WITH_HISTORICAL_123_COMPARISON',vulnerabilities:npm124.vulnerabilities,uniqueAdvisories:npm124.uniqueAdvisories},
  allDependencySecurityCertified:false,
  graph:{builtAtCommit:graph.built_at_commit,nodes:graph.nodes.length,links:graph.links.length,communities:new Set(graph.nodes.map(n=>n.community)).size,llmCalls:0},
  sdkRemaining:0,
  ownedServicesStopped:2,
  foreignBytesRestored:true,
  mergeOwner:'Claude',
  mainBase:'f04db06619719be161a630edc8b9babd1abad763',
  allAppCertified:false,
  externalModelCertified:false,
  realVoiceCertified:false,
  publishedCertified:false,
  securityCertified:false,
  limits:['Not zero errors and not certification of the whole app.','Only the named 16 chat, 34 AI and 2 positioning native scenarios; no evidence reused.','Coverage remains limited as recorded in historical123: 421 routes and95evidence follow-ups are not95bugs; references are not functional approval.','Real Gemini/voice, OAuth/Hosting, the 19 original budgets and physical equipment are outside evidence.','Fresh dependency audit retains30GHSA including1criticalCLI; it does not certify total security.']
};
fs.writeFileSync('docs/evidencias/124-aceptacion.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
