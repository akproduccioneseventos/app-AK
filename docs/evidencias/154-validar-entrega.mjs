import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'docs/evidencias');
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const names = fs.readdirSync(dir).filter(n => /^15[1-4]-/.test(n) && fs.statSync(path.join(dir, n)).isFile());
let scripts = 0, json = 0;
for (const name of names) {
  const file = path.join(dir, name);
  if (name.endsWith('.mjs')) {
    const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(checked.status, 0, `${name}: ${checked.stderr}`); scripts++;
  }
  if (/\.json(?:\.gz)?$/.test(name)) {
    const bytes = fs.readFileSync(file);
    JSON.parse(name.endsWith('.gz') ? gunzipSync(bytes).toString('utf8') : bytes.toString('utf8')); json++;
  }
}
const snapshots = JSON.parse(fs.readFileSync(path.join(dir, '154-sources-verificados.json'), 'utf8'));
assert.ok(snapshots);
const expected = {
  '151-mobile-source.spec.ts': '0461b9583ef3990a430c1bf60b2e20e03d21e721ac3dfd88dc25d88b80f1eef2',
  '151-date-source.spec.ts': 'a1c595fe3f7bc011af0f0b8c34bed2b1ca4aacceab19e74a765ef7be3926d5e2',
  '151-agenda-source.spec.ts': '2e4d15093170c4ef93dbf89cb4acbd73c68534375853d5233ea1c39584fbefd2',
};
for (const [name, sha] of Object.entries(expected)) assert.equal(hash(fs.readFileSync(path.join(dir, name))), sha);
assert.ok(fs.readFileSync(path.join(root, 'ESTADO-ACTUAL.md'), 'utf8').trimEnd().split(/\r?\n/).length <= 40);
const delta = spawnSync('git', ['diff', '--name-only', source, '--', 'src', 'package.json', 'package-lock.json', 'scripts'], { cwd: root, encoding: 'utf8' });
assert.equal(delta.status, 0, delta.stderr); assert.equal(delta.stdout.trim(), '', 'No app edits allowed');
const whitespace = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
assert.equal(whitespace.status, 0, whitespace.stdout + whitespace.stderr);
const result = { source, checkedAt: new Date().toISOString(), scriptsSyntaxPass: scripts, jsonParsed: json,
  frozenTestSourcesPass: 3, stateAtMost40Lines: true, appDiff: '', whitespacePass: true,
  scope: 'Delivery syntax, JSON, hashes and no app edits; not another functional audit' };
fs.writeFileSync(path.join(dir, '154-validacion-entrega.json'), JSON.stringify(result, null, 2) + '\n');
const files = fs.readdirSync(dir).filter(n => /^15[1-4]-/.test(n) && n !== '154-entrega-manifest.json' && fs.statSync(path.join(dir, n)).isFile())
  .sort().map(name => { const bytes = fs.readFileSync(path.join(dir, name)); return { file: name, sha256: hash(bytes), bytes: bytes.length }; });
fs.writeFileSync(path.join(dir, '154-entrega-manifest.json'), JSON.stringify({ source, scope: 'All delivered151-154 files except this manifest', files }, null, 2) + '\n');
console.log(JSON.stringify({ ...result, manifestFiles: files.length }));
