import fs from 'node:fs';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
const dir = 'docs/evidencias/';
const read = file => JSON.parse(fs.existsSync(dir + file) ? fs.readFileSync(dir + file) : gunzipSync(fs.readFileSync(dir + file + '.gz')));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const build = read('115-build-execution.json'), source = build.applicationSourceSha;
const auxiliary = file => /^(docs\/|graphify-out\/|ESTADO-ACTUAL\.md$)/.test(file);
const changed = execFileSync('git', ['diff', '--name-only', source], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
assert(changed.every(auxiliary), 'Source or tests changed after frozen build');
assert(!execFileSync('git', ['ls-files', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' }).trim(), 'Untracked source is not part of validated SHA');
const checks = {};
for (const name of ['build', 'types', 'lint', 'acentos', 'jest']) {
  const record = read(`115-${name}-execution.json`);
  assert(record.applicationSourceSha === source && record.status === 'finished' && record.exitCode === 0, `Invalid final ${name}`);
  if (['build', 'jest'].includes(name)) assert(record.cleanup?.bytesRestored === true, `Fixtures not restored after ${name}`);
  checks[name] = { pass: true, started: record.started, finished: record.finished };
}
const jest = read('115-jest.json');
assert(jest.success && jest.numFailedTests === 0 && jest.numFailedTestSuites === 0 && jest.numPendingTests === 0 && jest.numPendingTestSuites === 0 && jest.numPassedTests >= 4229, 'Jest incomplete or failed');
checks.jest.suites = jest.numPassedTestSuites; checks.jest.tests = jest.numPassedTests;
const native = read('115-native-resultado.json'), probe = read('115-probe-execution.json');
assert(probe.applicationSourceSha === source && probe.status === 'finished' && probe.exitCode === 0 && native.applicationSourceSha === source, 'Invalid native probe/source');
assert(native.results.length === 34 && native.results.every(row => row.status === 'PASS'), 'Native criteria missing or failed');
for (const viewport of ['desktop', 'mobile']) {
  const rows = native.results.filter(row => row.viewport === viewport);
  assert(rows.length === 15, 'Missing viewport coverage: ' + viewport);
  for (const key of ['costs-export-restore', 'legacy-pending-receipt', 'last-supplier', 'last-custom-invitation', 'next-image-optimizer']) assert(rows.some(row => row.name.startsWith(key)), 'Missing flow: ' + viewport + ' ' + key);
}
assert(native.cleanup.bytesRestored && native.cleanup.documentsRemaining === 0, 'Native fixtures/documents not restored');
assert(read('115-limpieza-sdk.json').total === 0, 'Fictitious database not empty after stopping app');
const stopped = read('115-entorno-detenido.json');
assert(stopped.listeners.length === 0 && stopped.stopped.length === 2 && stopped.stopped.every(row => row.intentionalTermination), 'Owned QA services still active');
assert(read('115-health.json').body.version.startsWith(source), 'Wrong runtime version');
const graph = fs.readFileSync('graphify-out/GRAPH_REPORT.md', 'utf8');
assert(graph.includes('Built from commit: `' + source.slice(0, 8) + '`'), 'Graph source mismatch');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert(hash('src/data/marketing-checklist.json') === 'f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5', 'Pre-existing candidate file changed');
const publishable = file => /^115-/.test(file) && /\.(json|gz|png|mjs|ps1)$/.test(file) && file !== '115-aceptacion.json' && !(/^115-.*jest.*\.json$/.test(file) && !/-execution\.json$/.test(file));
const evidenceHashes = Object.fromEntries(fs.readdirSync(dir).filter(publishable).map(file => {
  const bytes = /\.(json|mjs|ps1)$/.test(file) ? Buffer.from(fs.readFileSync(dir + file, 'utf8').replace(/\r\n/g, '\n')) : fs.readFileSync(dir + file);
  return [file, crypto.createHash('sha256').update(bytes).digest('hex')];
}));
fs.writeFileSync(dir + '115-aceptacion.json', JSON.stringify({ applicationSourceSha: source, evidenceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), status: 'PASS_CURRENT_LOT_ONLY', checks, acceptedCriteria: 34, runtime: '127.0.0.1:3301; demo-ak-producciones Firestore', graphSource: source.slice(0, 8), evidenceHashes, hashTextNormalization: 'LF json/mjs; binary unchanged', notCertified: ['Entire application', 'Public Hosting/Linux deployment', 'External OAuth and credentials', 'Original19 manual budgets', 'Physical entertainment equipment', 'Atomic global snapshot across all collections', 'Remaining24 dependency advisories', 'Order152 floating bar/save3D and other155 Storage/export variants'] }, null, 2) + '\n');
console.log(JSON.stringify({ source, suites: jest.numPassedTestSuites, tests: jest.numPassedTests, acceptedCriteria: 34, status: 'PASS_CURRENT_LOT_ONLY' }));
