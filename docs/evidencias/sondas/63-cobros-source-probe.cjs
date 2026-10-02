// Isolated source probes. No Firebase, credentials or production writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');
const { stripTypeScriptTypes } = require('node:module');
const sourceCommit = '676a1a8d3fe3c04be453e7cfec829217e42380cd';
const expectedBlobs = {
  'src/app/actions/invoices.ts': 'b861243d9c7620e1e5b7ee9e4a9a5a124f4d3bbf',
  'src/lib/invoice-money.ts': 'c967d8901b793c6512e058078d3dd358cc9a5051',
  'src/lib/budget/financial-guardrails.ts': 'c484a0bcd85c088eb4632957d2ea0d3f56686434',
  'src/app/actions/payment-plans.ts': 'e208583ca4d315760a90c378366515f3b3c8996c',
  'src/app/actions/recibos-personal.ts': '7ccd833bf7d0cf52dee0661afc2c2f72d016176a',
  'src/app/(app)/invoices/[id]/page.tsx': '44d8d308bfaf4d18c070676b61a949e57001e1cb',
  'src/lib/planPagos.ts': '7700831b9079ca6a87066fba5977a3b95b9a6aeb',
};
const fixturePath = path.join(__dirname, 'cobros-676a1a8-source.json');
const root = process.argv[2] || path.resolve(__dirname, '../../..');
const snapshot = !process.argv[2] && fs.existsSync(fixturePath)
  ? JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
  : { commit: sourceCommit, files: Object.fromEntries(Object.keys(expectedBlobs).map((file) => [file, { content: fs.readFileSync(path.join(root, file), 'utf8') }])) };
for (const [file, sha] of Object.entries(expectedBlobs)) {
  const content = snapshot.files[file].content.replace(/\r\n/g, '\n');
  const bytes = Buffer.from(content, 'utf8');
  const actual = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(actual, sha, `Source changed: ${file}. Re-contrast the audit rather than reuse stale line ranges.`);
  snapshot.files[file].content = content;
}
const clone = (x) => structuredClone(x);
const results = [];

function range(file, start, end) {
  return snapshot.files[file].content.split('\n').slice(start - 1, end).join('\n');
}

function evaluate(source, names, globals = {}) {
  const context = vm.createContext({ console: { error() {}, warn() {} }, Date, Math, Number, Map, Set, process: { env: {} }, ...globals });
  const js = stripTypeScriptTypes(source.replace(/^export /gm, ''), { mode: 'strip' });
  vm.runInContext(js + '\nglobalThis.result = {' + names.join(',') + '};', context, { timeout: 2000 });
  return context.result;
}

const guards = 'src/lib/budget/financial-guardrails.ts';
const money = evaluate(range(guards, 42, 46) + '\n' + range(guards, 78, 80) + '\n' + range(guards, 122, 134) + '\n' + range(guards, 436, 463), ['roundMoney', 'isConfirmedClientPayment', 'sumConfirmedClientPayments', 'sumPendingClientPayments', 'parseCleanMoney']);
const invoiceMoney = evaluate(snapshot.files['src/lib/invoice-money.ts'].content, ['roundInvoiceMoney', 'invoiceMoneyTolerance']);
const invoicesPath = 'src/app/actions/invoices.ts';
const invoiceSource = [range(invoicesPath, 49, 55), range(invoicesPath, 601, 734)].join('\n');

function form(amount) {
  return { get: (key) => ({ amount: String(amount), paymentDate: '2026-10-02', method: 'Efectivo' })[key] ?? null };
}

function invoiceHarness(overrides = {}) {
  let stored = { id: 'isolated-invoice', currency: 'UYU', totalAmount: 1000, status: 'Draft', payments: [], sourcePresupuestoId: 'isolated-budget' };
  const globals = {
    ...money, ...invoiceMoney,
    PERMISOS: { CONTABILIDAD: 'contabilidad' },
    requirePermiso: async () => ({ ok: true }),
    verifySession: async () => ({ success: true }),
    mapDepositMethodToInvoiceMethod: (x) => x,
    mapDepositMethodToBudgetMethod: (x) => x,
    leerFacturasSinGuardia: async () => [clone(stored)],
    INVOICES_FILE: 'invoices.json',
    mutateDataItem: async (_file, _collection, _id, update) => {
      const next = update(clone(stored));
      if (!next) return null;
      stored = clone(next);
      return clone(stored);
    },
    addPagoToPresupuesto: async () => ({ success: true }),
    marcarCobroPasadoAlPresupuesto: async () => {},
    referenciaDelCobro: (i, p) => `AK_SYNC:${i}:${p}`,
    logger: { error() {}, warn() {} },
    ...overrides,
  };
  return { actions: evaluate(invoiceSource, ['addPaymentToInvoiceInner'], globals), read: () => clone(stored), set: (x) => { stored = clone(x); } };
}

async function run() {
  const payments = [
    { id: 'confirmed', monto: 700, estadoPago: 'confirmado' },
    { id: 'pending', monto: 200, estadoPago: 'pendiente_confirmacion' },
    { id: 'rejected', monto: 50, estadoPago: 'rechazado' },
  ];
  assert.equal(money.sumConfirmedClientPayments(payments), 700);
  assert.equal(money.sumPendingClientPayments(payments), 200);
  const validate = evaluate(range(guards, 286, 321), ['validatePaymentAgainstBudget'], {
    ...money, MONEY_TOLERANCE: 1, getBudgetCollectibleTotal: (b) => b.totalConDescuento,
  }).validatePaymentAgainstBudget;
  const budget = { totalConDescuento: 1000, pagosCliente: payments };
  assert.equal(validate(budget, 100, { includePendingForLimit: true }).ok, true);
  assert.equal(validate(budget, 200, { includePendingForLimit: true }).ok, false);
  assert.equal(validate(budget, -1).ok, false);
  results.push({ case: 'payment-status-and-limit', result: 'expected', confirmed: 700, pending: 200 });

  const normal = invoiceHarness();
  assert.equal((await normal.actions.addPaymentToInvoiceInner('isolated-invoice', form(1000))).success, true);
  assert.equal((await normal.actions.addPaymentToInvoiceInner('isolated-invoice', form(2))).success, false);
  results.push({ case: 'invoice-tolerance-and-limit', result: 'expected', note: 'Uses existing UYU tolerance of 1 peso; no change proposed.' });

  const tolerance = invoiceHarness();
  tolerance.set({ ...tolerance.read(), sourcePresupuestoId: undefined, payments: [{ id: 'full', amount: 1000 }], status: 'Paid' });
  for (let i = 0; i < 3; i++) assert.equal((await tolerance.actions.addPaymentToInvoiceInner('isolated-invoice', form(1))).success, true);
  assert.equal(tolerance.read().payments.reduce((sum, p) => sum + p.amount, 0), 1003);
  results.push({ case: 'standalone-paid-invoice-repeats-tolerance', result: 'defect-reproduced', invoiceTotal: 1000, collected: 1003 });

  const foreign = invoiceHarness();
  foreign.set({ ...foreign.read(), currency: 'USD', sourcePresupuestoId: undefined });
  assert.equal((await foreign.actions.addPaymentToInvoiceInner('isolated-invoice', form(12.5))).success, true);
  assert.equal(foreign.read().payments[0].amount, 13);
  assert.ok(snapshot.files['src/app/(app)/invoices/[id]/page.tsx'].content.includes('PESOS URUGUAYOS'));
  results.push({ case: 'non-uyu-payment-loses-decimals', result: 'defect-reproduced', requestedCurrency: 'USD', requestedAmount: 12.5, recordedAmount: 13, receiptHasFixedUyuLabel: true });

  const failing = invoiceHarness({ addPagoToPresupuesto: async () => { throw new Error('ISOLATED_DATABASE_FAILURE'); } });
  for (let attempt = 0; attempt < 2; attempt++) {
    await assert.rejects(failing.actions.addPaymentToInvoiceInner('isolated-invoice', form(100)), /ISOLATED_DATABASE_FAILURE/);
  }
  assert.equal(failing.read().payments.length, 2);
  assert.equal(failing.read().payments.reduce((sum, p) => sum + p.amount, 0), 200);
  assert.equal(failing.read().payments.every((p) => p.pasadoAlPresupuesto === false), true);
  results.push({ case: 'invoice-mirror-throws-and-retry', result: 'defect-reproduced', rejectedCalls: 2, savedPayments: 2, savedAmount: 200, transferPending: true });

  const denied = invoiceHarness({ addPagoToPresupuesto: async () => ({ success: false, error: 'NO_BALANCE' }) });
  assert.equal((await denied.actions.addPaymentToInvoiceInner('isolated-invoice', form(100))).success, false);
  assert.equal(denied.read().payments.length, 0);
  results.push({ case: 'invoice-mirror-returns-failure', result: 'expected', savedPayments: 0 });

  const parallel = invoiceHarness();
  const concurrent = await Promise.all([
    parallel.actions.addPaymentToInvoiceInner('isolated-invoice', form(600)),
    parallel.actions.addPaymentToInvoiceInner('isolated-invoice', form(600)),
  ]);
  assert.equal(concurrent.filter((r) => r.success).length, 1);
  assert.equal(parallel.read().payments.reduce((sum, p) => sum + p.amount, 0), 600);
  results.push({ case: 'invoice-concurrent-balance-check', result: 'expected', successResponses: 1, savedAmount: 600 });

  const unauthorized = invoiceHarness({ requirePermiso: async () => ({ ok: false, error: 'ISOLATED_PERMISSION_DENIED' }) });
  assert.equal((await unauthorized.actions.addPaymentToInvoiceInner('isolated-invoice', form(100))).success, false);
  assert.equal(unauthorized.read().payments.length, 0);
  results.push({ case: 'invoice-denied-permission', result: 'expected', savedPayments: 0 });

  const events = [];
  let refreshes = 0;
  const handler = evaluate(range('src/app/(app)/invoices/[id]/page.tsx', 123, 147), ['handleAddPaymentSubmit'], {
    FormData,
    invoice: { id: 'isolated-invoice' },
    newPayment: { amount: 100, paymentDate: '2026-10-02', method: 'Efectivo' },
    paymentProofFile: null,
    setIsAddingPayment: () => {},
    setPaymentProofFile: () => {},
    conTopeDeEspera: (p) => p,
    addPaymentToInvoice: async () => ({ success: false, error: 'NO_BALANCE' }),
    toast: (t) => events.push(t),
    fetchData: async () => { refreshes++; },
  }).handleAddPaymentSubmit;
  await handler({ preventDefault() {} });
  assert.equal(events.length, 0);
  assert.equal(refreshes, 0);
  results.push({ case: 'invoice-ui-swallows-returned-failure', result: 'defect-reproduced', errorMessages: events.length, refreshes });

  const planPath = 'src/app/actions/payment-plans.ts';
  let fiesta = { id: 'isolated-fiesta', planDePagos: { cuotas: [
    { id: 'one', monto: 100, estado: 'pendiente' },
    { id: 'two', monto: 200, estado: 'pendiente' },
  ] } };
  let reads = 0;
  let releaseReads;
  const bothRead = new Promise((resolve) => { releaseReads = resolve; });
  let notices = 0;
  const quotaActions = evaluate(range(planPath, 9, 39) + '\n' + range(planPath, 83, 143), ['updateCuotaEstado'], {
    ...money,
    requireAppSession: async () => {},
    getFiestaById: async () => {
      const old = clone(fiesta);
      if (++reads === 2) releaseReads();
      await bothRead;
      return old;
    },
    saveFiesta: async (data) => { fiesta = clone(data); return { success: true }; },
    notifyClientPaymentApproved: async () => { notices++; },
  });
  const changes = await Promise.all([
    quotaActions.updateCuotaEstado('isolated-fiesta', 'one', { estado: 'pagado' }),
    quotaActions.updateCuotaEstado('isolated-fiesta', 'two', { estado: 'pagado' }),
  ]);
  assert.equal(changes.every((r) => r.success), true);
  assert.equal(fiesta.planDePagos.cuotas.filter((q) => q.estado === 'pagado').length, 1);
  assert.equal(notices, 2);
  results.push({ case: 'two-quota-updates', result: 'defect-reproduced-with-whole-document-save-stub', paidQuotas: 1, successResponses: 2, notices });

  const receiptsPath = 'src/app/actions/recibos-personal.ts';
  const receipts = evaluate(range(receiptsPath, 15, 49) + '\n' + range(receiptsPath, 74, 135), ['aplicarRecibo'], { randomUUID: () => 'isolated-id' });
  const paid = { id: 'receipt', empleadoId: 'person', fiestaId: 'event', monto: 100, fecha: '2026-10-02', estado: 'pagado' };
  assert.ok(receipts.aplicarRecibo([clone(paid)], { ...paid, monto: 200 }, 'tester').error);
  assert.ok(receipts.aplicarRecibo([clone(paid)], { ...paid, estado: 'pendiente' }, 'tester').error);
  const signed = receipts.aplicarRecibo([clone(paid)], { ...paid, estado: 'firmado_subido' }, 'tester');
  assert.equal(signed.lista.length, 1);
  assert.equal(signed.recibo.monto, 100);
  results.push({ case: 'closed-receipt-preserves-amount-and-state', result: 'expected' });

  const plans = evaluate(snapshot.files['src/lib/planPagos.ts'].content.replace(/^import .*;$/gm, ''), ['generarPlanPagos', 'recalcularEstadoCuotas'], money);
  for (const [date, total] of [['2027-08-08', 100000], ['2028-12-15', 123456], ['2031-05-17', 3500]]) {
    const plan = plans.generarPlanPagos(date, total);
    assert.equal(plan.cuotas.reduce((sum, q) => sum + q.montoMinimo, 0), total);
    const settled = plans.recalcularEstadoCuotas(plan, [{ id: 'full', monto: total, estadoPago: 'confirmado', fecha: '2026-10-02' }]);
    assert.equal(settled.cuotas.every((q) => q.estado === 'completada'), true);
  }
  results.push({ case: 'contract-quota-total-and-full-payment', result: 'expected', scenarios: 3 });
  console.log(JSON.stringify({ commit: snapshot.commit, actualSourceFragments: true, productionWrites: 0, fullBuildExecuted: false, results }, null, 2));
}

run().catch((error) => { console.error(error); process.exitCode = 1; });

