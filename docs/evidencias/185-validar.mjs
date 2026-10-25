import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidence = path.join(root, 'docs/evidencias');
const claude = '16e197cc3591bf0812c1e8910c880d83f04eb94b';
const gemini = 'd95c35ba27c6ff5a3c1a8adac28e29c3ff02ae09';
const passed = [];
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
function git(...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 ** 2 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
const read = name => JSON.parse(fs.readFileSync(path.join(evidence, name), 'utf8'));
const count = receipt => ({ total: receipt.cases.length, pass: receipt.cases.filter(item => item.pass).length, fail: receipt.cases.filter(item => !item.pass).length });
function check(name, work) { work(); passed.push(name); }
const receipts = Object.fromEntries([
  '178-claude-delta-contratos.json', '179-portal-personal-resultados.json', '180-retest-entrega-1346.json',
  '181-http-denegaciones-resultados.json', '182-retest-consumidores-1346.json', '183-proveedor-consumidor-dom.json',
].map(name => [name, read(name)]));
check('source-hashes-in-executed-receipts', () => {
  for (const receipt of Object.values(receipts)) {
    for (const [key, expected] of Object.entries(receipt.hashes || {})) {
      const qualified = /^[a-f0-9]{40}:/.test(key) ? key : `${receipt.source}:${key}`;
      assert.equal(sha256(git('show', qualified)), expected, qualified);
    }
  }
});
check('178-claude-runtime-delta-unchanged-through-public16e', () => {
  const receipt = receipts['178-claude-delta-contratos.json'];
  assert.deepEqual(count(receipt), { total: 86, pass: 85, fail: 1 });
  for (const [file, expected] of Object.entries(receipt.hashes)) assert.equal(sha256(git('show', `${claude}:${file}`)), expected, file);
  assert.equal(receipt.cases.filter(item => !item.pass)[0].id, 'sync-floor-waiters-not-kitchen-role');
});
check('179-181-corrected-only-the-eight-negative-http-criteria', () => {
  const initial = receipts['179-portal-personal-resultados.json'], corrected = receipts['181-http-denegaciones-resultados.json'];
  assert.deepEqual(count(initial), { total: 23, pass: 15, fail: 8 });
  assert.deepEqual(count(corrected), { total: 9, pass: 9, fail: 0 });
  for (const item of initial.cases.filter(item => !item.pass)) assert.equal(corrected.cases.find(candidate => candidate.id === item.id)?.pass, true, item.id);
  for (const receipt of [initial, corrected]) {
    assert.equal(receipt.sourceDiff, ''); assert.equal(receipt.realServices, false);
    assert.equal(Object.keys(receipt.equivalence).length, 10);
    for (const [file, blob] of Object.entries(receipt.equivalence)) {
      assert.equal(git('rev-parse', `${receipt.source}:${file}`).trim(), blob);
      assert.equal(git('rev-parse', `${claude}:${file}`).trim(), blob);
    }
  }
});
check('180-182-old-scope27pass-new-distributed-scope2fail', () => {
  const route = receipts['180-retest-entrega-1346.json'], consumer = receipts['182-retest-consumidores-1346.json'];
  assert.equal(route.source, gemini); assert.equal(consumer.source, gemini);
  assert.deepEqual(count(route), { total: 24, pass: 22, fail: 2 });
  assert.deepEqual(count(consumer), { total: 5, pass: 5, fail: 0 });
  assert.deepEqual(route.cases.filter(item => !item.pass).map(item => item.id).sort(),
    ['meta-two-module-instances-preserve-both-mids', 'voice-same-attempt-across-two-module-instances']);
});
check('183-provider-rendered-consumer11pass1fail', () => {
  const receipt = receipts['183-proveedor-consumidor-dom.json'];
  assert.equal(receipt.source, claude); assert.deepEqual(count(receipt), { total: 12, pass: 11, fail: 1 });
  assert.equal(receipt.cases.filter(item => !item.pass)[0].name, 'transport-read-failure-leaves-loading');
  assert.equal(receipt.cases.at(-1).observed.spinner, true);
});
check('184-advisory-reports-complete-no-install-or-lock-mutation', () => {
  const receipt = read('184-dependencias-entrega-1346.json');
  assert.equal(receipt.source, gemini); assert.equal(receipt.dependenciesInstalled, false); assert.equal(receipt.scriptsExecuted, false);
  assert.equal(receipt.temporaryWorkspaceRemoved, true);
  for (const [file, expected] of Object.entries(receipt.hashes)) assert.equal(sha256(git('show', `${gemini}:${file}`)), expected);
  for (const run of receipt.runs) {
    const raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(evidence, `184-npm-audit-${run.scope}.json.gz`))));
    assert.deepEqual(raw.metadata.vulnerabilities, run.counts); assert.equal(run.error, undefined);
    assert.equal(run.counts.critical, 1);
  }
});
const dependencyTrace = (() => {
  const lock = JSON.parse(git('show', `${gemini}:package-lock.json`));
  const baseline = JSON.parse(git('show', '42a25a319fe06a9fec40e75e5b23c01addef8ce2:package-lock.json'));
  const paths = ['node_modules/mind-ar', 'node_modules/mind-ar/node_modules/canvas', 'node_modules/@mapbox/node-pre-gyp', 'node_modules/@mapbox/node-pre-gyp/node_modules/tar', 'node_modules/tar'];
  assert.equal(lock.packages[paths[3]].version, '6.2.1');
  assert.equal(baseline.packages[paths[3]], undefined);
  return { source: gemini, baseline: '42a25a319fe06a9fec40e75e5b23c01addef8ce2', packages: paths.map(file => ({ path: file, ...lock.packages[file] })),
    advisory: 'https://github.com/advisories/GHSA-23hp-3jrh-7fpw', exploitabilityCertified: false };
})();
check('orders-resolve-current-files-symbols-consumers-and-probes', () => {
  for (const order of ['163-claude-dependencias-residuales-sin-force.md', '205-devolucion-1344-con-resultados.md', '209-consumidores-personal-proveedor.md']) {
    const content = fs.readFileSync(path.join(root, 'docs/ordenes', order), 'utf8');
    assert.match(content, /```comprobar[\s\S]*```\s*$/);
    for (const file of [...content.matchAll(/^archivo: (.+)$/gm)].map(match => match[1].trim())) git('cat-file', '-e', `${order.startsWith('209') ? claude : gemini}:${file}`);
    for (const [, symbol, file] of content.matchAll(/^usa: (.+?) en (.+)$/gm)) {
      assert.ok(git('show', `${order.startsWith('209') ? claude : gemini}:${file.trim()}`).includes(symbol.trim()), `${order}: ${symbol}`);
    }
    for (const [, file] of content.matchAll(/^prueba: (.+)$/gm)) assert.ok(fs.existsSync(path.join(root, file.trim())), file);
  }
});
check('state-under40lines-and-only-docs-changed', () => {
  const state = fs.readFileSync(path.join(root, 'ESTADO-ACTUAL.md'), 'utf8').trimEnd().split(/\r?\n/);
  assert.ok(state.length <= 40, state.length);
  for (const file of git('diff', '--name-only', '1cb47af0631c0d14a0812f398a24e2c12fae037b').trim().split(/\r?\n/).filter(Boolean)) {
    assert.ok(file === 'ESTADO-ACTUAL.md' || file.startsWith('docs/'), file);
  }
});
const files = [
  ...fs.readdirSync(evidence).filter(name => /^(17[6-9]|18[0-4])-/.test(name) && !name.endsWith('.log')).map(name => `docs/evidencias/${name}`),
  'docs/evidencias/185-cierre-y-recuento.md', 'docs/evidencias/185-validar.mjs',
  'docs/ordenes/163-claude-dependencias-residuales-sin-force.md', 'docs/ordenes/205-devolucion-1344-con-resultados.md',
  'docs/ordenes/209-consumidores-personal-proveedor.md', 'ESTADO-ACTUAL.md', 'docs/YA-RESUELTO.md',
].sort();
for (const file of files.filter(file => file.endsWith('.json'))) JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
for (const file of files.filter(file => file.endsWith('.mjs'))) {
  const syntax = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
}
const manifest = { auditParent: '1cb47af0631c0d14a0812f398a24e2c12fae037b', sources: { main: '9b7ee982c5d6ff1377fccc0490abc85a9cfd8419', claude, gemini },
  fileHashScope: 'SHA256 of observed worktree bytes; gitBlobs record Git clean-normalized content for remote comparison',
  files: Object.fromEntries(files.map(file => [file, sha256(fs.readFileSync(path.join(root, file)))])), dependencyTrace,
  gitBlobs: Object.fromEntries(files.map(file => [file, git('hash-object', '--path', file, file).trim()])),
  behaviorFindings: [
    { id: 'PERSONAL-ROL-ATENCION', evidence: '178', order: '209', owner: 'Claude', status: 'FAIL-composed-action' },
    { id: 'PROVEEDOR-LECTURA-RECHAZADA', evidence: '183', order: '209', owner: 'Gemini', status: 'FAIL-real-DOM-controlled-action' },
    { id: 'VOZ-DOS-INSTANCIAS', evidence: '180', order: '205', owner: 'Claude', status: 'FAIL-two-modules-controlled-store' },
    { id: 'META-DOS-INSTANCIAS', evidence: '180', order: '205', owner: 'Gemini-review-Claude', status: 'FAIL-two-modules-controlled-store' },
  ], dependencyFinding: { id: 'DEPENDENCIA-TAR-AR', evidence: '184', order: '163', exploitationDemonstrated: false },
  allControlsAccepted: false, allAreasAccepted: false, manualOwnerWorkInCodexPending: false, productionChanged: false };
fs.writeFileSync(path.join(evidence, '185-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const validation = { gate: 'PASS_RECEIPTS_SOURCE_AND_DOCUMENTS_ONLY_NOT_APP_ACCEPTANCE', checkedAt: new Date().toISOString(),
  passed, files: files.length, syntaxAndJsonChecked: true, appTestsRerun: false, appBuilt: false, dependencyTraceChecked: true,
  currentBehaviorFailures: manifest.behaviorFindings.length, dependencyChainsRequiringReview: 1, allAppCertified: false };
fs.writeFileSync(path.join(evidence, '185-validacion.json'), JSON.stringify(validation, null, 2) + '\n');
console.log(JSON.stringify(validation));
