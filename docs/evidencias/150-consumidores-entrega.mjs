import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '45a0b1d4783ad58846c2e2d07ad8f318287024bf';
const target = new URL('150-consumidores-entrega.json', import.meta.url);
if (fs.existsSync(target)) throw new Error('Preserve prior receipt');
if (os.freemem() < 256 * 1024 ** 2) throw new Error('Insufficient resources for light QA');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {};
const read = file => {
  const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex');
  return r.stdout;
};
const evaluate = (text, context = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, ...context }, { timeout: 2000 });
  return exports;
};
const extract = (file, names) => {
  const tree = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = new Set();
  const statements = [];
  for (const s of tree.statements) {
    const matching = ts.isFunctionDeclaration(s) && s.name && names.includes(s.name.text)
      ? [s.name.text] : ts.isVariableStatement(s)
        ? s.declarationList.declarations.filter(d => ts.isIdentifier(d.name) && names.includes(d.name.text)).map(d => d.name.text) : [];
    if (matching.length) { matching.forEach(n => found.add(n)); statements.push(s.getText(tree)); }
  }
  assert.deepEqual([...found].sort(), [...names].sort());
  return statements.join('\n');
};
const helper = evaluate(read('src/lib/fiesta/reponer-la-plata.ts'));
const profiles = evaluate(read('src/lib/auth/perfiles.ts'));
const actions = extract('src/app/actions/fiesta/fiesta.actions.ts', [
  'getSesionYPermisos', 'mismoValor', 'sinLaPlata', 'pideCambiarLaPlata',
  'validatePersonalAssignments', 'saveFiesta', 'updateFiestaPartial',
]);
const catering = extract('src/app/actions/fiesta/catering.actions.ts', [
  'CAMPOS_DE_PAGO', 'mismoProveedor', 'igual', 'cambiosPedidos', 'updateShoppingListStatus',
]);
const clone = value => JSON.parse(JSON.stringify(value));
const fixture = sameName => ({ id: 'qa150', configuracion: { nombreEvento: 'QA ficticio' }, tareas: [], personalAsignado: [],
  gestionCostos: { total: 9500 }, estadosCompra: [
    { proveedorId: 'a', proveedor: sameName ? 'Proveedor QA' : 'A', pedido: false, pagado: true, montoPagado: 60.30 },
    { proveedorId: 'b', proveedor: sameName ? 'Proveedor QA' : 'B', pedido: false, pagado: true, montoPagado: 200 },
  ] });
const results = [];
for (const sameName of [false, true]) {
  for (const kind of ['saveFiesta', 'updateFiestaPartial', 'updateShoppingListStatus']) {
    let stored = fixture(sameName);
    const before = clone(stored);
    const input = clone(stored.estadosCompra); input[1].pedido = true;
    let transactions = 0;
    const permissionsRequested = [];
    const operator = { userId: 'qa150-op', email: 'operador@qa.invalid', perfil: 'operador' };
    const actualPermissions = {
      contabilidad: profiles.puede(operator, profiles.PERMISOS.CONTABILIDAD),
      sueldos: profiles.puede(operator, profiles.PERMISOS.SUELDOS),
      ganancias: profiles.puede(operator, profiles.PERMISOS.GANANCIAS),
    };
    const modules = {
      '@/lib/auth/session-token': { verifySession: async () => ({ success: true, user: operator }) },
      '@/lib/fiesta/get-fiesta-raw': { getFiestaByIdRaw: async () => clone(stored) },
      '@/lib/fiesta/actualizar-fiesta': { actualizarFiesta: async (id, fn) => {
        assert.equal(id, 'qa150'); transactions++; stored = clone(await fn(clone(stored)));
        return { success: true, updatedFiesta: clone(stored) };
      } },
    };
    const env = {
      ...helper, PERMISOS: profiles.PERMISOS, puede: profiles.puede,
      require: name => { if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`); return modules[name]; },
      FIESTAS_DIR: 'fiestas', CAMPOS_DEL_EQUIPO: [],
      requireAppSession: async () => ({ user: operator }),
      requireFiestaWriteAccess: async id => { assert.equal(id, 'qa150'); },
      esEquipoParaFiesta: async () => true,
      preserveFiestaSecrets: async (_id, value) => value,
      writeData: async (file, value) => { assert.equal(file, 'fiestas/qa150.json'); stored = clone(value); },
      LECTURA_COMPLETA: Symbol('QA lectura completa'),
      getFiestaById: async () => clone(stored),
      requireEventPermission: async (_id, values) => { permissionsRequested.push([...values]); },
      actualizarFiesta: modules['@/lib/fiesta/actualizar-fiesta'].actualizarFiesta,
      console: { error() {} },
    };
    let response;
    if (kind === 'updateShoppingListStatus') {
      response = await evaluate(catering, env).updateShoppingListStatus('qa150', input, clone(before.estadosCompra));
    } else {
      const app = evaluate(actions, env);
      response = kind === 'saveFiesta'
        ? await app.saveFiesta({ ...clone(before), estadosCompra: input })
        : await app.updateFiestaPartial('qa150', { estadosCompra: input });
    }
    const passed = response.success === true && JSON.stringify(stored.estadosCompra) === JSON.stringify(input);
    results.push({ kind, sameName, pass: passed, before: before.estadosCompra, input,
      expected: input, observed: stored.estadosCompra, response, transactions, actualPermissions, permissionsRequested });
  }
}
const record = { source, pr: 1337, hashes, results,
  summary: { pass: results.filter(r => r.pass).length, fail: results.filter(r => !r.pass).length },
  scope: 'Actual action bodies and permission model; session, assignment gate, read and transaction are controlled doubles',
  limits: ['Not real signed authentication, SDK persistence, browser or production',
    'Catering requireEventPermission is allowed deliberately: tests identity, not that permission boundary',
    'Same inputs and same names are legitimate; no deduplication by business name'], appEdited: false, realData: false };
fs.writeFileSync(target, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: record.summary, cases: results.map(({ kind, sameName, pass }) => ({ kind, sameName, pass })) }));
if (record.summary.fail) process.exitCode = 1;
