import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../', import.meta.url));
const receipt = new URL('149-proveedor-consumidores.json', import.meta.url);
if (fs.existsSync(receipt)) throw new Error('Preserve previous evidence; do not rerun');
if (os.freemem() < 256 * 1024 ** 2) throw new Error('Less than256MiB free; no QA process');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const source = '03cd87d59dcdd35ac26108d3d7fe979b6a4bf83b';
const candidate = 'b8491bda3f25aadc71f36f42d5878a47261bb1bf';
const actionFile = 'src/app/actions/fiesta/fiesta.actions.ts';
const cateringFile = 'src/app/actions/fiesta/catering.actions.ts';
const helperFile = 'src/lib/fiesta/reponer-la-plata.ts';
const env = Object.fromEntries(['PATH', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
const git = args => {
  const r = spawnSync('git', args, { cwd: root, env, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout;
};
const texts = Object.fromEntries([actionFile, cateringFile, helperFile].map(f => [f, git(['show', `${source}:${f}`])]));
assert.equal(git(['diff', candidate, source, '--', actionFile, cateringFile]), '');
const hashes = Object.fromEntries(Object.entries(texts).map(([f, t]) => [f, crypto.createHash('sha256').update(t).digest('hex')]));
function extract(file, names) {
  const tree = ts.createSourceFile(file, texts[file], ts.ScriptTarget.Latest, true);
  const found = new Set();
  const chunks = [];
  for (const s of tree.statements) {
    if (ts.isFunctionDeclaration(s) && s.name && names.includes(s.name.text)) {
      found.add(s.name.text); chunks.push(s.getText(tree));
    } else if (ts.isVariableStatement(s)) {
      const selected = s.declarationList.declarations.filter(d => ts.isIdentifier(d.name) && names.includes(d.name.text));
      if (selected.length) {
        assert.equal(selected.length, s.declarationList.declarations.length, 'No unrelated declarations');
        for (const d of selected) found.add(d.name.text);
        chunks.push(s.getText(tree));
      }
    }
  }
  assert.deepEqual([...found].sort(), [...names].sort(), 'All requested real symbols extracted');
  return chunks.join('\n');
}
const helper = {};
vm.runInNewContext(ts.transpileModule(texts[helperFile], { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports: helper }, { timeout: 2000 });
const predicate = {};
vm.runInNewContext(ts.transpileModule(extract(actionFile, ['mismoValor', 'pideCambiarLaPlata']) + '\nexports.pideCambiarLaPlata = pideCambiarLaPlata;',
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports: predicate, CAMPOS_DE_PLATA_Y_CONTRATO: helper.CAMPOS_DE_PLATA_Y_CONTRATO, PAGO_DE_LA_COMPRA: helper.PAGO_DE_LA_COMPRA }, { timeout: 2000 });
const clone = x => JSON.parse(JSON.stringify(x));
const results = [];
const base = (sameName = true) => ({ id: 'qa149', configuracion: { nombreEvento: 'QA ficticio' }, tareas: [], estadosCompra: [
  { proveedorId: 'a', proveedor: sameName ? 'Proveedor QA' : 'A', pedido: false, pagado: true, montoPagado: 60.30 },
  { proveedorId: 'b', proveedor: sameName ? 'Proveedor QA' : 'B', pedido: false, pagado: true, montoPagado: 200 },
] });
for (const sameName of [false, true]) {
  const stored = base(sameName);
  const partial = { estadosCompra: clone(stored.estadosCompra) };
  const actual = predicate.pideCambiarLaPlata(partial, stored);
  results.push({ name: `unchanged payments, ${sameName ? 'same names' : 'different names'}`, scope: 'Real partial-save predicate only',
    expectedReject: false, actualReject: actual, pass: actual === false });
}
const selected = extract(cateringFile, ['CAMPOS_DE_PAGO', 'mismoProveedor', 'igual', 'cambiosPedidos', 'updateShoppingListStatus']);
for (const sameName of [false, true]) {
  let stored = base(sameName);
  const before = clone(stored);
  const next = clone(stored.estadosCompra);
  next[1].pedido = true;
  let calls = 0;
  const permissions = [];
  const exports = {};
  vm.runInNewContext(ts.transpileModule(selected, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    requireAppSession: async () => ({ user: { userId: 'qa149', perfil: 'contable' } }),
    requireEventPermission: async (id, p) => { assert.equal(id, 'qa149'); permissions.push([...p]); },
    PERMISOS: { INSUMOS: 'insumos', CONTABILIDAD: 'contabilidad', ORGANIZACION: 'organizacion' },
    getFiestaById: async id => { assert.equal(id, 'qa149'); return clone(stored); },
    actualizarFiesta: async (id, fn) => { assert.equal(id, 'qa149'); calls++; stored = clone(await fn(clone(stored))); return { success: true, updatedFiesta: clone(stored) }; },
    console: { error() {} },
  }, { timeout: 2000 });
  const outcome = await exports.updateShoppingListStatus('qa149', next, clone(before.estadosCompra));
  const expected = { ...before, estadosCompra: next };
  const equalRows = JSON.stringify(stored.estadosCompra) === JSON.stringify(expected.estadosCompra);
  results.push({ name: `actual catering action changing only pedido, ${sameName ? 'same names' : 'different names'}`,
    scope: 'Actual action body; auth/read/transaction storage are explicit in-memory doubles',
    before: before.estadosCompra, input: next, expected: expected.estadosCompra, observed: stored.estadosCompra,
    outcome, transactionCalls: calls, requestedPermissions: permissions,
    pass: outcome.success === true && calls === 1 && equalRows });
}
const record = {
  source, candidate, sameConsumerSources: true, hashes, results,
  summary: { pass: results.filter(x => x.pass).length, fail: results.filter(x => !x.pass).length },
  scope: 'Real AST-extracted partial-save predicate and catering action, controlled dependencies only',
  appEdited: false, realData: false, network: false, fullAuthenticatedAction: false, sdkPersistence: false,
  limits: ['No browser, SDK, real session, payment, deployment or whole-PR acceptance',
    'Helper185 previously passed; these are distinct actual consumer variants, not a rerun of148',
    'Private Claude HEAD NO CONTRASTADO', 'PR1333 closed without merge; main unchanged7230'],
};
fs.writeFileSync(receipt, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: record.summary, cases: results.map(x => ({ name: x.name, pass: x.pass })) }));
if (record.summary.fail) process.exitCode = 1;
