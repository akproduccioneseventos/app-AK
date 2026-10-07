import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const sha = '9bb955ac6af65a314f3ac62975020b37c9edaaf3';
const runtime = path.resolve(root, '../audit-runtime-results-20261002');
const raw = fs.readFileSync(path.join(runtime, 'jest-mocked.json'));
const results = JSON.parse(raw);
const expected = [
  ['src/__tests__/youtube-sube-el-video.test.ts', 4],
  ['src/__tests__/tiktok-no-canta-victoria-antes.test.ts', 7],
  ['src/__tests__/instagram-no-duplica-al-sincronizar.test.ts', 3],
  ['src/__tests__/la-voz-de-gemini-tts.test.ts', 12],
  ['src/lib/payments/mercadopago-core.test.ts', 10],
  ['src/__tests__/financial-integrity-report.test.ts', 3],
];
if (!results.success || results.numPassedTests !== 39 || results.numFailedTests !== 0
  || results.numPendingTests !== 0 || results.numPassedTestSuites !== 6
  || results.numFailedTestSuites !== 0 || results.testResults.length !== 6) {
  throw new Error('Expected audit77: exactly six suites and 39 passing tests');
}
const suites = expected.map(([file, count]) => {
  const match = results.testResults.find(test => path.relative(root, test.name).replaceAll('\\', '/') === file);
  if (!match || match.status !== 'passed' || match.assertionResults.length !== count
    || match.assertionResults.some(test => test.status !== 'passed')) {
    throw new Error(`Wrong suite or unexpected status: ${file}`);
  }
  return { file, passed: count };
});
execFileSync('git', ['diff', '--quiet', sha, '--', 'src', 'public', 'jest.config.ts', 'jest.setup.ts'], { cwd: root });
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const directory = path.join(here, '77-resultados');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalogo.json'), 'utf8'));
const discrepancies = new Set(['dish_main_19', 'dish_entrada_21', 'dish_entrada_22']);
const extras = new Set(['dish_entrada_6', 'dish_entrada_18', 'dish_child_1']);
if (catalog.sourceCommit !== sha || catalog.items.length !== 44) throw new Error('Wrong catalog target');
const visuallyMatched = catalog.items.filter(item => !discrepancies.has(item.id) && !extras.has(item.id));
if (visuallyMatched.length !== 38 || visuallyMatched.some(item => !item.resolved)) throw new Error('Wrong visual inventory');
fs.writeFileSync(path.join(directory, 'focalizadas.json.gz'), zlib.gzipSync(raw));
const artifacts = [
  '77-catalogo-local.mjs', '77-resultados/catalogo.json',
  ...catalog.sheets.map(sheet => `77-resultados/${sheet.file}`),
  '77-canva-entradas-1.png', '77-canva-entradas-2.png', '77-canva-entradas-3.png',
  '77-canva-principales-2.png', '77-canva-principales-3-infantil.png', '77-canva-guarniciones.png',
];
const manifest = {
  sourceCommit: sha,
  documentationBranch: 'codex/auditoria-75-20261007',
  observedOpenPullRequest: {
    number: 1262, branch: 'claude/numeros-de-contacto-reales', head: 'f6f91e9d24eeb6bb9dfd5d06430019e81835cc95',
    sameCatalogSourcesAndAssets: true,
    contactCorrectionPresent: true, correctionAcceptanceExecuted: false,
    otherUnpublishedProgrammingHead: 'unknown; owner says work is in progress',
  },
  unit: {
    file: 'focalizadas.json.gz', uncompressedSha256: digest(raw),
    started: new Date(results.startTime).toISOString(), finishedWrapperUtc: '2026-10-07T11:38:39.833Z',
    suitesPassed: 6, testsPassed: 39, failed: 0, pending: 0, suites,
    sourceOnlyAssertions: 6, pureOrMockedExecutionCases: 33,
    command: `node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --runTestsByPath ${expected.map(([file]) => file).join(' ')} --maxWorkers=1`,
    scope: 'Pure/synthetic provider, storage and session responses; no real API authorization, messages, publications, payments or microphone.',
    notResultsOfPR1262: true,
  },
  catalog: {
    source: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering',
    baseItems: 44, resolvedImages: 43,
    visualAssessmentByAuditor: {
      matchedIds: visuallyMatched.map(item => item.id),
      reusedSevenFromAudit75: visuallyMatched.filter(item => item.previousVisualCheck).map(item => item.id),
      newMatchedCount: 31, discrepancies: [...discrepancies], notFoundInCanva: [...extras],
      meaning: 'Human image/caption comparison, not an automated image classifier or a Firebase catalog audit.',
    },
    referenceOnlyNotInStaticBase: [
      'Arepas venezolanas', 'Show de tartas', 'Faina casero', 'Bunuelitos de algas',
      'Chivito con fritas', 'Paella de mariscos', 'Hamburguesa con fritas (principal adulto)',
    ],
    limits: 'Static Git base/helper and visible Canva only; no authenticated current master, menu selector, recipe, price or all-channel synchronization accepted.',
  },
  artifacts: artifacts.map(file => ({ file: `../${file}`, sha256: digest(fs.readFileSync(path.join(here, file))) })),
  financialOriginals: {
    originalDocumentsInspected: 0, firebaseRecordsReconciled: 0,
    existingAction: 'getFinancialIntegrityReport', consumer: 'src/app/(app)/auditoria/page.tsx',
    meaning: 'Three synthetic integrity tests passed; not a reconciliation or approval of 19 original budgets.',
  },
  limits: ['No private-role HTTP acceptance', 'No build by Codex', 'No live provider activation',
    'No production writes', 'No physical devices', 'No zero-error certification'],
};
fs.writeFileSync(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ sourceCommit: sha, suitesPassed: 6, testsPassed: 39,
  visuallyMatched: 38, discrepancies: 3, referenceExtras: 3, financialOriginalsInspected: 0 }));
