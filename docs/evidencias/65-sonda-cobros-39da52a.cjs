// Executes original functions against synthetic IO; never connects to external services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const ts = require(path.join(root, 'node_modules/typescript'));
const commit = '39da52a33fcdda83f7575d6751a9bc101b3484cf';
const sourceFiles = ['src/app/actions/invoices.ts', 'src/app/(app)/invoices/[id]/page.tsx',
  'src/lib/invoice-money.ts', 'src/lib/budget/financial-guardrails.ts', 'src/lib/automatico/parte-manana.ts'];
assert.equal(execFileSync('git', ['diff', '--name-only', commit, '--', ...sourceFiles], { cwd: root, encoding: 'utf8' }).trim(), '', 'Retarget and contrast changed source before reusing this probe');
const sources = {};
function source(file) {
  if (!sources[file]) sources[file] = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  return sources[file];
}
function symbol(file, name) {
  const text = source(file);
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let found;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node.getText(ast).replace(/^export\s+/, '');
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) found = `const ${node.getText(ast)};`;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(found, `${name} in ${file}`);
  return found;
}
function evaluate(code, names, globals = {}) {
  const context = vm.createContext({ Date, Math, Number, FormData, process: { env: {} }, console: { error() {}, warn() {} }, ...globals });
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInContext(`${js}\nglobalThis.functions = {${names.join(',')}};`, context, { timeout: 3000 });
  return context.functions;
}
const invoicePath = 'src/app/actions/invoices.ts';
const screenPath = 'src/app/(app)/invoices/[id]/page.tsx';
const moneyNames = ['roundInvoiceMoney', 'invoiceMoneyTolerance'];
const money = evaluate(moneyNames.map(n => symbol('src/lib/invoice-money.ts', n)).join('\n'), moneyNames);
const parseCleanMoney = evaluate(symbol('src/lib/budget/financial-guardrails.ts', 'parseCleanMoney'), ['parseCleanMoney']).parseCleanMoney;
const actionNames = ['getInvoicePaidAmount', 'getInvoiceBalance', 'saldoReal', 'montoDelFormulario', 'estadoTrasElPago', 'pasarCobroAlPresupuesto', 'addPaymentToInvoiceInner', 'marcarCobroPasadoAlPresupuesto'];
const actionSource = actionNames.map(n => symbol(invoicePath, n)).join('\n');
const clone = value => structuredClone(value);
const form = (amount, operation) => {
  const data = new FormData();
  data.set('amount', String(amount));
  data.set('paymentDate', '2026-10-02');
  data.set('method', 'Efectivo');
  if (operation) data.set('operacionId', operation);
  return data;
};
function harness(options = {}) {
  let stored = { id: 'synthetic-invoice', currency: 'UYU', totalAmount: 1000, status: 'Sent', payments: [], sourcePresupuestoId: 'synthetic-budget' };
  let mirrorCalls = 0;
  const globals = {
    ...money, parseCleanMoney, INVOICES_FILE: 'invoices.json', PERMISOS: { CONTABILIDAD: 'contabilidad' },
    requirePermiso: async () => ({ ok: true }), verifySession: async () => ({ success: true }),
    mapDepositMethodToInvoiceMethod: x => x, mapDepositMethodToBudgetMethod: x => x,
    referenciaDelCobro: (invoice, payment) => `AK_SYNC:${invoice}:${payment}`,
    logger: { error() {}, warn() {} },
    leerFacturasSinGuardia: async () => [clone(stored)],
    mutateDataItem: async (_file, _collection, _id, update) => {
      const next = update(clone(stored));
      if (!next) return null;
      stored = clone(next);
      return clone(stored);
    },
    addPagoToPresupuesto: async (...args) => { mirrorCalls++; return options.mirror ? options.mirror(...args) : { success: true }; },
    ...options.globals,
  };
  return { actions: evaluate(actionSource, ['addPaymentToInvoiceInner'], globals), read: () => clone(stored), set: value => { stored = clone(value); }, mirrorCalls: () => mirrorCalls };
}
const cases = [];
const record = (id, status, details) => cases.push({ id, status, ...details });
async function run() {
  const failing = harness({ mirror: async () => { throw new Error('SYNTHETIC_OUTAGE'); } });
  const first = await failing.actions.addPaymentToInvoiceInner('synthetic-invoice', form(100, 'same-operation'));
  const retry = await failing.actions.addPaymentToInvoiceInner('synthetic-invoice', form(100, 'same-operation'));
  assert.equal(first.success, false);
  assert.equal(retry.success, false);
  assert.equal(failing.read().payments.length, 1);
  assert.match(first.error, /no lo ingreses de nuevo/i);
  record('COB01-retry-same-operation', 'passed', { savedPayments: 1, savedAmount: 100 });

  let attempts = 0;
  const recovering = harness({ mirror: async () => { if (++attempts === 1) throw new Error('SYNTHETIC_OUTAGE'); return { success: true }; } });
  await recovering.actions.addPaymentToInvoiceInner('synthetic-invoice', form(100, 'recovered-operation'));
  assert.equal((await recovering.actions.addPaymentToInvoiceInner('synthetic-invoice', form(100, 'recovered-operation'))).success, true);
  assert.equal(recovering.read().payments.length, 1);
  assert.equal(recovering.read().payments[0].pasadoAlPresupuesto, true);
  record('COB01-retry-reconciles', 'passed', { savedPayments: 1, mirrored: true });

  const bounded = harness();
  bounded.set({ ...bounded.read(), sourcePresupuestoId: undefined, status: 'Paid', payments: [{ id: 'full', amount: 1000 }] });
  const results = [];
  for (let i = 0; i < 3; i++) results.push((await bounded.actions.addPaymentToInvoiceInner('synthetic-invoice', form(1))).success);
  assert.deepEqual(results, [true, false, false]);
  assert.equal(bounded.read().payments.reduce((sum, p) => sum + p.amount, 0), 1001);
  record('COB04-cumulative-tolerance', 'passed', { results, savedTotal: 1001 });

  const decimals = harness();
  decimals.set({ ...decimals.read(), currency: 'USD', sourcePresupuestoId: undefined });
  assert.equal((await decimals.actions.addPaymentToInvoiceInner('synthetic-invoice', form('12,50'))).success, true);
  assert.equal(decimals.read().payments[0].amount, 12.5);
  assert.equal((await decimals.actions.addPaymentToInvoiceInner('synthetic-invoice', form('invalid'))).success, false);
  record('COB05-storage-decimals', 'passed', { savedAmount: 12.5, invalidRejected: true });

  const events = [];
  const operation = { current: 'screen-operation' };
  const handler = evaluate(symbol(screenPath, 'handleAddPaymentSubmit'), ['handleAddPaymentSubmit'], {
    invoice: { id: 'synthetic-invoice' }, newPayment: { amount: 100, paymentDate: '2026-10-02', method: 'Efectivo' },
    paymentProofFile: null, operacionDelCobro: operation,
    setIsAddingPayment() {}, setPaymentProofFile() {}, fetchData: async () => {},
    conTopeDeEspera: p => p,
    addPaymentToInvoice: async (_id, data) => { assert.equal(data.get('operacionId'), 'screen-operation'); return { success: false, error: 'SYNTHETIC_REJECTION' }; },
    toast: message => events.push(message),
  }).handleAddPaymentSubmit;
  await handler({ preventDefault() {} });
  assert.equal(events.length, 1);
  assert.equal(events[0].description, 'SYNTHETIC_REJECTION');
  assert.equal(operation.current, 'screen-operation');
  record('COB03-ui-returned-failure', 'passed', { errorDisplayed: true, operationPreserved: true, environment: 'original-handler-vm-not-browser' });

  const words = evaluate(['numberToSpanishWords', 'nombreDeLaMoneda'].map(n => symbol(screenPath, n)).join('\n'), ['numberToSpanishWords', 'nombreDeLaMoneda']);
  const receipt = `${words.numberToSpanishWords(12.5)} ${words.nombreDeLaMoneda('USD')}`;
  assert.match(receipt, /undefined/);
  record('COB06-receipt-decimals-in-words', 'defect-reproduced', { amount: 12.5, currency: 'USD', output: receipt });

  let releaseMirror;
  const mirrorWaiting = new Promise(resolve => { releaseMirror = resolve; });
  let enteredMirror;
  const mirrorEntered = new Promise(resolve => { enteredMirror = resolve; });
  let readCount = 0;
  let releaseReads;
  const bothRead = new Promise(resolve => { releaseReads = resolve; });
  const originalRead = harness().read();
  const racingGlobals = { leerFacturasSinGuardia: async () => { const snapshot = clone(originalRead); if (++readCount === 2) releaseReads(); await bothRead; return [snapshot]; } };
  // Two independent server invocations; the public wrapper's mutex is process-local.
  const shared = harness({ globals: racingGlobals, mirror: async () => { enteredMirror(); await mirrorWaiting; throw new Error('SYNTHETIC_OUTAGE'); } });
  const a = shared.actions.addPaymentToInvoiceInner('synthetic-invoice', form(100, 'concurrent-operation'));
  const b = shared.actions.addPaymentToInvoiceInner('synthetic-invoice', form(100, 'concurrent-operation'));
  await mirrorEntered;
  const second = await b;
  assert.equal(second.success, true);
  assert.equal(shared.read().payments[0].pasadoAlPresupuesto, false);
  releaseMirror();
  assert.equal((await a).success, false);
  assert.equal(shared.read().payments.length, 1);
  record('COB07-concurrent-retry-premature-success', 'defect-reproduced', { retrySuccess: true, firstSuccess: false, savedPayments: 1, passedToBudget: false, environment: 'two-invocations-shared-transaction-stub-not-firestore' });

  let editAttempts = 0;
  const edited = harness({ mirror: async () => { if (++editAttempts === 1) throw new Error('SYNTHETIC_OUTAGE'); return { success: true }; } });
  const newPayment = { amount: 100, paymentDate: '2026-10-02', method: 'Efectivo' };
  const editNotices = [];
  const editedHandler = evaluate(symbol(screenPath, 'handleAddPaymentSubmit'), ['handleAddPaymentSubmit'], {
    invoice: { id: 'synthetic-invoice' }, newPayment,
    paymentProofFile: null, operacionDelCobro: { current: 'edited-operation' },
    setIsAddingPayment() {}, setPaymentProofFile() {}, fetchData: async () => {},
    conTopeDeEspera: p => p, addPaymentToInvoice: edited.actions.addPaymentToInvoiceInner,
    toast: message => editNotices.push(message),
  }).handleAddPaymentSubmit;
  await editedHandler({ preventDefault() {} });
  assert.equal(editNotices[0].variant, 'destructive');
  newPayment.amount = 200;
  await editedHandler({ preventDefault() {} });
  assert.equal(editNotices[1].title, 'Pago Registrado');
  assert.equal(edited.read().payments[0].amount, 100);
  record('COB08-edited-pending-operation', 'defect-reproduced', { requestedAmount: 200, acceptedSuccess: true, storedAmount: 100, environment: 'source-action-plus-preserved-ui-operation-not-browser' });

  const partial = source(invoicePath).includes('Se concilia solo: no lo ingreses de nuevo.');
  const reconciliationConsumers = execFileSync('git', ['grep', '-n', 'pasarCobrosPendientesAlPresupuesto', '--', 'src'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
  const morning = source('src/lib/automatico/parte-manana.ts');
  assert.equal(partial, true);
  assert.equal(morning.includes('pasarCobrosPendientesAlPresupuesto'), false);
  assert.equal(morning.includes("accionTexto: 'Pasar ahora'"), true);
  record('COB09-false-automatic-reconciliation-message', 'defect-reproduced', { automaticMessage: true, morningOnlyAlerts: true, reconciliationConsumers });

  const hashes = Object.fromEntries(Object.entries(sources).map(([file, text]) => [file, crypto.createHash('sha256').update(text).digest('hex')]));
  const result = JSON.stringify({ commit, recordedAt: new Date().toISOString(), environment: 'synthetic-function-probes', cases, hashes }, null, 2);
  if (process.argv[3]) fs.writeFileSync(path.resolve(process.argv[3]), result + '\n');
  console.log(result);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
