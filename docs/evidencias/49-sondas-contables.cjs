// Audit probes only: actual function bodies, fake I/O, no Firebase or network.
// node docs/evidencias/49-sondas-contables.cjs <path-to-typescript-package>
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../..');
const results = [];
const clone = (x) => JSON.parse(JSON.stringify(x));

function declarations(file, names) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  return names.map((name) => {
    const node = ast.statements.find((n) => n.name?.text === name);
    assert.ok(node, `Missing source declaration: ${file}:${name}`);
    return node.getText(ast);
  }).join('\n');
}

function evaluate(source, globals = {}) {
  const context = { exports: {}, console: { error() {}, warn() {} }, ...globals };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context, { timeout: 2000 });
  return context.exports;
}

const moneySource = declarations('src/lib/budget/financial-guardrails.ts', ['roundMoney']);
const money = evaluate(moneySource);
const duplicateSource = declarations('src/lib/budget/pago-duplicado.ts', [
  'esEspejoDeFactura', 'mismoDia', 'buscarGemeloCargadoAMano',
]);
const duplicate = evaluate(duplicateSource, money);
const budgetSource = declarations('src/app/actions/presupuestos.ts', ['addPagoToPresupuesto']);
const planSource = declarations('src/app/actions/payment-plans.ts', [
  'buildMontevideoPaymentTimestamp', 'normalizeCuotaPlanPago', 'savePlanDePagos', 'updateCuotaEstado',
]);
const payment = { fecha: '2026-09-08', monto: 3000, metodoPago: 'Efectivo', estadoPago: 'confirmado' };
const budget = { id: 'audit-only', totalConDescuento: 10000, itemsPresupuestados: [], pagosCliente: [] };
const fixture = { id: 'audit-event', planDePagos: { cuotas: [
  { id: 'c1', monto: 3000, estado: 'pendiente', descripcion: 'Cuota de prueba' },
] } };

function budgetContext(extra = {}) {
  const mutex = evaluate(declarations('src/lib/mutex.ts', ['AsyncMutex']));
  let storedBudget = clone(budget);
  return {
    ...money, ...duplicate,
    presupuestosMutex: new mutex.AsyncMutex(),
    verifySession: async () => ({ success: true, user: { perfil: 'dueno' } }),
    getPresupuestoById: async () => clone(storedBudget),
    getPresupuestos: async () => [storedBudget],
    guardarPresupuestoSinTurno: async (p) => {
      storedBudget = clone(p);
      return { success: true, presupuesto: storedBudget };
    },
    updatePresupuesto: async (p) => {
      storedBudget = clone(p);
      return { success: true, presupuesto: storedBudget };
    },
    shouldDedupePaymentReference: (ref) => !!ref?.startsWith('AK_SYNC:'),
    validatePaymentAgainstBudget: () => ({ ok: true }),
    createNotification: async () => {},
    ...extra,
  };
}

async function probe(id, run) {
  try { await run(); results.push({ id, status: 'PASS' }); }
  catch (e) { results.push({ id, status: 'FAIL', reason: e.message }); }
}

(async () => {
  await probe('CON-01a plan must report failed persistence', async () => {
    const actions = evaluate(planSource, {
      ...money, requireAppSession: async () => {}, getFiestaById: async () => clone(fixture),
      saveFiesta: async () => ({ success: false, error: 'Injected storage failure' }),
      notifyClientPaymentApproved: async () => {},
    });
    const result = await actions.savePlanDePagos(fixture.id, { cuotas: fixture.planDePagos.cuotas });
    assert.equal(result.success, false, 'saveFiesta=false but savePlanDePagos reports success=true');
  });
  await probe('CON-01b failed installment must not announce payment', async () => {
    const notices = [];
    const actions = evaluate(planSource, {
      ...money, requireAppSession: async () => {}, getFiestaById: async () => clone(fixture),
      saveFiesta: async () => ({ success: false, error: 'Injected storage failure' }),
      notifyClientPaymentApproved: async (...args) => { notices.push(args); },
    });
    const result = await actions.updateCuotaEstado(fixture.id, 'c1', { estado: 'pagado' });
    assert.equal(JSON.stringify({ success: result.success, notices: notices.length }),
      JSON.stringify({ success: false, notices: 0 }), 'Failed save returns success=true and sends one payment notice');
  });
  await probe('CON-02a invoice mirror must propagate failed save', async () => {
    const actions = evaluate(budgetSource, budgetContext({
      getPresupuestos: async () => [{ ...clone(budget), pagosCliente: [{ ...payment, id: 'manual' }] }],
      guardarPresupuestoSinTurno: async () => ({ success: false, error: 'Injected storage failure' }),
      updatePresupuesto: async () => ({ success: false, error: 'Injected storage failure' }),
    }));
    const result = await actions.addPagoToPresupuesto(budget.id, { ...payment, referencia: 'AK_SYNC:invoice:i:payment:p' });
    assert.equal(result.success, false, 'updatePresupuesto=false but mirror returns success=true');
  });
  await probe('CON-02b confirmed mirror must resolve pending twin', async () => {
    let stored;
    const actions = evaluate(budgetSource, budgetContext({
      getPresupuestos: async () => [{ ...clone(budget), pagosCliente: [{ ...payment, id: 'manual', estadoPago: 'pendiente_confirmacion' }] }],
      guardarPresupuestoSinTurno: async (value) => { stored = clone(value); return { success: true, presupuesto: value }; },
      updatePresupuesto: async (value) => { stored = clone(value); return { success: true, presupuesto: value }; },
    }));
    await actions.addPagoToPresupuesto(budget.id, { ...payment, referencia: 'AK_SYNC:invoice:i:payment:p' });
    assert.equal(stored.pagosCliente[0].estadoPago, 'confirmado', 'Confirmed invoice leaves budget twin pending_confirmacion');
  });
  await probe('CON-03 two simultaneous payments must both remain', async () => {
    let stored = clone(budget);
    const mutex = evaluate(declarations('src/lib/mutex.ts', ['AsyncMutex']));
    const sharedMutex = new mutex.AsyncMutex();
    const actions = evaluate(budgetSource, budgetContext({
      presupuestosMutex: sharedMutex,
      getPresupuestos: async () => [clone(stored)],
      guardarPresupuestoSinTurno: async (value) => {
        stored = clone(value);
        return { success: true, presupuesto: value };
      },
    }));
    const responses = await Promise.all([
      actions.addPagoToPresupuesto(budget.id, { ...payment, monto: 1000 }),
      actions.addPagoToPresupuesto(budget.id, { ...payment, monto: 2000 }),
    ]);
    assert.ok(responses.every((r) => r.success));
    assert.equal(stored.pagosCliente.reduce((s, p) => s + p.monto, 0), 3000,
      'Both return success, but stale snapshot overwrites one payment even with actual AsyncMutex');
  });
  await probe('CON-04 failed cash-flow sources must not be valid zero', async () => {
    const source = declarations('src/app/actions/dashboard.ts', ['getCashFlowProjection']);
    const reject = async () => { throw new Error('Injected source unavailable'); };
    const actions = evaluate(source, {
      requireAppSession: async () => {}, getAllFiestas: reject, getInvoices: reject,
      getRoles: reject, getPresupuestos: reject,
      startOfToday: () => new Date('2026-09-08T12:00:00Z'),
      addMonths: (date, n) => new Date(date.getFullYear(), date.getMonth() + n, 8),
      getMonthKey: (date) => date.toISOString().slice(0, 7),
      isFirmSalesInvoice: () => true,
    });
    const result = await actions.getCashFlowProjection();
    assert.ok(!result.success || result.unavailableSources?.length,
      'All four sources fail; action returns success=true and six zero months without unavailable flags');
  });
  await probe('CON-05 signed operator must not read accounting invoices', async () => {
    const profiles = evaluate(fs.readFileSync(path.join(root, 'src/lib/auth/perfiles.ts'), 'utf8'));
    const user = { role: 'user', perfil: 'operador' };
    assert.equal(profiles.puede(user, profiles.PERMISOS.CONTABILIDAD), false);
    let reads = 0;
    const actions = evaluate(declarations('src/app/actions/invoices.ts', ['getInvoices']), {
      INVOICES_FILE: 'test-only', verifySession: async () => ({ success: true, user }),
      readData: async () => { reads++; return [{ id: 'fake-invoice', totalAmount: 10000 }]; },
    });
    try { await actions.getInvoices(); } catch {}
    assert.equal(reads, 0, 'Operator has no CONTABILIDAD permission, but invoice source is read');
  });
  console.log(JSON.stringify({ scope: 'Isolated actual functions with mocked I/O, not production E2E', results }, null, 2));
  process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0;
})().catch((error) => { console.error(error); process.exitCode = 2; });
