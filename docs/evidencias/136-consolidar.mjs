import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const dir = 'docs/evidencias';
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name)));
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const record = read('135-entorno.json');
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
assert.equal(record.sourceSha, source);
const notification = 'src/data/notifications.json';
const originalNotifications = execFileSync('git', ['show', `${source}:${notification}`], { cwd: record.qa });
const currentNotifications = fs.readFileSync(path.join(record.qa, notification));
assert.equal(currentNotifications.toString().replaceAll('\r\n','\n'), originalNotifications.toString().replaceAll('\r\n','\n'),
  'Only an EOL-only QA notification rewrite is allowed');
fs.writeFileSync(path.join(record.qa, notification), originalNotifications);
const cases = (report) => {
  const rows = [];
  function visit(suite) {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      const result = test.results.at(-1);
      rows.push({ title: spec.title, project: test.projectName, status: result.status,
        error: result.error?.message, attachments: result.attachments });
    }
    for (const child of suite.suites || []) visit(child);
  }
  for (const suite of report.suites) visit(suite);
  return rows;
};
const matrix = read('136-permisos-http-results.json');
assert.equal(matrix.source, source); assert.equal(matrix.passed, 50); assert.equal(matrix.failed, 0); assert(matrix.fixtureRemoved);
const prospecto = read('136-prospecto-results.json');
assert.equal(prospecto.numPassedTests, 11); assert.equal(prospecto.numFailedTests, 0);
assert.equal(prospecto.numPendingTests, 11); // Anonymous cases deliberately deselected, not new passes.
const groups = ['masters', 'masters-sdk', 'masters-sdk-empleado', 'masters-sdk-comercial', 'masters-sdk-comercial-final',
  'masters-sdk-comercial-evidencia','masters-sdk-comercial-defecto','masters-sdk-comercial-movil'];
const native = {};
for (const group of groups) {
  const report = read(`136-${group}-results.json`);
  native[group] = cases(report);
  for (const [index, row] of native[group].entries()) {
    for (const attachment of row.attachments || []) {
      if (attachment.contentType === 'image/png' && attachment.body) {
        const output = `136-${group}-${row.project}-${index}.png`;
        fs.writeFileSync(path.join(dir, output), Buffer.from(attachment.body, 'base64'));
        attachment.savedAs = output; delete attachment.body;
      }
    }
  }
}
const accepted = [...native['masters-sdk'].filter((row) => row.status === 'passed'), ...native['masters-sdk-empleado']];
assert(accepted.every((row) => row.status === 'passed'));
assert.equal(new Set(accepted.map((row) => `${row.project}:${row.title}`)).size, 8);
const defects = [...native['masters-sdk-comercial-defecto'].filter((row) => row.project === 'chromium-desktop'),
  ...native['masters-sdk-comercial-movil']];
assert.equal(defects.length, 2);
assert(defects.every((row) => row.status === 'failed' && row.error.includes('WhatsApp requires international digits')));
const v1 = fs.readFileSync(path.join(dir, '136-maestros-v1.spec.ts'), 'utf8');
const employeeSource = v1.replace('  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();',
  '  // Employee cells include the avatar initial before the unique synthetic name.\n  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();');
fs.writeFileSync(path.join(dir, '136-maestros-empleado-source.spec.ts.gz'), zlib.gzipSync(employeeSource));
const sources = { masters: '136-maestros-v1.spec.ts', 'masters-sdk': '136-maestros-v1.spec.ts',
  'masters-sdk-empleado': null, 'masters-sdk-comercial': '136-maestros-v2.spec.ts',
  'masters-sdk-comercial-final': '136-maestros-v3.spec.ts', 'masters-sdk-comercial-evidencia': '136-maestros-v4.spec.ts',
  'masters-sdk-comercial-defecto': '136-maestros-v5.spec.ts',
  'masters-sdk-comercial-movil': '../../tests/e2e/136-maestros.spec.ts' };
const sourceMap = Object.fromEntries(Object.entries(sources).map(([group, file]) => {
  const bytes = file ? fs.readFileSync(path.join(dir, file)) : Buffer.from(employeeSource);
  const output = `136-${group}-source.spec.ts.gz`;
  fs.writeFileSync(path.join(dir, output), zlib.gzipSync(bytes));
  return [group, { archive: output, sha256: hash(bytes), provenance: group === 'masters-sdk-empleado'
    ? 'Reconstructed exact one-line selector/comment delta from v1; original execution predates per-run hash receipt' : 'Archived executed test version' }];
}));
const finalReceipt = read('136-masters-sdk-comercial-defecto-execution.json');
assert.equal(finalReceipt.testSha256, sourceMap['masters-sdk-comercial-defecto'].sha256);
assert.equal(read('136-masters-sdk-comercial-movil-execution.json').testSha256, sourceMap['masters-sdk-comercial-movil'].sha256);
const prospectoSource = fs.readFileSync(path.join(record.qa, 'src/__tests__/136-prospecto-permisos.test.ts'));
fs.writeFileSync(path.join(dir, '136-prospecto-source.test.ts.gz'), zlib.gzipSync(prospectoSource));
const archives = [];
for (const file of fs.readdirSync(dir).filter((name) => /^136-/.test(name) && /(?:results\.json|\.log|v[1-5]\.spec\.ts)$/.test(name))) {
  const bytes = fs.readFileSync(path.join(dir, file));
  fs.writeFileSync(path.join(dir, `${file}.gz`), zlib.gzipSync(bytes));
  archives.push({ file: `${file}.gz`, bytes: bytes.length, sha256: hash(bytes) });
}
for (const mode of ['emulator','serve']) assert.equal(read(`136-sdk-${mode}-execution.json`).status, 'stopped');
assert.equal(execFileSync('git', ['rev-parse','HEAD'], { cwd: record.qa, encoding: 'utf8' }).trim(), source);
assert.equal(execFileSync('git', ['diff','--name-only'], { cwd: record.qa, encoding: 'utf8' }).trim(), '');
const fixtureFiles = ['servicios-empresa.json','proveedores.json','empleados.json','activos-fijos.json','crm-leads.json'];
for (const folder of ['data','src/data']) for (const file of fixtureFiles) {
  const full = path.join(record.qa, folder, file);
  if (fs.existsSync(full)) assert(!/QA136_|Auditoria Qa136/.test(fs.readFileSync(full, 'utf8')), `Left synthetic rows in ${full}`);
}
const summary = { source, buildFinishedAt: record.buildFinishedAt, finished: new Date().toISOString(),
  permissions: { passed: matrix.passed, failed: matrix.failed, scope: matrix.scope },
  prospecto: { passed: 11, failed: 0, deselected: 11, provider: 'mocked data/auth' },
  native, acceptedDistinctNative: 8, failingDistinctNative: 2, distinctBehaviorDefects: 1,
  visualDefects: [{ route: '/empresa/servicios', evidence: '136-masters-sdk-chromium-mobile-4.png',
    observed: 'Dark Ajuste de Costos Global title on dark panel; screenshot reviewed, no WCAG ratio measured' }],
  archives, sourceMap,
  cleanup: { sourceTrackedDiff: 0, servicesStopped: true, notificationEolRestored: true, masterFixturesRemaining: 0 },
  scope: 'Only the named permission/file boundaries and create/reload master/CRM/agenda workflows; not every app role/control or real integration',
  originals: 'Owner is locating the 19 original documents; no comparison claimed',
};
fs.writeFileSync(path.join(dir, '136-aceptacion.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ http: 50, action: 11, nativeDistinctPass: 8, nativeFail: 2, behaviorDefects: 1, visualDefects: 1, archives: archives.length }));
