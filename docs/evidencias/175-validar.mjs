import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url)), dir = path.join(root, 'docs/evidencias');
const base = 'f776ae29eded99ad4a11fac099fece2657c7514a';
const original = '9b7ee982c5d6ff1377fccc0490abc85a9cfd8419';
const gemini = 'bfde3916a43afdb700cc0828722268db7b3ea2c1';
const claude = 'daefbdc00b7a43f4f252dcca6e7d9565d4d30d10';
const target = path.join(dir, '175-validacion.json'); assert.equal(fs.existsSync(target), false, 'Preserve receipt');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const git = args => { const p = spawnSync('git', args, { cwd: root, maxBuffer: 8 * 1024 ** 2 }); assert.equal(p.status, 0, p.stderr?.toString()); return p.stdout; };
const json = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const receipts = [
  ['171-entrega-1344.json', gemini, 22, 11, 11],
  ['174-consumidores-1344.json', gemini, 5, 2, 3],
  ['172-retest-foco-claude.json', claude, 18, 18, 0],
  ['173-retest-proveedor-sdk.json', claude, 10, 10, 0],
];
for (const [file, source, total, pass, fail] of receipts) {
  const r = json(file); assert.equal(r.source, source); assert.deepEqual(r.summary, { total, pass, fail });
  assert.equal(r.appEdited, false);
  for (const [key, expected] of Object.entries(r.hashes)) {
    const revisionPath = key.startsWith(source + ':') || key.startsWith('108e17b4387237fc921ea12e8d1eb65b20f62ac9:') ? key : `${source}:${key}`;
    const canonical = git(['show', revisionPath]).toString('utf8');
    assert.equal(hash(canonical), expected, `Exact Git source ${file}/${key}`);
  }
}
const sdk = json('173-ejecucion.json'); assert.equal(sdk.source, claude); assert.equal(sdk.exitCode, 0); assert.equal(sdk.cleanupStatus, 200); assert.equal(sdk.sourceDiff, '');
assert.equal(json('173-retest-proveedor-sdk.json').remainingDemoDocuments, 0);
assert.equal(git(['diff', '--name-only', original, '--', 'src', 'scripts', 'package.json', 'package-lock.json']).toString().trim(), '');
assert.equal(git(['diff', '--check', base]).toString().trim(), '');
assert.ok(fs.readFileSync(path.join(root, 'ESTADO-ACTUAL.md'), 'utf8').trimEnd().split(/\r?\n/).length <= 40);
for (const name of ['173-emulator.log', '173-sdk.log']) fs.writeFileSync(path.join(dir, name + '.gz'), gzipSync(fs.readFileSync(path.join(dir, name))));
const files = [...new Set([
  ...git(['diff', '--name-only', base]).toString().trim().split('\n'),
  ...git(['ls-files', '--others', '--exclude-standard']).toString().trim().split('\n'),
])].filter(file => file && (file === 'ESTADO-ACTUAL.md' || file === 'docs/YA-RESUELTO.md' || /^docs\/evidencias\/17[1-5]-/.test(file) || /^docs\/ordenes\/205-/.test(file))
  && !file.endsWith('.log') && !file.endsWith('175-manifest.json'));
for (const file of files) {
  if (/\.(?:mjs|md|json)$/.test(file)) {
    const value = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(/[ \t]+\r?$/m.test(value), false, `Whitespace ${file}`);
    assert.equal(/ghp_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{30,}|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(value), false, `Secret-shaped value ${file}`);
  }
}
const result = { checkedAt: new Date().toISOString(), base, applicationBase: original, gemini, claude,
  delivery: { total: 27, pass: 13, fail: 14 }, claudeRetest: { total: 28, pass: 28, fail: 0 },
  sdkCleanup: 200, remainingDemoDocuments: 0, appDiff: '', manualWorkBelongsToOwner: true,
  sameCommitSourcesVerified: true, allAppCertified: false,
  scope: 'Packaging/source/receipt gate, no repetition of app probes or broad build, no app implementation' };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n'); files.push('docs/evidencias/175-validacion.json');
const members = [...new Set(files)].sort().map(file => ({ path: file, bytes: fs.statSync(path.join(root, file)).size, sha256: hash(fs.readFileSync(path.join(root, file))) }));
fs.writeFileSync(path.join(dir, '175-manifest.json'), JSON.stringify({ base, gemini, claude, members }, null, 2) + '\n');
console.log(JSON.stringify({ ...result, members: members.length }));
