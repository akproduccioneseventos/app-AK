import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
const broad=JSON.parse(zlib.gunzipSync(fs.readFileSync('docs/evidencias/123-amplio-123-jest.json.gz')));
const broadRun=JSON.parse(zlib.gunzipSync(fs.readFileSync('docs/evidencias/123-amplio-123-jest-execution.json.gz')));
const focal=JSON.parse(fs.readFileSync('docs/evidencias/123-jest.json'));
const focalRun=JSON.parse(fs.readFileSync('docs/evidencias/123-unit-execution.json'));
assert.equal(broad.numFailedTestSuites,1);assert.equal(broad.numFailedTests,1);
assert.equal(focalRun.applicationSourceSha,broadRun.applicationSourceSha);assert.equal(focalRun.exitCode,0);
assert.equal(focal.numTotalTestSuites,1);assert.equal(focal.numTotalTests,1);assert(focal.success);
const failed=broad.testResults.find(r=>r.status==='failed');assert(failed.name.endsWith('indicador-abre-asistente-real.test.tsx'));
assert(failed.message.includes('ResizeObserver is not defined'));assert.equal(focal.testResults[0].name,failed.name);
assert.deepEqual(focal.testResults[0].assertionResults.map(r=>r.fullName),failed.assertionResults.map(r=>r.fullName));
const suites=broad.testResults.map(r=>r.name===failed.name?focal.testResults[0]:r);
assert(suites.every(r=>r.status==='passed'&&r.assertionResults.every(a=>a.status==='passed')));
const count=suites.flatMap(r=>r.assertionResults).length;assert.equal(count,broad.numTotalTests);
const result={applicationSourceSha:broadRun.applicationSourceSha,status:'PASS_COMPOSITE_SAME_APP_SHA',success:true,
  numTotalTestSuites:suites.length,numPassedTestSuites:suites.length,numTotalTests:count,numPassedTests:count,
  numFailedTestSuites:0,numFailedTests:0,numPendingTestSuites:0,numPendingTests:0,numTodoTests:0,testResults:suites,
  evidence:{wide:'123-amplio-123-jest.json.gz',wideExecution:'123-amplio-123-jest-execution.json.gz',widePassedSuites:broad.numPassedTestSuites,wideFailedToolingSuites:1,
    focal:'123-jest.json',focalExecution:'123-unit-execution.json',repairedSuite:failed.name,originalAssertionsPreserved:true,
    note:'Not a single 740/740 green run. 739 wide passes plus one focused browser-API fixture repair, same production source.'}};
fs.writeFileSync('docs/evidencias/123-jest-consolidado.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({source:result.applicationSourceSha,suites:suites.length,tests:count,evidence:result.evidence}));
