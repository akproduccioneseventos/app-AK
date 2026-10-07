import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const sha = '9bb955ac6af65a314f3ac62975020b37c9edaaf3';
const raw = fs.readFileSync(path.resolve(root, '../audit-runtime-results-20261002/jest-mocked.json'));
const result = JSON.parse(raw);
if (!result.success || result.numPassedTests !== 50 || result.numPassedTestSuites !== 6
  || result.numFailedTests || result.numPendingTests
  || result.testResults.some(test => !test.name.includes('.audit-integral-75-20261007'))) {
  throw new Error('Expected the isolated 50-test retest on the audit75 source worktree');
}
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const output = path.join(here, '75-resultados');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'retest-1261.json.gz'), zlib.gzipSync(raw));
const probe = execFileSync(process.execPath, [path.join(here, '75-simulador-contacto-probe.cjs'), sha], { cwd: root });
fs.writeFileSync(path.join(output, 'contacto-sonda.jsonl'), probe);
const menuFile = 'src/data/menus-catering.json';
const menus = JSON.parse(execFileSync('git', ['show', `${sha}:${menuFile}`], { cwd: root, encoding: 'utf8' }));
const dishes = menus.flatMap(menu => menu.items || []);
const reviewed = ['dish_main_2', 'dish_main_5', 'dish_main_7', 'dish_main_8', 'dish_main_11', 'dish_main_17', 'dish_main_18'];
const assets = reviewed.map(id => {
  const dish = dishes.find(item => item.id === id);
  if (!dish) throw new Error(`Missing reviewed dish ${id}`);
  const file = `public/catering/menus/xv/${id}.jpeg`;
  const gitBytes = execFileSync('git', ['show', `${sha}:${file}`], { cwd: root });
  if (digest(gitBytes) !== digest(fs.readFileSync(path.join(root, file)))) throw new Error(`Asset changed: ${id}`);
  return { id, name: dish.name, localFile: file, sha256: digest(gitBytes), originalCatalogUrl: dish.imageUrl,
    scope: 'Visual comparison against visible Canva recommended-main-dishes panel. Not production menu-selection acceptance.' };
});
const captures = ['75-canva-principales.png', '75-privacidad-publicada.png', '75-simulador-campos-movil.png'];
const manifest = {
  sourceCommit: sha,
  previousSourceCommit: '368988bb64e823d31c9d5c4b2fb9adc114b207ef',
  mergedPullRequest: 1261,
  openPullRequestsObserved: [],
  run: {
    file: 'retest-1261.json.gz', uncompressedSha256: digest(raw),
    started: new Date(result.startTime).toISOString(), finishedWrapperUtc: '2026-10-07T10:37:42.773Z',
    passedSuites: 6, passedTests: 50, failedTests: 0, pendingTests: 0,
    command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --runTestsByPath src/__tests__/auditoria-73-guardado-concurrente.test.ts src/__tests__/barra-72-cambio-y-reintento-autorizado.test.ts src/__tests__/salon-72-plantilla-conserva-escala.test.ts src/__tests__/auditoria-74-categorias-y-contacto.test.ts src/__tests__/auditoria-71-campos-y-compras.test.ts src/__tests__/auditoria-71-presupuesto-nuevo-sin-plata.test.ts --silent --maxWorkers=1',
    scope: 'Application actions with synthetic sessions/storage; financial atomic helper mocked. No real transaction/backend acceptance.',
  },
  probe: { file: 'contacto-sonda.jsonl', sha256: digest(probe),
    sourceFile: '../75-simulador-contacto-probe.cjs', sourceSha256: digest(fs.readFileSync(path.join(here, '75-simulador-contacto-probe.cjs'))),
    actualModules: ['public-simulator-bootstrap.ts', 'commercial/contact.ts', 'public-contact.ts', 'two simulator page callbacks extracted by TypeScript AST'],
    simulated: 'Read-only setting getters and window.open capture. No HTTP, production write, saved budget or outgoing message.',
    meaning: 'Three fallback scenarios reproduce wrong recipient; official configured-number control passes. NOT fix acceptance.' },
  menuReference: { url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering', reviewedAssets: assets,
    catalogFullyAccepted: false },
  screenshots: captures.map(file => ({ file: `../${file}`, sha256: digest(fs.readFileSync(path.join(here, file))) })),
  publicBrowser: { deploymentCommit: 'not identified',
    simulator: 'Desktop empty-field rejection; mobile 390x844 readable entered text and invalid-phone rejection; fields cleared. Did not pass valid-data save boundary.',
    privacyAfter1261: 'Email still visible as WhatsApp after new navigation; correction present in Git source, deployment not verified.',
    productionWrites: false },
  build: { executor: 'Claude reported publicar? green on f1e6f22ab in PR1261',
    sourceDiffToTarget: 'empty git diff --name-only f1e6f22a..9bb955ac',
    independentBuildByCodex: false, originalGateLogsReviewed: false },
  original19Budgets: 'No per-original manifest identified in this Git tree. Not reconciled against authenticated production records.',
  limit: '50 focused cases only; previous 3522 remain tied to their prior SHA. No all-app or deployment certification.',
};
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ sourceCommit: sha, passedTests: 50, assetsCompared: assets.length, newDefect: 'CONTACT75' }));
