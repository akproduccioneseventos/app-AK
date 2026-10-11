import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const root = path.resolve('docs/evidencias');
const bytes = fs.readFileSync(path.join(root, '104-jest.json'));
const result = JSON.parse(bytes);
const archive = gzipSync(bytes);
const hash = value => createHash('sha256').update(value).digest('hex');
const summary = {
  sha: 'a6d2086109e0e1a113307fde23674471f62bc377',
  command: 'node docs/evidencias/104-ejecutar-aislado.mjs jest',
  success: result.success,
  suites: result.numTotalTestSuites, passedSuites: result.numPassedTestSuites,
  tests: result.numTotalTests, passed: result.numPassedTests,
  failed: result.numFailedTests, pending: result.numPendingTests,
  start: new Date(result.startTime).toISOString(),
  finish: new Date(Math.max(...result.testResults.map(r => r.endTime))).toISOString(),
  rawSha256: hash(bytes), archive: '104-jest.json.gz', archiveSha256: hash(archive),
  failures: result.testResults.filter(r => r.status !== 'passed').map(r => ({ name: r.name, message: r.message }))
};
fs.writeFileSync(path.join(root, summary.archive), archive);
fs.writeFileSync(path.join(root, '104-jest-resumen.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
