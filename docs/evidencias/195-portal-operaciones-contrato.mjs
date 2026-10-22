import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'fa3b492b8f1d6a77433a92f4d63b665cfea3747c';
const target = new URL('195-portal-operaciones-contrato.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve execution receipt');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript'), hashes = {}, cases = [], cookies = new Map();
const clone = value => JSON.parse(JSON.stringify(value));
let fiesta, presupuesto, queue = Promise.resolve(), saveFails, fileFails, available, writes, files, notifications;
const read = file => {
  const result = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  assert.equal(result.status, 0, result.stderr);
  hashes[file] = crypto.createHash('sha256').update(result.stdout).digest('hex');
  return result.stdout;
};
function load(file, names = null, globals = {}, dependencies = {}) {
  const raw = read(file), ast = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true);
  const selected = names ? ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)
    || ts.isVariableStatement(node) && node.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))) : ast.statements;
  if (names) for (const name of names) assert.ok(selected.some(node => ts.isFunctionDeclaration(node) && node.name?.text === name || ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === name)), name);
  const code = ts.transpileModule(selected.map(node => node.getText(ast)).join('\n'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText + (names ? `\nexports.__qa={${names.join(',')}};` : '');
  const module = { exports: {} }, localRequire = id => { assert.ok(Object.hasOwn(dependencies, id), `Unconfigured ${id}`); return dependencies[id]; };
  new Function('require','module','exports', ...Object.keys(globals), code)(localRequire, module, module.exports, ...Object.values(globals));
  return names ? module.exports.__qa : module.exports;
}
const portal = load('src/lib/security/portal-session.ts', null, { process: { env: { NODE_ENV: 'production', AK_SESSION_SECRET: 'qa195-only-fictitious-secret-at-least-32-characters' } } }, {
  crypto, 'next/headers': { cookies: async () => ({ get: name => cookies.has(name) ? { value: cookies.get(name) } : undefined }) },
  '@/lib/fiesta/get-fiesta-raw': { getFiestaByIdRaw: async id => id === fiesta?.id ? clone(fiesta) : null },
});
const formal = load('src/lib/budget/formal-budget.ts');
const financial = load('src/lib/budget/financial-guardrails.ts', null, {}, {
  '@/lib/budget/formal-budget': formal,
  '@/lib/calculations': { recalcularCostoItem: () => { throw new Error('QA195_UNEXPECTED_NORMALIZATION'); } },
});
const mutateBudget = async (id, fn) => {
  const task = queue.then(async () => {
    if (id !== presupuesto.id) return { encontrado: false };
    const next = await fn(clone(presupuesto));
    if (next) { presupuesto = clone(next); writes++; }
    return { encontrado: true, presupuesto: clone(presupuesto) };
  });
  queue = task.catch(() => {}); return task;
};
const actions = load('src/app/actions/fiesta/portal.actions.ts', ['cancelServicesOrParty','changeEventDate'], {
  process: { cwd: () => 'C:/qa195-not-a-real-write-target' },
  getFiestaById: async id => id === fiesta.id ? clone(fiesta) : null,
  saveFiesta: async next => { if (saveFails) return { success: false, error: 'QA195_SAVE_FAILED' }; fiesta = clone(next); return { success: true }; },
  checkDateAvailability: async () => ({ success: true, available }),
  sanitizeActionError: error => error instanceof Error ? error.message : String(error),
  formatearFechaEvento: value => String(value).slice(0,10),
}, {
  '@/lib/security/portal-session': portal,
  'fs/promises': { mkdir: async () => {}, writeFile: async (name, content) => { if (fileFails) throw new Error('QA195_DOCUMENT_FAILED'); files.push({ name, content }); } },
  path,
  '@/lib/budget/financial-guardrails': financial,
  '@/lib/budget/mutar-presupuesto': { mutarPresupuesto: mutateBudget },
  '@/lib/notifications/create-notification': { createNotification: async message => { notifications.push(message); return { success: true }; } },
});
function reset(discount) {
  queue = Promise.resolve(); saveFails = false; fileFails = false; available = true; writes = 0; files = []; notifications = [];
  presupuesto = { id: 'qa195-budget', clienteNombre: 'Cliente ficticio QA195', eventoFecha: '2026-12-20', estado: 'Aceptado',
    timestamp: '2026-10-21', fechaFirmaContrato: '2026-10-21', ajusteAnualActivo: false, ajusteAnualPorcentaje: 0,
    costoTotalEstimado: 1000, totalConDescuento: discount ? 900 : 1000,
    ...(discount ? { descuentoTipo: discount, descuentoValor: discount === 'monto' ? 100 : 10 } : {}),
    itemsPresupuestados: [700,300].map((monto, index) => ({ idServicioCatalogo: `qa195-${index ? 'b' : 'a'}`, nombreServicio: `Servicio ${index}`, cantidad: 1, precioUnitario: monto, precioUnitarioPresupuesto: monto, costoTotalItem: monto })),
    pagosCliente: [{ id: 'paid', monto: 100, estadoPago: 'confirmado' }, { id: 'pending', monto: 200, estadoPago: 'pendiente_confirmacion' }, { id: 'rejected', monto: 50, estadoPago: 'rechazado' }], ajustesAplicados: [] };
  fiesta = { id: 'qa195-party', presupuestoId: presupuesto.id, configuracion: { nombreEvento: 'Evento ficticio QA195', fechaEvento: '2026-12-20' },
    clientPortalSettings: { enabled: true, accessKey: 'qa195-key', clientPassword: 'qa195-pin' },
    contratoDatos: { fechaFirmaContrato: '2026-10-21', ajusteAnualPorcentaje: 0 }, othersDocumentos: [] };
  cookies.set('ak_portal_session', portal.createPortalSession(fiesta.id, fiesta.clientPortalSettings.accessKey));
}
const check = (id, pass, observed) => cases.push({ id, pass: Boolean(pass), observed });
const cancel = (all, services = []) => actions.cancelServicesOrParty(fiesta.id, { cancelAll: all, servicesToCancel: services, passwordInput: 'qa195-pin' });
const change = () => actions.changeEventDate(fiesta.id, { newDate: '2026-12-21', passwordInput: 'qa195-pin' });
const snapshot = result => ({ result, budget: clone(presupuesto), party: clone(fiesta), writes, files: files.length });
let unexpected;
try {
  reset(); cookies.clear(); const denied = await cancel(true);
  check('no-portal-session-no-mutation', denied.success === false && writes === 0 && files.length === 0, denied);
  reset(); const badPin = await actions.cancelServicesOrParty(fiesta.id, { cancelAll: true, servicesToCancel: [], passwordInput: 'wrong' });
  check('wrong-pin-no-mutation', badPin.success === false && writes === 0, badPin);
  reset(); const full = await cancel(true), fullSummary = financial.getBudgetPaymentSummary(presupuesto);
  check('full-cancellation-return-matches-stored-balance', full.success && full.pendingDue === fullSummary.balance && fullSummary.total === 300 && fullSummary.paid === 100, snapshot(full));
  const fullAgain = await cancel(true);
  check('full-cancellation-retry-no-second-penalty', fullAgain.success && fullAgain.yaEstaba && writes === 1 && fiesta.othersDocumentos.length === 1, snapshot(fullAgain));
  reset(); const partial = await cancel(false, ['qa195-a']), partialSummary = financial.getBudgetPaymentSummary(presupuesto);
  check('partial-cancellation-return-matches-stored-balance', partial.success && partial.pendingDue === partialSummary.balance && partialSummary.total === 510, snapshot(partial));
  const partial2 = await cancel(false, ['qa195-b']), partial2Summary = financial.getBudgetPaymentSummary(presupuesto);
  check('second-distinct-cancellation-return-matches-all-stored-penalties', partial2.success && partial2.pendingDue === partial2Summary.balance && partial2.refundAmount === Math.max(0, partial2Summary.paid - partial2Summary.total), { ...snapshot(partial2), summary: partial2Summary });
  reset('monto'); const fixed = await cancel(true), fixedSummary = financial.getBudgetPaymentSummary(presupuesto);
  check('fixed-discount-cancellation-return-matches-stored-balance', fixed.success && fixed.pendingDue === fixedSummary.balance, { ...snapshot(fixed), summary: fixedSummary });
  reset('porcentaje'); const percent = await cancel(true), percentSummary = financial.getBudgetPaymentSummary(presupuesto);
  check('percent-discount-cancellation-return-matches-stored-balance', percent.success && percent.pendingDue === percentSummary.balance, { ...snapshot(percent), summary: percentSummary });
  reset(); saveFails = true; const beforeSaveFailure = clone(presupuesto), failedSave = await cancel(true);
  check('cancellation-save-failure-rolls-budget-back', failedSave.success === false && JSON.stringify(presupuesto) === JSON.stringify({ ...beforeSaveFailure, saldo: undefined }), { result: failedSave, budget: clone(presupuesto), original: beforeSaveFailure });
  reset(); fileFails = true; const beforeFileFailure = clone(presupuesto), failedFile = await cancel(true);
  check('cancellation-document-failure-rolls-budget-back', failedFile.success === false && JSON.stringify(presupuesto) === JSON.stringify({ ...beforeFileFailure, saldo: undefined }), { result: failedFile, budget: clone(presupuesto), original: beforeFileFailure });
  reset(); available = false; const busy = await change();
  check('unavailable-date-no-charge-or-date-change', busy.success === false && writes === 0 && presupuesto.eventoFecha === '2026-12-20', busy);
  reset(); const changed = await change(), dateSummary = financial.getBudgetPaymentSummary(presupuesto);
  check('date-change-return-budget-and-party-agree', changed.success && changed.penaltyAmount === 100 && changed.newBalance === dateSummary.balance && presupuesto.eventoFecha === '2026-12-21' && fiesta.configuracion.fechaEvento === presupuesto.eventoFecha && dateSummary.total === 1100, snapshot(changed));
  const changedAgain = await change();
  check('date-change-retry-no-second-charge', changedAgain.success && changedAgain.yaEstaba && writes === 1 && fiesta.othersDocumentos.length === 1, snapshot(changedAgain));
  reset('monto'); const changedDiscount = await change(), discountedSummary = financial.getBudgetPaymentSummary(presupuesto);
  check('date-change-fixed-discount-return-matches-stored', changedDiscount.success && changedDiscount.newBalance === discountedSummary.balance && discountedSummary.total === 990, snapshot(changedDiscount));
  reset(); const simultaneous = await Promise.all([change(), change()]);
  check('simultaneous-same-date-one-penalty', simultaneous.every(value => value.success) && writes === 1 && presupuesto.itemsPresupuestados.filter(item => item.idServicioCatalogo.startsWith('multa_cambio_fecha')).length === 1, snapshot(simultaneous));
} catch (error) { unexpected = String(error.stack || error); process.exitCode = 2; }
finally {
  const receipt = { source, checkedAt: new Date().toISOString(), hashes, cases, unexpected,
    summary: { total: cases.length, pass: cases.filter(item => item.pass).length, fail: cases.filter(item => !item.pass).length },
    appEdited: false, realServices: false,
    limits: 'Actual cancellation/date-change action bodies, portal JWT verifier and financial summary. Linearizable budget adapter, party reads/save, availability, filesystem and notifications controlled; files only in memory. No Next HTTP, actual saveFiesta permission pipeline, Firestore, native UI, real contracts, costs or external messages. Existing 10/30 percent policy preserved, not a new proposed policy.' };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, unexpected, failures: cases.filter(item => !item.pass) }));
  if (receipt.summary.fail && !unexpected) process.exitCode = 1;
}
