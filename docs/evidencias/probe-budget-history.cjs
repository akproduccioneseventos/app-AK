const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2]);
const ts = require(path.join(root, 'node_modules/typescript'));
const source = fs.readFileSync(path.join(root, 'src/app/actions/armado-rapido.ts'), 'utf8');
const ast = ts.createSourceFile('action.ts', source, ts.ScriptTarget.Latest, true);
const fn = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'getPublicBudgetsByPhone');
assert.ok(fn);
const rows = [
  { id: 'first', clienteContacto: '099111222', timestamp: '2026-09-01', totalConDescuento: 100000 },
  { id: 'second', clienteContacto: '099111222', timestamp: '2026-09-02', totalConDescuento: 120000 },
  { id: 'other', clienteContacto: '099333444', timestamp: '2026-09-03', totalConDescuento: 90000 },
];
const mod = { exports: {} };
const js = ts.transpileModule(fn.getText(ast), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
vm.runInNewContext(js, {
  exports: mod.exports, module: mod, console, process: { env: { AK_USE_LOCAL_JSON_ONLY: 'true' } },
  normalizeUruguayPhone: (phone) => phone,
  enforcePublicRateLimit: async () => {}, readData: async () => structuredClone(rows),
  require: (name) => {
    if (name === '@/lib/auth/session-token') return { generateBudgetToken: async (id) => 'fictional-' + id };
    throw new Error('Unexpected dependency: ' + name);
  },
});
(async () => {
  const result = await mod.exports.getPublicBudgetsByPhone('099111222');
  assert.equal(result.success, true);
  assert.equal(JSON.stringify(result.budgets.map((b) => b.id)), JSON.stringify(['second', 'first']));
  assert.equal(JSON.stringify(result.budgets.map((b) => b.totalConDescuento)), JSON.stringify([120000, 100000]));
  assert.equal((await mod.exports.getPublicBudgetsByPhone('invalid')).success, false);
  assert.equal((await mod.exports.getPublicBudgetsByPhone('099555666')).budgets.length, 0);
  console.log(JSON.stringify({ result: 'PASS', checks: ['two quotes for same phone retained in date order', 'other phone excluded', 'both totals preserved', 'invalid phone denied', 'unknown phone empty'], limits: 'Actual function extracted with TypeScript AST; fake storage, identity normalization, rate limit and tokens; no persistence, CRM, UI or Firestore tested' }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });

