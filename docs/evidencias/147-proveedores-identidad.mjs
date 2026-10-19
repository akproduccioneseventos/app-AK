import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = require('typescript');
const file = 'src/lib/fiesta/reponer-la-plata.ts';
const runs = [];
for (const source of ['b8491bda3f25aadc71f36f42d5878a47261bb1bf', 'c7f9e3e6f960add2f970676819ec87b65b1af7c8']) {
  const read = (name) => {
    const result = spawnSync('git', ['show', `${source}:${name}`], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr); return result.stdout;
  };
  const text = read(file);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports }, { timeout: 3000 });
  const cases = [];
  for (const [name, stored, incoming, expected] of [
    ['different IDs and names', [{ proveedorId: 'a', proveedor: 'A', montoPagado: 60.30 }, { proveedorId: 'b', proveedor: 'B', montoPagado: 200 }], { proveedorId: 'b', proveedor: 'B' }, 200],
    ['different IDs same display name', [{ proveedorId: 'a', proveedor: 'Proveedor QA', montoPagado: 60.30 }, { proveedorId: 'b', proveedor: 'Proveedor QA', montoPagado: 200 }], { proveedorId: 'b', proveedor: 'Proveedor QA' }, 200],
    ['new ID same display name', [{ proveedorId: 'a', proveedor: 'Proveedor QA', montoPagado: 60.30 }], { proveedorId: 'new', proveedor: 'Proveedor QA' }, undefined],
    ['legacy rows without IDs', [{ proveedor: 'A', montoPagado: 60.30 }, { proveedor: 'B', montoPagado: 200 }], { proveedor: 'B' }, 200],
  ]) {
    const saved = { id: 'qa147', estadosCompra: stored };
    const next = { id: 'qa147', estadosCompra: [incoming] };
    const original = JSON.stringify({ saved, next });
    const output = exports.reponerLaPlata(next, saved, { puedeContabilidad: false, puedeSueldos: true, puedeGanancias: true });
    assert.equal(JSON.stringify({ saved, next }), original);
    const actual = output.estadosCompra[0].montoPagado;
    cases.push({ name, stored, incoming, expected: expected ?? null, actual: actual ?? null, pass: Object.is(actual, expected) });
  }
  const consumer = read('src/app/actions/fiesta/fiesta.actions.ts');
  assert.ok(consumer.includes('reponerLaPlata(datos, actual, authInfo)'));
  runs.push({ source, file, sha256: crypto.createHash('sha256').update(text).digest('hex'), cases,
    pass: cases.filter((row) => row.pass).length, fail: cases.filter((row) => !row.pass).length,
    consumer: 'saveFiesta -> actualizarFiesta -> reponerLaPlata(datos, actual, authInfo)' });
}
const output = { scope: 'Real pure helper, fictitious payloads and source-traced consumer; NO persisted payment or full authenticated action executed',
  runs, defectCount: 1, appEdited: false, realData: false, fixed: false,
  limits: ['Two branches and four failing variants do not mean four new defects',
    'No permission escalation, real charge or production corruption demonstrated', 'Private Claude HEAD NOT CONTRASTADO'] };
fs.writeFileSync(new URL('147-proveedores-identidad.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(runs.map(({ source, pass, fail }) => ({ source, pass, fail }))));
if (runs.some((run) => run.fail)) process.exitCode = 1;
