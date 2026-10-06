import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const raw = fs.readFileSync(path.resolve(root, '../audit-runtime-results-20261002/jest-mocked.json'));
const result = JSON.parse(raw);
if (!result.success || result.numTotalTests !== 21 || result.numPassedTestSuites !== 2
  || result.testResults.some(t => !t.name.includes('.audit-integral-73-20261006'))) {
  throw new Error('Expected the isolated 21-test financial retest on the audit73 worktree');
}
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const output = path.join(here, '73-resultados');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'campos-compras-presupuesto.json.gz'), zlib.gzipSync(raw));
const manifest = {
  sourceCommit: '368988bb64e823d31c9d5c4b2fb9adc114b207ef',
  previousSourceCommit: 'e52c07839563115236652229d73ac5ebf2e4e551',
  openPullRequestsObserved: [],
  mergedPullRequest: 1260,
  run: {
    file: 'campos-compras-presupuesto.json.gz', uncompressedSha256: digest(raw),
    started: new Date(result.startTime).toISOString(),
    suitesPassed: result.numPassedTestSuites, testsPassed: result.numPassedTests,
    testsFailed: result.numFailedTests, testsPending: result.numPendingTests,
    command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --runTestsByPath src/__tests__/auditoria-71-campos-y-compras.test.ts src/__tests__/auditoria-71-presupuesto-nuevo-sin-plata.test.ts --maxWorkers=1',
    scope: 'Real application actions with synthetic storage/auth; no browser, emulator, build or providers.',
  },
  probe: {
    file: '../73-guardado-concurrente-probe.cjs', sourceSha256: digest(fs.readFileSync(path.join(here, '73-guardado-concurrente-probe.cjs'))),
    command: 'node docs/evidencias/73-guardado-concurrente-probe.cjs',
    meaning: 'Direct unauthorized change rejected; financial field omitted survives; four interleavings reproduce stale payment overwrite. Passing assertions mean reproduced defect, NOT acceptance.',
    realModules: ['fiesta.actions.ts', 'permission helpers', 'get-fiesta-raw.ts', 'firebase-sync.ts'],
    simulated: 'Only auth/reading infrastructure and Firestore merge:true document.set; no live database or real payment action.',
  },
  screenshot: {
    file: '../73-galeria-hd-destino.png', sha256: digest(fs.readFileSync(path.join(here, '73-galeria-hd-destino.png'))),
    visited: 'https://akproducciones.uy/', clickedLabel: 'Galería HD', destination: 'https://galeria.akproducciones.uy/me',
    visiblePhotoCount: 0, deploymentCommit: 'not verified',
  },
  earlierEvidence: ['../71-resultados/manifest.json', '../72-resultados/manifest.json'],
  limit: 'Historical broad results remain on their original SHAs. No all-app acceptance or zero-error certification.',
};
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.run));
