import fs from 'node:fs';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const dir = 'docs/evidencias/';
const read = file => JSON.parse(fs.existsSync(dir + file) ? fs.readFileSync(dir + file) : gunzipSync(fs.readFileSync(dir + file + '.gz')));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const build = read('114-build-execution.json'), source = build.applicationSourceSha;
const auxiliary = file => /^(docs\/|tests\/|src\/__tests__\/|graphify-out\/|ESTADO-ACTUAL\.md$)/.test(file);
const changed = execFileSync('git', ['diff', '--name-only', source], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
assert(changed.every(auxiliary), 'Application source changed after build');
const checks = {};
for (const name of ['build', 'types', 'lint', 'acentos', 'jest']) {
  const record = read(`114-${name}-execution.json`);
  assert(record.applicationSourceSha === source && record.status === 'finished' && record.exitCode === 0, `Invalid final ${name}`);
  if (['build', 'jest'].includes(name)) assert(record.cleanup?.bytesRestored === true, `Fixtures not restored after ${name}`);
  checks[name] = { pass: true, started: record.started, finished: record.finished };
}
const jest = read('114-jest.json');
assert(jest.success && jest.numFailedTests === 0 && jest.numFailedTestSuites === 0 && jest.numPendingTests === 0, 'Jest incomplete or failed');
checks.jest.suites = jest.numPassedTestSuites; checks.jest.tests = jest.numPassedTests;
const probes = {};
for (const [name, resultFile, expected] of [
  ['mantenimiento', '114-mantenimiento-fallos-resultado.json', 6],
  ['costos', '114-costos-resultado.json', 14],
  ['incidentes', '114-incidentes-resultado.json', 2],
  ['titulos', '114-titulos.json', 4],
  ['documentos', '114-documentos-resultado.json', 64],
]) {
  const record = read(`114-${name}-execution.json`), result = read(resultFile);
  assert(record.applicationSourceSha === source && record.exitCode === 0 && result.applicationSourceSha === source, `Wrong source or failed probe: ${name}`);
  assert(result.results.length === expected && result.results.every(row => row.status === 'PASS'), `Missing acceptance: ${name}`);
  if (name === 'titulos') assert(result.results.every(row => row.samples.length === 2 && row.samples.every(s => s.clickTrial && s.backClicked && s.saveClicked && s.persistedAfterReload)), 'Titles accepted without real save/back');
  const cleanup = name === 'titulos' ? read('114-titulos-restauracion.json') : result.cleanup;
  assert(cleanup.bytesRestored === true, `Unrestored fixtures: ${name}`);
  probes[name] = { pass: true, criteria: expected, resultFile };
}
assert(read('114-limpieza-sdk.json').total === 0, 'Fictitious database not empty');
const stopped = read('114-entorno-detenido.json');
assert(stopped.listeners.length === 0 && stopped.stopped.length === 2 && stopped.stopped.every(r => r.intentionalTermination), 'QA services still active');
assert(read('114-health.json').body.version.startsWith(source), 'Runtime source not verified');
const graph = fs.readFileSync('graphify-out/GRAPH_REPORT.md', 'utf8');
assert(graph.includes('Built from commit: `' + source.slice(0, 8) + '`'), 'Graph not updated for application source');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert(hash('src/data/marketing-checklist.json') === 'f125e01bdf62a2c6251a4410abe37916082b820b30b105edbe9ee918e814f1e5', 'Pre-existing candidate file changed');
const publishable = f => /^114-/.test(f) && /\.(json|gz|png|mjs|ps1)$/.test(f) && f !== '114-aceptacion.json' && !(/^114-jest.*\.json$/.test(f) && !/-execution\.json$/.test(f));
const evidenceHashes = Object.fromEntries(fs.readdirSync(dir).filter(publishable).map(f => {
  const bytes = /\.(json|mjs|ps1)$/.test(f) ? Buffer.from(fs.readFileSync(dir + f, 'utf8').replace(/\r\n/g, '\n')) : fs.readFileSync(dir + f);
  return [f, crypto.createHash('sha256').update(bytes).digest('hex')];
}));
fs.writeFileSync(dir + '114-aceptacion.json', JSON.stringify({
  applicationSourceSha: source, evidenceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  status: 'PASS_CURRENT_LOT_ONLY', checks, probes, acceptedCriteria: Object.values(probes).reduce((n, r) => n + r.criteria, 0),
  runtime: '127.0.0.1:3301 with demo-ak-producciones Firestore emulator', graphSource: source.slice(0, 8), hashTextNormalization: 'LF for json/mjs/ps1; binary bytes unchanged', evidenceHashes,
  notCertified: ['Entire application', 'Public Hosting', 'External integrations and credentials', 'Physical equipment', 'Cost receipt backup/restore'],
}, null, 2));
console.log(JSON.stringify({ source, suites: jest.numPassedTestSuites, tests: jest.numPassedTests, acceptedCriteria: 90, status: 'PASS_CURRENT_LOT_ONLY' }));
