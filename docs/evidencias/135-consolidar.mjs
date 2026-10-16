import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = 'docs/evidencias';
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const sourceSha = '7230f9d02b32805952a185f704a0208bd5d643e6';
const qa = read('135-entorno.json');
assert.equal(qa.sourceSha, sourceSha); assert.equal(qa.buildExit, 0); assert(qa.serverStoppedAt);
assert.equal(execFileSync('git', ['-C', qa.qa, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceSha);
const pendingChanges = execFileSync('git', ['-C', qa.qa, 'diff', '--name-only'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const restorations = [];
for (const file of pendingChanges) {
  assert(['data/notifications.json','src/data/notifications.json'].includes(file), `Unexpected QA change: ${file}`);
  const baselineBytes = execFileSync('git', ['-C', qa.qa, 'show', `${sourceSha}:${file}`]);
  const baseline = JSON.parse(baselineBytes), current = JSON.parse(fs.readFileSync(path.join(qa.qa, file)));
  const extras = current.filter((row) => !baseline.some((old) => old.id === row.id));
  const removed = baseline.filter((row) => !current.some((next) => next.id === row.id));
  assert(extras.length > 0 && extras.every((row) => /e2e_(?:135_|qa135_)/.test(JSON.stringify(row))));
  assert.equal(removed.length, extras.length, 'Only capped synthetic notifications may displace baseline rows');
  for (const row of current.filter((item) => baseline.some((old) => old.id === item.id))) {
    assert.deepEqual(row, baseline.find((old) => old.id === row.id));
  }
  restorations.push({ file, syntheticAdded: extras.length, cappedRowsRestored: removed.length,
    baselineSha256: crypto.createHash('sha256').update(baselineBytes).digest('hex') });
  fs.writeFileSync(path.join(qa.qa, file), baselineBytes);
}
if (restorations.length) fs.writeFileSync(path.join(dir, '135-notificaciones-restauradas.json'), JSON.stringify(restorations, null, 2) + '\n');
const trackedChanges = execFileSync('git', ['-C', qa.qa, 'diff', '--name-only'], { encoding: 'utf8' }).trim();
assert.equal(trackedChanges, '', 'Tracked QA files were changed');
const remainingFixtures = ['data/fiestas', 'src/data/fiestas'].flatMap((folder) => {
  const target = path.join(qa.qa, folder);
  return fs.existsSync(target) ? fs.readdirSync(target).filter((file) => /^e2e_(?:135_|qa135_)/.test(file)).map((file) => `${folder}/${file}`) : [];
});
assert.deepEqual(remainingFixtures, []);
function cases(report) {
  const list = [];
  const visit = (suite) => {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      const last = test.results.at(-1);
      list.push({ title: spec.title, project: test.projectName, status: last.status, attachments: last.attachments });
    }
    for (const child of suite.suites || []) visit(child);
  };
  report.suites.forEach(visit); return list;
}
const native = {};
for (const group of ['core', 'agenda-final', 'kitchen', 'mobile', '3d']) {
  const report = read(`135-${group}-results.json`);
  const rows = cases(report); native[group] = rows;
  assert.equal(rows.length, report.stats.expected + report.stats.unexpected + report.stats.skipped);
}
for (const [file, artifact] of [['135-cocina-agenda-3d.spec.ts','135-3d-source.spec.ts.gz'],
  ['135-mobile-contrato-social.spec.ts','135-mobile-source.spec.ts.gz']]) {
  const actual = fs.readFileSync(path.join(qa.qa, 'tests/e2e', file));
  assert.deepEqual(actual, fs.readFileSync(path.join('tests/e2e', file)));
  fs.writeFileSync(path.join(dir, artifact), zlib.gzipSync(actual));
}
const sourceArtifacts = { core: '135-core-original-spec.ts.gz', 'agenda-final': '135-cocina-agenda-protocolo-spec.ts.gz',
  kitchen: '135-cocina-agenda-protocolo-spec.ts.gz', mobile: '135-mobile-source.spec.ts.gz', '3d': '135-3d-source.spec.ts.gz' };
for (const [group, artifact] of Object.entries(sourceArtifacts)) {
  const file = `135-${group}-execution.json`, receipt = read(file);
  receipt.testSourceArtifact = artifact;
  receipt.testSourceSha256 = crypto.createHash('sha256').update(zlib.gunzipSync(fs.readFileSync(path.join(dir, artifact)))).digest('hex');
  fs.writeFileSync(path.join(dir, file), JSON.stringify(receipt, null, 2) + '\n');
}
assert.equal(native.core.filter((item) => item.status === 'passed').length, 2);
assert(native['agenda-final'].every((item) => item.status === 'passed'));
assert(native.kitchen.every((item) => item.status === 'failed'));
assert(native.mobile.every((item) => item.status === 'failed'));
assert(native['3d'].every((item) => item.status === 'passed'));
for (const row of native['3d']) for (const attachment of row.attachments) {
  if (!attachment.body || !['image/png','application/json'].includes(attachment.contentType)) continue;
  const ext = attachment.contentType === 'image/png' ? 'png' : 'json';
  fs.writeFileSync(path.join(dir, `135-3d-${row.project}.${ext}`), Buffer.from(attachment.body, 'base64'));
}
for (const row of native.kitchen) for (const attachment of row.attachments) {
  if (attachment.name === 'cabecera-impresion.json' && attachment.body) {
    fs.writeFileSync(path.join(dir, `135-kitchen-${row.project}.json`), Buffer.from(attachment.body, 'base64'));
  }
  if (attachment.name === 'hoja-cocina.pdf' && attachment.body) {
    fs.writeFileSync(path.join(dir, `135-kitchen-${row.project}.pdf`), Buffer.from(attachment.body, 'base64'));
  }
  if (attachment.name === 'screenshot' && attachment.path) {
    const from = path.resolve(attachment.path);
    assert(from.startsWith(path.resolve(dir) + path.sep));
    fs.copyFileSync(from, path.join(dir, `135-kitchen-${row.project}.png`));
  }
}
for (const row of native.mobile) for (const attachment of row.attachments.filter((item) => item.name === 'screenshot' && item.path)) {
  const from = path.resolve(attachment.path);
  assert(from.startsWith(path.resolve(dir) + path.sep));
  fs.copyFileSync(from, path.join(dir, row.title.startsWith('171') ? '135-mobile-contrato.png' : '135-mobile-social.png'));
}
const unit = read('135-unit-results.json'), crm = read('135-unit-crm-results.json');
assert.equal(unit.numPassedTests, 41); assert.equal(unit.numFailedTests, 1);
assert.equal(crm.numPassedTests, 1); assert.equal(crm.numFailedTests, 0);
const archived = [];
for (const name of fs.readdirSync(dir).filter((file) => /^135-/.test(file) && /(?:results\.json|\.log)$/.test(file))) {
  const raw = fs.readFileSync(path.join(dir, name));
  fs.writeFileSync(path.join(dir, `${name}.gz`), zlib.gzipSync(raw));
  archived.push({ file: `${name}.gz`, originalBytes: raw.length, originalSha256: crypto.createHash('sha256').update(raw).digest('hex') });
}
const finalCases = [...native.core.filter((row) => row.title.startsWith('DJ:')), ...native['agenda-final'], ...native.kitchen, ...native.mobile, ...native['3d']];
assert.equal(finalCases.length, 10);
const result = { gate: 'AUDIT_135_COMPLETE_THREE_SCOPED_BLOCKS_WITH_OPEN_FINDINGS', sourceSha,
  buildExit: qa.buildExit, finalNativeCases: finalCases.map(({ attachments, ...row }) => row),
  nativePassed: finalCases.filter((row) => row.status === 'passed').length,
  nativeFailed: finalCases.filter((row) => row.status === 'failed').length,
  uniqueNamedUnitChecksAcceptedAcrossDocumentedModes: 42,
  unitInitial: { passed: 41, failedDueLocalVsMockBranch: 1 }, unitFocal: { passed: 1, deselected: 7 },
  newWorkItems: ['178-cabecera-impresa-cocina'], existingOpenItems: ['171-contrato-movil','172-dock-social'],
  previousTask4: 'docs/evidencias/134-conciliacion.md', remainingFixtures, trackedQaChanges: [],
  notificationCleanup: fs.existsSync(path.join(dir, '135-notificaciones-restauradas.json')) ? read('135-notificaciones-restauradas.json') : [],
  serverStoppedAt: qa.serverStoppedAt, applicationEdited: false, merged: false, allAppCertified: false,
  limits: ['current synthetic source only', 'Firebase installations protocol double, not real Firebase',
    'Google disconnected response only, no Google account cleanup', 'software WebGL, no physical devices',
    'new private/unbuilt coder branches not accepted by these tests'], archived };
fs.writeFileSync(path.join(dir, '135-aceptacion.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ gate: result.gate, sourceSha, nativePassed: result.nativePassed, nativeFailed: result.nativeFailed, archived: archived.length }));
