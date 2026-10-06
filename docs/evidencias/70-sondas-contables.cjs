const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
let perfil = 'personal';
let gastos = [];
let fiesta = { id: 'audit70', planDePagos: { id: 'p', cuotas: [{ id: 'c', monto: 1000, estado: 'pendiente' }] } };
const clone = structuredClone;
const mocks = {
  'server-only': {},
  '@/lib/auth/session-token': { verifySession: async () => ({ success: true, user: { perfil, userId: 'audit70' } }) },
  '@/lib/data-service': {
    readData: async () => clone(gastos),
    createDataItem: async (_f, _c, _id, item) => { gastos.push(clone(item)); return item; },
    writeData: async (_f, items) => { gastos = clone(items); },
    deleteDataItem: async (_f, _c, id) => { gastos = gastos.filter(g => g.id !== id); return true; },
  },
  './fiesta/fiesta.actions': {
    getFiestaById: async () => clone(fiesta),
    saveFiesta: async f => { fiesta = clone(f); return { success: true }; },
  },
  '@/lib/fiesta/actualizar-fiesta': {
    actualizarFiesta: async (_id, fn) => { fiesta = await fn(clone(fiesta)); return { success: true }; },
  },
  './google-workspace-extended': { notifyClientPaymentApproved: async () => {} },
};
const cache = {};
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache[filename]) return cache[filename];
  const exports = {}; cache[filename] = exports;
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, console, Date, structuredClone,
    process: { env: {}, cwd: () => root },
    require(name) {
      if (name in mocks) return mocks[name];
      if (relative === 'src/app/actions/presupuestos.ts') {
        const real = ['@/lib/auth/perfiles', '@/lib/auth/require-session', '@/lib/mutex', '@/lib/budget/financial-guardrails', '@/lib/budget/pago-duplicado'];
        if (!real.includes(name)) return {};
      }
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), name + '.ts')));
      return require(name);
    },
  }, { filename });
  return exports;
}
function result(id, evidence) { console.log(JSON.stringify({ id, ...evidence })); }
(async () => {
  const actions = load('src/app/actions/gastos.ts');
  const auth = load('src/lib/auth/require-session.ts');
  assert.equal((await auth.requirePermiso('contabilidad')).ok, false);
  const data = { concepto: 'Sonda', fecha: '2026-10-06', categoria: 'Otro', monto: 100 };
  const deniedProfile = await actions.saveGastoGeneral(data);
  assert.equal(deniedProfile.success, true);
  const read = await actions.getGastosGenerales();
  const removed = await actions.deleteGastoGeneral(read[0].id);
  assert.equal(removed.success, true);
  result('GAS01', { profile: perfil, accountingAllowed: false, saveAccepted: true, readCount: read.length, deleteAccepted: true });
  perfil = 'dueno'; gastos = [];
  const retry = { ...data, idempotencyKey: 'same-operation' };
  await Promise.all([actions.saveGastoGeneral(retry), actions.saveGastoGeneral(retry)]);
  assert.equal(gastos.length, 2);
  result('GAS02', { sameKey: true, productionBranch: true, storedRecords: gastos.length, total: gastos.reduce((s,g) => s+g.monto,0) });
  gastos = [];
  for (const monto of [NaN, Infinity]) {
    assert.equal((await actions.saveGastoGeneral({ ...data, monto })).success, true);
  }
  result('GAS03', { acceptedNonFinite: gastos.map(g => String(g.monto)), persistence: 'synthetic, actual Firestore not exercised' });
  const plans = load('src/app/actions/payment-plans.ts');
  const stale = clone(fiesta.planDePagos.cuotas);
  await plans.updateCuotaEstado('audit70', 'c', { estado: 'pagado' });
  assert.equal(fiesta.planDePagos.cuotas[0].estado, 'pagado');
  await plans.savePlanDePagos('audit70', { cuotas: stale, notas: 'Cambio de nota desde otra pantalla' });
  assert.equal(fiesta.planDePagos.cuotas[0].estado, 'pendiente');
  result('PLAN01', { paidBefore: 1000, paidAfterStaleSave: fiesta.planDePagos.cuotas[0].montoPagado ?? 0, persistence: 'synthetic action contract' });
  const financial = load('src/lib/budget/financial-guardrails.ts');
  const ledger = load('src/lib/commercial-flow/ledger-service.ts');
  const budget = { id: 'b', estado: 'Aceptado', timestamp: '2026-01-01', fechaFirmaContrato: '2026-01-01', eventoFecha: '2027-08-08', totalConDescuento: 100000, ajusteAnualActivo: true, ajusteAnualPorcentaje: 15, pagosCliente: [{ id: 'p', estadoPago: 'confirmado', monto: 100000, fecha: '2026-10-06' }] };
  const summary = financial.getBudgetPaymentSummary(budget, { includeAnnualAdjustment: true });
  const book = ledger.calculateFinancialLedger([budget], []);
  assert.equal(summary.balance, 15000); assert.equal(book.saldoPendiente, 0);
  result('LEDGER01', { summaryBalance: summary.balance, ledgerBalance: book.saldoPendiente, ledgerSales: book.ventasTotales, collectible: summary.total });
  let storedBudget = { ...budget, ajusteAnualActivo: false, pagosCliente: [], itemsPresupuestados: [] };
  mocks['@/lib/data-service'].mutateDataItem = async (_file, _collection, _id, mutate) => {
    const updated = mutate(clone(storedBudget));
    if (updated) storedBudget = updated;
    return updated;
  };
  mocks['./fiesta/fiesta.actions'].getAllFiestas = async () => [];
  mocks['@/lib/notifications/create-notification'] = { createNotification: async () => ({ success: true }) };
  perfil = 'personal';
  const budgets = load('src/app/actions/presupuestos.ts');
  const inserted = await budgets.addPagoToPresupuesto('b', { monto: 1000, fecha: '2026-10-06', metodoPago: 'Efectivo' });
  assert.equal(inserted.success, true);
  assert.equal(storedBudget.pagosCliente.length, 1);
  assert.equal(storedBudget.pagosCliente[0].estadoPago, 'confirmado');
  const deleted = await budgets.deletePagoFromPresupuesto('b', storedBudget.pagosCliente[0].id);
  assert.equal(deleted.success, true);
  assert.equal(storedBudget.pagosCliente.length, 0);
  result('COB10', { profile: perfil, accountingAllowed: false, productionBranch: true, insertedConfirmedPayment: true, deletedPayment: true, persistence: 'synthetic transaction, real action and real profile policy' });
})().catch(e => { console.error(e); process.exitCode = 1; });
