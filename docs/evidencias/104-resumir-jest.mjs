import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const root = path.resolve('docs/evidencias');
const name = process.argv[2] || '104-jest';
if (!/^(104-jest|105-jest(?:-(?:inicial|pre-seguridad|pre-calendario))?|106-jest(?:-pre-(?:pausa|layout))?)$/.test(name)) throw new Error('Own Jest evidence only');
const sha = /^10[56]-/.test(name) ? process.argv[3] : 'a6d2086109e0e1a113307fde23674471f62bc377';
if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('Exact source SHA required');
execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { stdio: 'pipe' });
const bytes = fs.readFileSync(path.join(root, name + '.json'));
const result = JSON.parse(bytes);
const archive = gzipSync(bytes);
const hash = value => createHash('sha256').update(value).digest('hex');
const summary = {
  sha,
  command: /^10[56]-/.test(name) ? `node docs/evidencias/${name.slice(0, 3)}-ejecutar-candidato.mjs jest` : 'node docs/evidencias/104-ejecutar-aislado.mjs jest',
  success: result.success,
  suites: result.numTotalTestSuites, passedSuites: result.numPassedTestSuites,
  tests: result.numTotalTests, passed: result.numPassedTests,
  failed: result.numFailedTests, pending: result.numPendingTests,
  start: new Date(result.startTime).toISOString(),
  finish: new Date(Math.max(...result.testResults.map(r => r.endTime))).toISOString(),
  rawSha256: hash(bytes), archive: name + '.json.gz', archiveSha256: hash(archive),
  failures: result.testResults.filter(r => r.status !== 'passed').map(r => ({ name: r.name, message: r.message }))
};
fs.writeFileSync(path.join(root, summary.archive), archive);
fs.writeFileSync(path.join(root, name + '-resumen.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
