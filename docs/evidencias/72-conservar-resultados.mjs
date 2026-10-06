import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const resultDir = path.join(here, '72-resultados');
const raw = fs.readFileSync(path.resolve(root, '../audit-runtime-results-20261002/jest-mocked.json'));
const report = JSON.parse(raw);
if (!report.success || report.numTotalTests !== 32 || report.numPassedTestSuites !== 6
  || report.testResults.some(t => !t.name.includes('.audit-pr1259-20261006'))) {
  throw new Error('The latest runtime result is not the six-suite pending-PR run');
}
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
fs.mkdirSync(resultDir, { recursive: true });
fs.writeFileSync(path.join(resultDir, 'pr1259-focalizada.json.gz'), zlib.gzipSync(raw));
const manifest = {
  mainSourceCommit: 'e52c07839563115236652229d73ac5ebf2e4e551',
  pendingSourceCommit: '7c96e11427c673d72638ac593bcd783915955aa8',
  reusedMainEvidence: '../71-resultados/manifest.json',
  run: { file: 'pr1259-focalizada.json.gz', uncompressedSha256: digest(raw),
    sourceCommit: '7c96e11427c673d72638ac593bcd783915955aa8',
    startTime: new Date(report.startTime).toISOString(),
    suitesPassed: report.numPassedTestSuites, testsPassed: report.numPassedTests,
    testsFailed: report.numFailedTests, testsPending: report.numPendingTests,
    scope: 'six changed unit suites, NOT full build/E2E/providers',
    command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --maxWorkers=1 --runTestsByPath ' + report.testResults.map(t => t.name.slice(t.name.indexOf('src')) .replaceAll('\\', '/')).join(' '),
  },
  probes: ['72-barra-probe.cjs', '72-salon-probe.cjs', '72-invitado-probe.cjs'].map(name => ({
    file: '../' + name, sourceSha256: digest(fs.readFileSync(path.join(here, name))),
    command: `node docs/evidencias/${name} [SHA]`,
    executedSourceCommits: ['e52c07839563115236652229d73ac5ebf2e4e551', '7c96e11427c673d72638ac593bcd783915955aa8'],
    meaning: name === '72-invitado-probe.cjs' ? 'seven real-helper acceptance cases per SHA, not HTTP'
      : 'assertions reproduce defects, NOT acceptance of a correction',
  })),
  scopeLimit: 'No app edits, build, merge, real orders, production data changes or zero-error certification.',
};
fs.writeFileSync(path.join(resultDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.run));
