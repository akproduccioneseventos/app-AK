import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = new URL('150-salidas-perfil.json', import.meta.url);
if (fs.existsSync(target)) throw new Error('Preserve prior receipt');
const previous = JSON.parse(fs.readFileSync(new URL('150-consumidores-entrega.json', import.meta.url)));
const source = previous.source;
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {};
const read = file => {
  const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex');
  return r.stdout;
};
const evaluate = (text, dependencies = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: name => { if (name in dependencies) return dependencies[name]; throw new Error(`Unexpected dependency ${name}`); } }, { timeout: 2000 });
  return exports;
};
const profiles = evaluate(read('src/lib/auth/perfiles.ts'));
const privacy = evaluate(read('src/lib/fiesta/recortar-para-afuera.ts'), { '@/lib/auth/perfiles': profiles });
const operator = { perfil: 'operador' };
assert.equal(profiles.puede(operator, profiles.PERMISOS.CONTABILIDAD), false);
assert.equal(profiles.puede(operator, profiles.PERMISOS.GANANCIAS), false);
const cases = [];
for (const row of previous.results.filter(r => r.kind === 'saveFiesta')) {
  assert.equal(row.response.success, true);
  const observed = row.response.fiesta;
  const expected = privacy.recortarFiestaPorPerfil(observed, operator);
  const exposed = [];
  if ('gestionCostos' in observed && !('gestionCostos' in expected)) exposed.push('gestionCostos');
  for (let i = 0; i < (observed.estadosCompra || []).length; i++) {
    for (const key of ['montoPagado', 'pagado']) if (key in observed.estadosCompra[i] && !(key in expected.estadosCompra[i])) exposed.push(`estadosCompra[${i}].${key}`);
  }
  cases.push({ sameName: row.sameName, exposed, pass: exposed.length === 0,
    observedCost: observed.gestionCostos, expectedHasCost: 'gestionCostos' in expected });
}
const control = privacy.recortarFiestaPorPerfil(previous.results[0].response.fiesta, operator);
const controlPass = !('gestionCostos' in control) && control.estadosCompra.every(e => !('montoPagado' in e) && !('pagado' in e));
assert.equal(controlPass, true);
const record = { source, hashes, inputReceipt: '150-consumidores-entrega.json', cases,
  control: { name: 'Actual recortarFiestaPorPerfil removes protected fields', pass: controlPass },
  scope: 'Output from previously executed actual saveFiesta body; actual permission model and actual response filter',
  limits: ['Assignment/session/transaction were controlled doubles in prior receipt',
    'No real signed HTTP call, real account, real leak or SDK persistence demonstrated',
    'Only save response is in scope; do not infer every action leaks'], appEdited: false, realData: false };
fs.writeFileSync(target, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, controlsPass: controlPass, violations: cases.filter(c => !c.pass).length, scope: record.scope }));
if (cases.some(c => !c.pass)) process.exitCode = 1;
