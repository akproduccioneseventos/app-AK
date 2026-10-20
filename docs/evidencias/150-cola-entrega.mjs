import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '45a0b1d4783ad58846c2e2d07ad8f318287024bf';
const file = 'src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx';
const output = new URL('150-cola-entrega.json', import.meta.url);
if (fs.existsSync(output)) throw new Error('Preserve prior receipt');
const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
assert.equal(r.status, 0, r.stderr);
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const ast = ts.createSourceFile(file, r.stdout, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const found = [];
function visit(n) {
  if (ts.isVariableDeclaration(n) && n.name.getText(ast) === 'sincronizarCola') {
    assert.ok(ts.isCallExpression(n.initializer)); found.push(n.initializer.arguments[0].getText(ast));
  }
  ts.forEachChild(n, visit);
}
visit(ast); assert.equal(found.length, 1);
const compiled = ts.transpileModule(`exports.run = (${found[0]});`, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const item = id => ({ guestId: id, token: null, escaneadoEn: '2026-10-20T10:00:00.000Z' });
const cases = [];
for (const mode of ['sequential', 'enqueue-during-await', 'lost-response']) {
  let value = JSON.stringify([item('A')]);
  let release, reject;
  const wait = new Promise((yes, no) => { release = yes; reject = no; });
  const requests = [];
  const exports = {};
  vm.runInNewContext(compiled, { exports, fiestaId: 'qa150', colaKey: 'ak_checkin_pendientes_qa150', window: {},
    localStorage: { getItem: () => value, setItem: (_key, next) => { value = next; } },
    setPendientesSubida() {},
    checkInGuestFiestaActual: (...args) => { requests.push(args); return wait; },
  }, { timeout: 2000 });
  const syncing = exports.run();
  if (mode === 'enqueue-during-await') value = JSON.stringify([item('A'), item('B')]);
  if (mode === 'lost-response') reject(new Error('QA lost response after commit'));
  else release({ success: true });
  await syncing;
  const observed = JSON.parse(value).map(i => i.guestId);
  const expected = mode === 'sequential' ? [] : mode === 'lost-response' ? ['A'] : ['B'];
  cases.push({ mode, expected, observed, requests, pass: JSON.stringify(expected) === JSON.stringify(observed) });
}
const record = { source, file, sha256: crypto.createHash('sha256').update(r.stdout).digest('hex'), cases,
  summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual new1337 callback AST-extracted, controlled localStorage and response promises',
  limits: ['No browser/camera/server SDK, no duplicated server guest claim', 'This revalidates changed source, not identical149 callback'], appEdited: false, realData: false };
fs.writeFileSync(output, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: record.summary }));
if (record.summary.fail) process.exitCode = 1;
