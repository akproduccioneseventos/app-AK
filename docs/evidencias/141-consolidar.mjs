import fs from 'node:fs';
import crypto from 'node:crypto';
import net from 'node:net';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync } from 'node:zlib';

const dir = new URL('./', import.meta.url);
const read = (file) => fs.existsSync(new URL(file, dir)) ? fs.readFileSync(new URL(file, dir))
  : gunzipSync(fs.readFileSync(new URL(file + '.gz', dir)));
const json = (file) => JSON.parse(read(file));
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const prefix = '141-sdk-client';
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
const receipt = json(`${prefix}-execution.json`);
const result = json(`${prefix}-results.json`);
assert.equal(receipt.source, source);
assert.equal(receipt.sourceDiff, '');
assert.equal(receipt.exitCode, 0);
assert.ok(receipt.finished);
assert.equal(receipt.realServices, false);
assert.equal(receipt.health.services.firebase, true);
for (const [service, enabled] of Object.entries(receipt.health.services)) {
  if (service !== 'firebase') assert.equal(enabled, false, service);
}
assert.equal(receipt.testSha256, hash(fs.readFileSync(new URL('../../tests/e2e/139-cliente-persistencia.spec.ts', dir))));
assert.equal(result.stats.expected, 2);
for (const key of ['skipped', 'unexpected', 'flaky']) assert.equal(result.stats[key], 0);
assert.deepEqual(result.errors || [], []);
const checkpoints = [];
function walk(suite) {
  for (const spec of suite.specs || []) for (const test of spec.tests || []) {
    assert.equal(test.results.length, 1);
    const run = test.results[0];
    assert.equal(run.status, 'passed');
    assert.deepEqual(run.errors, []);
    const attachments = new Map(run.attachments.map((a) => [a.name, a]));
    const decode = (name) => JSON.parse(Buffer.from(attachments.get(name).body, 'base64').toString('utf8'));
    const before = decode('store-antes.json');
    const after = decode('store-despues.json');
    const diagnostic = decode('diagnostico.json');
    assert.equal(before.length, 1);
    assert.deepEqual(after, before);
    assert.deepEqual(diagnostic.current, before);
    assert.equal(before[0].fields.phone.stringValue, diagnostic.phone);
    assert.equal(before[0].fields.email, undefined);
    assert.ok(before[0].name.startsWith('projects/demo-ak-producciones/databases/(default)/documents/clientes/'));
    assert.equal(diagnostic.url, 'http://127.0.0.1:3300/customers');
    const screenshot = `${prefix}-${test.projectName}.jpeg`;
    fs.writeFileSync(new URL(screenshot, dir), Buffer.from(attachments.get('cliente-recarga.jpeg').body, 'base64'));
    checkpoints.push({ project: test.projectName, status: run.status, durationMs: run.duration,
      screenshot, before, after, diagnostic });
  }
  for (const child of suite.suites || []) walk(child);
}
for (const suite of result.suites) walk(suite);
assert.deepEqual(checkpoints.map((c) => c.project).sort(), ['chromium-desktop', 'chromium-mobile']);
for (const port of [3300, 8085]) await new Promise((resolve, reject) => {
  const socket = net.connect({ host: '127.0.0.1', port });
  socket.setTimeout(1000);
  socket.on('connect', () => { socket.destroy(); reject(new Error(`Own service still listening: ${port}`)); });
  socket.on('error', resolve);
  socket.on('timeout', () => { socket.destroy(); reject(new Error(`Cleanup uncertain: ${port}`)); });
});
const bytes = read(`${prefix}-results.json`);
fs.writeFileSync(new URL(`${prefix}-results.json.gz`, dir), gzipSync(bytes));
const output = { source, receipt, stats: result.stats, checkpoints,
  rawResults: { file: `${prefix}-results.json.gz`, sha256Uncompressed: hash(bytes) },
  cleanup: { portsListening: [], trackedSourceDiff: '', restoredTopLevelJsonCount: receipt.snapshots },
  acceptance: 'PASS_CLIENT_CREATE_RELOAD_SDK_DEMO_PC_MOBILE_ONLY',
  limits: ['No production Firestore or real credentials', 'No edit/delete/concurrency acceptance',
    'No external integrations, originals19, physical equipment or complete area acceptance',
    'Recent fictitious backup fixture; backup execution not tested',
    'Browser Installations protocol double; does not test Google OAuth',
    'JSON snapshots cover top-level data and src/data only; no recursive restoration claimed'] };
fs.writeFileSync(new URL('141-consolidado.json', dir), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ acceptance: output.acceptance, cases: checkpoints.map(({ project, status, durationMs }) => ({ project, status, durationMs })) }));
