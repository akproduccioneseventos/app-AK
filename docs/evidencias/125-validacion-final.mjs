import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const source = 'b520f7cee28546634e1c87391efd7a80e1a40f48';
function read(name) {
  const path='docs/evidencias/125-'+name+'.json';
  return JSON.parse(fs.existsSync(path)?fs.readFileSync(path,'utf8'):zlib.gunzipSync(fs.readFileSync(path+'.gz')).toString('utf8'));
}
const build=read('build-execution'), execution=read('jest-execution'), tests=read('jest');
assert.equal(build.status,'finished'); assert.equal(build.exitCode,0); assert.equal(build.sha,source);
assert.equal(execution.status,'finished'); assert.equal(execution.exitCode,0); assert.equal(execution.sha,source);
assert(tests.success); assert.equal(tests.numFailedTests,0); assert.equal(tests.numPendingTests,0);
assert.equal(tests.numFailedTestSuites,0); assert.equal(tests.numPendingTestSuites,0);
const changes=execFileSync('git',['diff','--name-only',source,'HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
assert(changes.every(p=>/^(docs\/|ESTADO-ACTUAL\.md$|AGENTS\.md$|graphify-out\/)/.test(p)), 'Source changed after final freeze');
const deps=read('deps-smoke'), audit=read('npm-audit-resumen'), native=read('kiosk-native');
assert(deps.results.every(r=>r.status==='PASS'));
assert.equal(audit.vulnerabilities.critical,0);
for(const evidence of [deps,audit]) {
  for(const file of ['package.json','package-lock.json']) {
    assert.equal(execFileSync('git',['rev-parse',evidence.applicationSourceSha+':'+file],{encoding:'utf8'}).trim(),
      execFileSync('git',['rev-parse',source+':'+file],{encoding:'utf8'}).trim(),'Dependency evidence changed: '+file);
  }
}
assert.equal(native.applicationSourceSha,source); assert(native.allPassed);
const cleanup=read('entorno-detenido'), sdk=read('limpieza-sdk'), fixtures=read('fixtures-limpieza');
assert.equal(sdk.total,0); assert(fixtures.bytesRestored===true||fixtures.cleanup?.bytesRestored===true);
const fixtureExecution=read('fixtures-execution');
assert.equal(fixtureExecution.applicationSourceSha,source);assert.equal(fixtureExecution.status,'finished');
assert.equal(read('start-execution').applicationSourceSha,source);
assert.equal(read('emulator-execution').applicationSourceSha,source);
for(const item of native.cases.filter(x=>x.textContrast!==undefined)) {
  assert(item.textContrast>=4.5);assert(item.placeholderContrast>=4.5);
}
const proof={applicationSourceSha:source,checkedAt:new Date().toISOString(),gate:'PASS_DELTA125_ONLY',
  buildExit:build.exitCode,suites:tests.numPassedTestSuites,tests:tests.numPassedTests,
  nativeCases:native.cases.length,dependencySmokes:deps.results.length,
  textContrast:native.cases.filter(x=>x.textContrast!==undefined).map(x=>({name:x.name,text:x.textContrast,placeholder:x.placeholderContrast})),
  uniqueAdvisories:audit.uniqueAdvisories,vulnerabilities:audit.vulnerabilities,
  dependencyEvidenceSource:audit.applicationSourceSha,dependencyLockReuseVerified:true,
  sdkTotal:sdk.total,cleanup,allAppCertified:false,realOsPwaInstallCertified:false,
  limits:['beforeinstallprompt/appinstalled simulated in focused tests, not real OS installation',
    'Earlier95 entry inventory is not95 full module approvals',
    'No real OAuth/Hosting/Gemini/voice/hardware/original19-record validation',
    'Remaining dependencies and private Claude source not fully certified']};
fs.writeFileSync('docs/evidencias/125-aceptacion.json',JSON.stringify(proof,null,2)+'\n');
for(const name of ['jest.log','jest.json','jest-execution.json','build.log','rules.log','unit.log']) {
  const path='docs/evidencias/125-'+name;
  if(!fs.existsSync(path))continue;
  const bytes=fs.readFileSync(path), zipped=zlib.gzipSync(bytes);
  assert(zlib.gunzipSync(zipped).equals(bytes));fs.writeFileSync(path+'.gz',zipped);
}
console.log(JSON.stringify({...proof,cleanup:'see125-entorno-detenido.json'}));
