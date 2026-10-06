import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const sha = '368988bb64e823d31c9d5c4b2fb9adc114b207ef';
const runtime = path.resolve(root, '../audit-runtime-results-20261002');
const raw = fs.readFileSync(path.join(runtime, 'jest-mocked.json'));
const result = JSON.parse(raw);
if (!result.success || result.numPassedTests !== 3522 || result.numPassedTestSuites !== 608
  || result.numFailedTests !== 0 || result.numPendingTests !== 0
  || result.testResults.some(test => !test.name.includes('.audit-integral-73-20261006'))) {
  throw new Error('Expected the complete 608-suite / 3522-test audit74 run');
}
const listRaw = fs.readFileSync(path.join(runtime, 'e2e-list.log'));
const list = JSON.parse(listRaw);
let declared = 0;
const files = new Set();
function count(suite) {
  for (const spec of suite.specs || []) {
    declared += (spec.tests || []).length;
    files.add(spec.file || suite.file);
  }
  for (const child of suite.suites || []) count(child);
}
count(list);
if (declared !== 491 || files.size !== 104 || list.errors.length !== 0) {
  throw new Error('Expected discovery only: 491 desktop cases in 104 files');
}
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const output = path.join(here, '74-resultados');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'unitarias.json.gz'), zlib.gzipSync(raw));
fs.writeFileSync(path.join(output, 'e2e-inventario.json.gz'), zlib.gzipSync(listRaw));
const probeRaw = execFileSync(process.execPath, [path.join(here, '74-media-y-contacto-probe.cjs'), sha], { cwd: root });
fs.writeFileSync(path.join(output, 'sonda.jsonl'), probeRaw);
const captures = ['74-foto-glitter-toro.png', '74-video-testimonio.png', '74-privacidad-contacto.png'];
const asset = 'public/media/catalogo-servicios/glitter-bar-01.jpeg';
const manifest = {
  sourceCommit: sha,
  documentationBranch: 'codex/auditoria-73-20261006',
  openPullRequestsObserved: [],
  unit: {
    file: 'unitarias.json.gz', uncompressedSha256: digest(raw),
    started: new Date(result.startTime).toISOString(),
    finishedWrapperUtc: '2026-10-06T18:23:04.633Z',
    suitesPassed: 608, testsPassed: 3522, testsFailed: 0, testsPending: 0,
    command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --silent --maxWorkers=2',
    scope: 'Unit/action tests with synthetic dependencies; no acceptance browser, build, live providers or hardware.',
    previousFocused21AreIncluded: true,
  },
  browserDiscovery: {
    file: 'e2e-inventario.json.gz', uncompressedSha256: digest(listRaw),
    declaredDesktopCases: declared, declaredFiles: files.size, executed: 0,
    command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . e2e-list --project=chromium-desktop --reporter=json',
    meaning: 'Playwright --list only. The reporter skipped count does not mean these flows ran.',
  },
  defectProbe: {
    file: 'sonda.jsonl', sha256: digest(probeRaw),
    sourceFile: '../74-media-y-contacto-probe.cjs',
    sourceSha256: digest(fs.readFileSync(path.join(here, '74-media-y-contacto-probe.cjs'))),
    meaning: 'Passing assertions reproduce incorrect category and email-as-phone. NOT acceptance.',
    simulated: 'Company data and Next Link only; actual classifier, async privacy page and React server renderer.',
  },
  inspectedAsset: {
    path: asset,
    sourceSha256: digest(execFileSync('git', ['show', `${sha}:${asset}`], { cwd: root })),
    localSha256: digest(fs.readFileSync(path.join(root, asset))),
    visualObservation: 'Mechanical bull inside inflatable enclosure; not a glitter station.',
  },
  screenshots: captures.map(file => ({ file: `../${file}`, sha256: digest(fs.readFileSync(path.join(here, file))) })),
  publicBrowser: {
    urls: ['https://akproducciones.uy/', 'https://akproducciones.uy/privacidad'],
    deploymentCommit: 'not verified',
    writesToProduction: false,
    scope: 'One testimonial, one actual playing YouTube video, gallery load-more and one wrong-image modal, privacy contact.',
  },
  build: {
    executor: 'Claude, reported for PR1260; not independently executed by Codex',
    reportedCommit: '7dfba1da3',
    sourceDiffToTarget: 'empty git diff --name-only 7dfba1da3..368988bb',
    originalGateLogsReviewed: false,
  },
  limits: ['No full private-role HTTP acceptance', 'No external authorization or physical-device test',
    'No reconciliation of all 19 imported budgets against originals', 'No zero-error certification'],
};
if (manifest.inspectedAsset.sourceSha256 !== manifest.inspectedAsset.localSha256) {
  throw new Error('Inspected image differs from the target Git source');
}
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ sourceCommit: sha, testsPassed: 3522, suitesPassed: 608, declaredE2E: declared, executedE2E: 0 }));
