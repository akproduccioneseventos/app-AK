import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'docs/evidencias');
const delivery = process.argv[2];
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = args => { const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const json = name => {
  const file = path.join(dir, name);
  return JSON.parse(fs.existsSync(file) ? fs.readFileSync(file) : gunzipSync(fs.readFileSync(file + '.gz')));
};
const mobile = json('151-mobile-results.json').stats;
const date = json('151-date-results.json').stats;
const agenda = json('151-agenda-results.json').stats;
const units = json('152-units-final-results.json');
const sdk = json('154-final-sdk-real.json');
const sdkRun = json('154-final-ejecucion.json');
const focused = json('154-focales.json');
const suppliers = json('153-consumidores-entrega.json');
const returns198 = json('154-retornos-198.json');
assert.equal(sdk.source, source); assert.equal(sdk.cases.length, 9); assert.equal(sdk.summary.fail, 0);
assert.equal(sdkRun.exitCode, 0); assert.equal(sdkRun.cleanupStatus, 200); assert.equal(sdkRun.sourceDiff, '');
assert.equal(sdk.remainingDemoDocuments, 0); assert.equal(focused.summary.fail, 0);
assert.equal(suppliers.summary.fail, 0);
assert.equal(returns198.source, source); assert.equal(returns198.summary.pass, 12);
assert.equal(returns198.summary.fail, 0);
const diff = git(['diff', '--name-only', '253838732287c2704d78113d15ace9c025cb82c9', source, '--', 'src', 'package.json', 'package-lock.json', 'scripts', 'next.config.mjs', 'next.config.ts', 'next.config.js']).split('\n').filter(Boolean);
const result = { source, observedAt: new Date().toISOString(),
  acceptedBuilds: [json('151-entorno.json'), json('152-entorno.json')],
  interruptedNotAccepted: json('153-entorno.json'),
  broadUnits: { source: '253838732287c2704d78113d15ace9c025cb82c9', suites: units.numTotalTestSuites, passedSuites: units.numPassedTestSuites,
    tests: units.numTotalTests, passed: units.numPassedTests, failed: units.numFailedTests, pending: units.numPendingTests,
    failedCause: 'ENOENT data/blog-posts.json (skip-worktree S); no failed content assertion',
    focalRevalidation: '154-focales.json canonical Git blob and all original content assertions PASS; no second complete green Jest run' },
  native: { source: '2e5363f259461a31bf6b31807872c227855415de', mobile, date, agenda, scope: '171,172,179,184 only; not all UI' },
  supplierActions: { source: suppliers.source, ...suppliers.summary, scope: suppliers.scope },
  actualSdkSave: { source, ...sdk.summary, transactions: sdk.transactionCount, remainingDemoDocuments: sdk.remainingDemoDocuments,
    scope: sdk.scope, limits: sdk.limits, gate: 'PASS_CURRENT_SAVE_SDK_FUNCTION_BOUNDARY_ONLY' },
  changedSourceVsBroad: diff,
  changedCancellationAndBlog: focused.summary,
  otherReturns198: { source, ...returns198.summary, scope: returns198.scope, limits: returns198.limits },
  stillOpen: ['172 social dock/header overlap 2610.1933596357703 px2 at390x844, reproduced151',
    '195 pending Gemini entertainment queue in1337 unchanged45a0; not an implementation supplied by Codex',
    'Exhaustive role/control/state acceptance not established by421-route inventory or these tests'],
  externalNotCertified: ['19 manual source documents owner is locating', 'Real OAuth/accounts/models/voice/provider synchronization and hardware', 'Every production route/action and data reconciliation'],
  overallAuditClosed: false, zeroErrorsCertified: false, appEdited: false, mergedByCodex: false };
fs.writeFileSync(path.join(dir, '154-consolidado.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ broad: result.broadUnits, native: result.native, sdk: result.actualSdkSave, delta: diff }));
if (delivery) {
  const target = path.resolve(delivery, 'docs/evidencias');
  assert.match(path.resolve(delivery).replaceAll('\\', '/'), /\/ak-auditoria154-entrega$/);
  assert.ok(fs.existsSync(path.join(delivery, '.git')));
  const tracked = new Set(git(['ls-files', '--', 'docs/evidencias']).split('\n').map(n => path.basename(n)));
  const manifest = [];
  const put = (name, bytes, original = name) => {
    const file = path.join(target, name);
    if (fs.existsSync(file)) assert.equal(hash(fs.readFileSync(file)), hash(bytes), `Do not overwrite unrelated file: ${name}`);
    else fs.writeFileSync(file, bytes);
    manifest.push({ file: name, original, sha256: hash(bytes), bytes: bytes.length });
  };
  const files = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isFile() && /^15[1-4]-/.test(e.name) && !tracked.has(e.name));
  for (const { name } of files) {
    if (!/\.(?:mjs|ts|json|gz|png)$/.test(name) && !name.endsWith('.log')) continue;
    const file = path.join(dir, name);
    if (name.endsWith('.log') || (name.endsWith('.json') && fs.statSync(file).size > 200000)) put(name + '.gz', gzipSync(fs.readFileSync(file)), name);
    else if (!name.endsWith('.gz') || !files.some(e => e.name === name.slice(0, -3))) put(name, fs.readFileSync(file));
  }
  const pictures = [
    ['151-mobile-artifacts/135-mobile-contrato-social-656cf-otón-PDF-dentro-del-celular-chromium-mobile/qa135-contrato-mobile-layout.png', '151-contrato-movil.png'],
    ['151-mobile-artifacts/135-mobile-contrato-social-8dba0--Evento-al-abrir-en-celular-chromium-mobile/test-failed-1.png', '151-social-solapamiento.png'],
  ];
  for (const [from, to] of pictures) put(to, fs.readFileSync(path.join(dir, from)), from);
  fs.writeFileSync(path.join(target, '154-entrega-manifest.json'), JSON.stringify({ source, files: manifest }, null, 2) + '\n');
  console.log(JSON.stringify({ deliveredFiles: manifest.length, deliveredBytes: manifest.reduce((n, f) => n + f.bytes, 0), delivery }));
}
