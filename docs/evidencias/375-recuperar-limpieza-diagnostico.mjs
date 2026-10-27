import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),file=path.join(dir,'371-diagnostico-atomico.json');
const before=fs.readFileSync(file),record=JSON.parse(before),original=path.join(dir,'371-antes-error-limpieza.json');assert(!fs.existsSync(original));fs.writeFileSync(original,before);
assert.equal(record.source,'3f9460185143ef034dcd713e975d2a0af5e20f1a');
const qa=path.resolve(record.qa);assert(qa.startsWith(path.resolve('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-363-3f-')));
const report=JSON.parse(fs.readFileSync(path.join(dir,'371-jest-resultados.json'),'utf8'));
assert.equal(report.numPendingTests,0);assert(report.testResults.every(x=>x.endTime&&['passed','failed'].includes(x.status)));
const cleaned=[];
for(const relative of ['.qa370-atomic-fixture.cjs','.qa371-config.cjs','src/__tests__/qa372-ajustes-mock-atomico.test.ts']){
 const target=path.resolve(qa,relative);assert(target.startsWith(qa+path.sep));
 if(fs.existsSync(target)){fs.unlinkSync(target);cleaned.push(relative);}
}
const diff=spawnSync('git',['diff','--name-only'],{cwd:qa,encoding:'utf8'});assert.equal(diff.status,0,diff.stderr);assert.equal(diff.stdout.trim(),'');
record.summary={suites:report.numTotalTestSuites,total:report.numTotalTests,pass:report.numPassedTests,fail:report.numFailedTests,pending:report.numPendingTests};
record.cleanupRecovery={reason:'Original cleanup compared mixed C:/ and C:\\ path strings and asserted AFTER completed Jest. Resolve both before comparing. No rerun, test assertions unchanged.',cleaned,reportComplete:true,notAppFailure:true,controllerExitBeforeRecovery:1};
record.sourceDiff='';record.phase='finished';record.finished=new Date().toISOString();record.exitCode=report.success?0:1;
fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
