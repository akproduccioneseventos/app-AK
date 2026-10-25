import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const record = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias/135-entorno.json')));
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
const base = 'http://127.0.0.1:3300';
assert.equal(record.sourceSha, source);
assert.equal(record.buildExit, 0);
assert.equal(spawnSync('git', ['rev-parse', 'HEAD'], { cwd: record.qa, encoding: 'utf8' }).stdout.trim(), source);
assert.match(record.qa.replaceAll('\\', '/'), /\/Temp\/ak-qa-135-[^/]+$/);
const health = await (await fetch(`${base}/api/health`)).json();
assert.ok(health.version.startsWith(source));
assert.ok(Object.values(health.services).every((value) => value === false));

// Only synthetic files and the public demo secret of the existing isolated runner.
const filename = `e2e_136_${crypto.randomUUID()}.pdf`;
const bytes = Buffer.from('%PDF-1.4\n% Synthetic QA136 permission boundary, no customer data\n%%EOF\n');
const endpoints = [
  ['budgets', 'contabilidad'], ['contracts', 'contabilidad'], ['salon-contracts', 'contabilidad'],
  ['payment-proofs', 'contabilidad'], ['employee-contracts', 'sueldos'],
];
const profiles = ['dueno', 'secretaria', 'operador', 'personal', 'cliente', 'prospecto', 'invitado'];
const token = (perfil, expires = Date.now() + 60_000) => {
  const user = { email: `qa136.${perfil}@example.invalid`, userId: `qa136-${perfil}`, role: 'admin', perfil };
  const payload = `v1.${expires}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
  return `${payload}.${crypto.createHmac('sha256', 'playwright-session-secret-with-enough-entropy').update(payload).digest('hex')}`;
};
const files = [];
const cases = [];
try {
  for (const [endpoint] of endpoints) {
    const file = path.join(record.qa, 'src/data', endpoint, filename);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes, { flag: 'wx' });
    files.push(file);
  }
  for (const [endpoint, permission] of endpoints) {
    for (const perfil of [...profiles, 'anonymous', 'tampered', 'expired']) {
      let value = perfil === 'anonymous' ? null : token(profiles.includes(perfil) ? perfil : 'dueno',
        perfil === 'expired' ? Date.now() - 60_000 : Date.now() + 60_000);
      if (perfil === 'tampered') value = `${value.slice(0, -1)}${value.endsWith('0') ? '1' : '0'}`;
      const allowed = perfil === 'dueno' || (permission === 'contabilidad' && perfil === 'secretaria');
      const expected = allowed ? 200 : profiles.includes(perfil) ? 403 : 401;
      const response = await fetch(`${base}/api/${endpoint}/${filename}`, {
        // Match cookie serialization: Next decodes the HTTP cookie once on receipt.
        headers: value ? { cookie: `ak_session=${encodeURIComponent(value)}` } : {}, redirect: 'manual',
      });
      const body = Buffer.from(await response.arrayBuffer());
      const exactBytes = body.equals(bytes);
      const pass = response.status === expected && (allowed ? exactBytes : !body.includes(bytes));
      cases.push({ endpoint, permission, perfil, signedRole: 'admin', expected, actual: response.status,
        exactSyntheticBytes: exactBytes, pass });
    }
  }
} finally {
  for (const file of files) fs.unlinkSync(file);
}
const result = { source, buildFinishedAt: record.buildFinishedAt, health, finishedAt: new Date().toISOString(),
  fixtureSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  fixtureRemoved: files.every((file) => !fs.existsSync(file)), cases,
  passed: cases.filter((item) => item.pass).length, failed: cases.filter((item) => !item.pass).length,
  scope: 'Actual HTTP routes and signed demo sessions; not OAuth login, real records, UI role navigation or all permissions' };
fs.writeFileSync(path.join(root, 'docs/evidencias/136-permisos-http-results.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ passed: result.passed, failed: result.failed, fixtureRemoved: result.fixtureRemoved }));
assert.equal(result.failed, 0);
