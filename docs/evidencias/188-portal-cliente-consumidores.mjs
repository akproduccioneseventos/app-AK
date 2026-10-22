import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '09ea4138f5146cd2dfa6b792eda31cc04c30843f';
const target = new URL('188-portal-cliente-consumidores-final.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve execution receipt');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript'), { JSDOM } = req('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://qa.invalid/portal/c/qa188', pretendToBeVisual: true });
for (const key of ['window','document','navigator','HTMLElement','SVGElement','Element','Node','NodeFilter','HTMLInputElement','MutationObserver','CustomEvent','Event','KeyboardEvent','FileReader','getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
const React = req('react'), { act } = React, { createRoot } = req('react-dom/client');
const keyboardReq = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/keyboard161/package.json');
const user = keyboardReq('@testing-library/user-event').default.setup({ document });
const hashes = {}, cache = new Map(), cases = [], cookies = new Map(), observedErrors = [];
const clone = value => JSON.parse(JSON.stringify(value));
const env = { NODE_ENV: 'production', AK_USE_LOCAL_JSON_ONLY: 'true', AK_SESSION_SECRET: 'qa188-fictitious-session-secret-with-entropy' };
let app, budgetReadFails = false, store, uploadFails = false, uploadCalls = 0, writeCalls = 0, readBarrier;
const budget = { id: 'qa188-budget', clienteNombre: 'Cliente ficticio QA188', clienteContacto: '099000188', eventoTipo: 'Boda', eventoFecha: '2026-12-20',
  invitadosCantidad: 25, salonFiestas: 'Salon ficticio QA188', costoTotalEstimado: 1000, totalConDescuento: 1000, totalFinal: 1000, total: 1000,
  timestamp: '2026-10-21T12:00:00.000Z', fechaFirmaContrato: '2026-10-21', ajusteAnualPorcentaje: 0,
  itemsPresupuestados: [{ idServicioCatalogo: 'qa188-service', nombreServicio: 'Servicio ficticio QA188', cantidad: 1, precioUnitario: 1000, precioUnitarioPresupuesto: 1000, costoTotalItem: 1000 }],
  pagosCliente: [{ id: 'qa188-paid', fecha: '2026-10-21', monto: 100, estadoPago: 'confirmado' }, { id: 'qa188-pending', fecha: '2026-10-21', monto: 200, estadoPago: 'pendiente_confirmacion' }, { id: 'qa188-rejected', fecha: '2026-10-21', monto: 50, estadoPago: 'rechazado' }] };
const fixture = { id: 'qa188-fiesta', presupuestoId: budget.id, configuracion: { nombreEvento: 'Fiesta ficticia QA188', clienteNombre: 'Cliente ficticio QA188',
  fechaEvento: '2026-12-20', horaInicio: '20:00', nombreLugar: 'Salon QA188', invitadosEstimados: 25, tipoCelebracion: 'Boda' },
  clientPortalSettings: { enabled: true, accessKey: 'qa188-key', cuentasBancarias: [1,2,3].map(n => ({ id: `qa188-bank-${n}`, banco: `Banco ficticio QA188-${n}`, titular: `Titular QA188-${n}`, numero: `CUENTA-QA188-${n}` })) },
  programa: [{ id: 'public', hora: '20:00', titulo: 'Momento publico QA188', visibleParaCliente: true }, { id: 'private', titulo: 'NOTA-INTERNA-QA188', visibleParaCliente: false }],
  personalAsignado: [{ empleadoId: 'qa188-worker', eventSalary: 9876 }], gestionCostos: { gastos: [{ descripcion: 'COSTO-INTERNO-QA188', monto: 777 }] },
  clientPaymentNotifications: [], invitados: [], timeline: [], reuniones: [], contratoDatos: { senia: 0, saldo: 900, ajusteAnualPorcentaje: 0, fechaFirmaContrato: '2026-10-21' }, contratoFirmaInfo: { isSigned: true } };
function read(file) {
  const result = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  assert.equal(result.status, 0, result.stderr); hashes[file] = crypto.createHash('sha256').update(result.stdout).digest('hex'); return result.stdout;
}
const cookieAdapter = { cookies: async () => ({ get: name => cookies.has(name) ? { value: cookies.get(name) } : undefined, set: (name,value) => cookies.set(name,value) }) };
function execute(file, names = null, bindings = {}, overrides = {}) {
  const raw = read(file), ast = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true);
  const selected = names ? ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)
    || ts.isVariableStatement(node) && node.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))) : ast.statements;
  if (names) for (const name of names) assert.ok(selected.some(node => ts.isFunctionDeclaration(node) && node.name?.text === name || ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === name)), name);
  const module = { exports: {} };
  const localRequire = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/headers') return cookieAdapter;
    if (id === '@/app/actions/fiesta/portal.actions') return portalActions;
    if (id === '@/app/actions/presupuestos') return budgets;
    if (id === '@/lib/auth/session-token') return session;
    if (id === '@/lib/security/portal-session') return portalSession;
    if (id === '@/lib/firebase/server') return { dbAdmin: null };
    if (id === '@/lib/fiesta/get-fiesta-raw') return { getFiestaByIdRaw: async id => id === store.id ? clone(store) : null };
    if (id === '@/components/public-footer') return { PublicFooter: () => React.createElement('footer', null, 'QA188 footer') };
    if (id === '@/components/legal/AvisoDeDatos') return { AvisoDeDatos: () => null };
    if (id === '@/components/decoracion/SalonDelClienteEn3D') return { SalonDelClienteEn3D: () => React.createElement('div', { 'data-qa188-3d-stub': true }) };
    if (id === '@/app/actions/settings') return { getCompanyInfoPublica: async () => ({ companyName: 'Empresa ficticia QA188', companyContact: '59899000188' }), getBudgetDisplaySettings: async () => ({ annualAdjustmentPercentage: 0 }) };
    if (id === '@/app/actions/servicios-empresa') return { getServiciosEmpresaPublicos: async () => [] };
    if (id === 'next/navigation') return { notFound: () => { throw new Error('QA188_NOT_FOUND'); } };
    if (id === '@/lib/social-fiesta/public-event') return execute('src/lib/social-fiesta/public-event.ts', ['ocultarRespuestaCorrecta']);
    if (!id.startsWith('@/') && !id.startsWith('.')) return req(id);
    const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.posix.join(path.posix.dirname(file), id);
    const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}/index.ts`, `${base}/index.tsx`].find(candidate => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile());
    assert.ok(resolved, `Resolve ${id}`); return load(resolved);
  };
  const code = ts.transpileModule(selected.map(node => node.getText(ast)).join('\n'), { fileName: file, compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText + (names ? `\nexports.__qa={${names.join(',')}};` : '');
  const bindingsGlobals = { ...bindings };
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process: { env, cwd: () => root }, crypto,
    Date, Math, JSON, Object, Array, Map, Set, Buffer, URL, URLSearchParams, FormData, Blob,
    window, document, navigator, HTMLElement, FileReader: dom.window.FileReader, setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame,
    console: { log() {}, warn(...args) { observedErrors.push(args.map(String).join(' ')); }, error(...args) { observedErrors.push(args.map(String).join(' ')); } },
    ...bindingsGlobals }, { filename: file, timeout: 5000 });
  return names ? module.exports.__qa : module.exports;
}
function load(file) { if (!cache.has(file)) cache.set(file, execute(file)); return cache.get(file); }
const profiles = load('src/lib/auth/perfiles.ts');
const session = execute('src/lib/auth/session-token.ts', null, {}, { crypto, '@/lib/auth/session-constants': { SESSION_COOKIE_NAME: 'ak_session' } });
const portalSession = execute('src/lib/security/portal-session.ts', null, {}, { crypto });
const readBudget = async () => { if (budgetReadFails) throw new Error('QA188_BUDGET_READ_FAILED'); return [clone(budget)]; };
const budgets = execute('src/app/actions/presupuestos.ts', ['PRESUPUESTOS_FILE','nivelDePresupuestos','sinCobros','getPresupuestoById'], { ...profiles, readData: readBudget });
const mapper = load('src/lib/client-portal/public-fiesta.ts');
let mutation = Promise.resolve();
const mutate = async (id, fn) => {
  const next = mutation.then(async () => { const value = await fn(clone(store)); store = clone(value); writeCalls++; return { success: true }; });
  mutation = next.catch(() => {}); return next;
};
const getEvent = async id => {
  const snapshot = clone(store);
  if (readBarrier) await readBarrier();
  return id === snapshot.id ? snapshot : null;
};
const portalActions = execute('src/app/actions/fiesta/portal.actions.ts', ['normalizeClientPaymentAmount','getFiestaByAccessKey','initializePortalSession','submitClientPayment'], {
  ...portalSession, ...mapper, getFiestaByIdRaw: async id => id === store.id ? clone(store) : null,
  leerFiestasCrudas: async () => [clone(store)], getFiestaById: getEvent, actualizarFiesta: mutate,
  sanitizeActionError: error => error instanceof Error ? error.message : String(error),
  uploadToStorage: async () => { uploadCalls++; if (uploadFails) throw new Error('QA188_UPLOAD_FAILED'); return 'payments/qa188/receipt.png'; },
  createNotification: async () => ({ success: true }), notifyClientPaymentSubmitted: async () => {},
});
for (const name of ['addClientMusicSuggestion','submitClientMenuChangeRequest','submitClientServiceAddRequest','updateClientePortalExperience','checkDateAvailability','cancelServicesOrParty','changeEventDate']) {
  portalActions[name] = async () => { throw new Error(`QA188_UNCONFIGURED_UNUSED_ACTION:${name}`); };
}
const PublicPage = load('src/app/portal/c/[accessKey]/page.tsx').default;
const check = (id, pass, observed) => cases.push({ id, pass: Boolean(pass), observed });
const tick = () => new Promise(resolve => setTimeout(resolve, 40));
const body = () => document.body.textContent;
const button = label => [...document.querySelectorAll('button')].find(item => item.textContent.trim() === label);
async function unmount() { if (app) { await act(async () => { app.unmount(); await tick(); }); app = null; } }
async function renderPage() {
  await unmount(); const element = await PublicPage({ params: Promise.resolve({ accessKey: fixture.clientPortalSettings.accessKey }) });
  app = createRoot(document.getElementById('app')); await act(async () => { app.render(element); await tick(); }); return element;
}
async function click(element) { assert.ok(element); await act(async () => { await user.click(element); await tick(); }); }
function reset() { store = clone(fixture); mutation = Promise.resolve(); readBarrier = undefined; writeCalls = 0; uploadCalls = 0; uploadFails = false; }
function barrierForTwo() {
  let count = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  return async () => { count++; if (count >= 2) release(); await gate; };
}
try {
  reset();
  const token = await session.generateBudgetToken(budget.id);
  check('public-budget-token-positive', (await budgets.getPresupuestoById(budget.id, token))?.totalConDescuento === 1000, { id: budget.id });
  check('public-budget-token-other-id-denied', await budgets.getPresupuestoById('qa188-other-budget', token) === null, {});
  check('public-budget-token-invalid-denied', await budgets.getPresupuestoById(budget.id, 'invalid') === null, {});
  const element = await renderPage();
  check('public-page-keeps-budget-and-three-accounts', element.props.presupuesto?.id === budget.id && element.props.fiesta.clientPortalSettings.cuentasBancarias.length === 3, { budgetId: element.props.presupuesto?.id, banks: element.props.fiesta.clientPortalSettings.cuentasBancarias });
  check('public-page-redacts-team-only-fields', !JSON.stringify(element.props.fiesta).includes('COSTO-INTERNO-QA188') && !JSON.stringify(element.props.fiesta).includes('NOTA-INTERNA-QA188') && !JSON.stringify(element.props.fiesta).includes('qa188-worker'), { keys: Object.keys(element.props.fiesta) });
  const financialTrigger = document.querySelector('#portal-contable button');
  assert.ok(financialTrigger);
  if (financialTrigger.getAttribute('data-state') !== 'open') await click(financialTrigger);
  check('client-accounts-visible-real-dom', [1,2,3].every(n => body().includes(`CUENTA-QA188-${n}`)), { visible: [1,2,3].map(n => body().includes(`CUENTA-QA188-${n}`)) });
  const beforePayForm = document.querySelectorAll('input[type="number"],input[type="file"]').length;
  await click(button('Informar pago'));
  check('client-report-payment-button-opens-form', document.querySelectorAll('input[type="number"],input[type="file"]').length > beforePayForm, { beforePayForm, afterPayForm: document.querySelectorAll('input[type="number"],input[type="file"]').length, buttons: [...document.querySelectorAll('button')].map(item => item.textContent.trim()), paymentModalStateUsageCount: read('src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx').match(/\bpaymentModalOpen\b/g)?.length });
  budgetReadFails = true; const failedReadPage = await renderPage();
  check('budget-read-failure-not-shown-as-missing', !body().includes('Falta el presupuesto') && (body().toLowerCase().includes('error') || body().toLowerCase().includes('no se pudo')), { budgetProp: failedReadPage.props.presupuesto, text: body().slice(0, 1100), errorCatalogo: failedReadPage.props.errorCatalogo });
  budgetReadFails = false; cookies.set('ak_session', await session.createSignedSessionToken({ userId: 'qa188-client', email: 'qa188@qa.invalid', role: 'client', perfil: 'cliente' }, 300));
  const loggedPage = await renderPage();
  check('valid-public-link-with-client-app-session-keeps-own-budget', loggedPage.props.presupuesto?.id === budget.id, { budgetProp: loggedPage.props.presupuesto, missingBanner: body().includes('Falta el presupuesto') });
  await unmount(); cookies.delete('ak_session'); reset();
  const initialized = await portalActions.initializePortalSession(store.id, store.clientPortalSettings.accessKey);
  check('portal-signature-positive-control', initialized.success && await portalSession.verifyPortalSession(store.id), initialized);
  const first = await portalActions.submitClientPayment(store.id, 500);
  const retry = await portalActions.submitClientPayment(store.id, 500);
  check('sequential-report-retry-one-pending-no-ledger-payment', first.success && retry.success && first.notificationId === retry.notificationId && store.clientPaymentNotifications.length === 1 && budget.pagosCliente.length === 3, { first, retry, pending: store.clientPaymentNotifications, ledgerPayments: budget.pagosCliente.length });
  reset(); readBarrier = barrierForTwo();
  const simultaneous = await Promise.all([portalActions.submitClientPayment(store.id, 500), portalActions.submitClientPayment(store.id, 500)]);
  readBarrier = undefined;
  check('concurrent-same-payment-report-one-pending', simultaneous.every(item => item.success) && store.clientPaymentNotifications.length === 1 && simultaneous[0].notificationId === simultaneous[1].notificationId, { results: simultaneous, notifications: store.clientPaymentNotifications, writeCalls });
  reset(); readBarrier = barrierForTwo();
  const different = await Promise.all([portalActions.submitClientPayment(store.id, 250), portalActions.submitClientPayment(store.id, 300)]);
  readBarrier = undefined;
  check('concurrent-different-payments-both-retained', different.every(item => item.success) && store.clientPaymentNotifications.length === 2, { results: different, amounts: store.clientPaymentNotifications.map(item => item.monto), writeCalls });
  reset(); uploadFails = true;
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/X1kAAAAASUVORK5CYII=';
  const failedUpload = await portalActions.submitClientPayment(store.id, 500, png, 'qa188.png');
  uploadFails = false; const uploadsBeforeRetry = uploadCalls;
  const retryUpload = await portalActions.submitClientPayment(store.id, 500, png, 'qa188.png');
  check('failed-receipt-upload-retry-can-recover-or-reports-error', !failedUpload.success || Boolean(failedUpload.warning) || Boolean(store.clientPaymentNotifications[0]?.comprobanteUrl), { failedUpload, retryUpload, notifications: store.clientPaymentNotifications, uploadsBeforeRetry, uploadCalls });
  cookies.clear(); const writesBeforeDenied = writeCalls;
  const denied = await portalActions.submitClientPayment(store.id, 500);
  check('payment-without-portal-session-denied-before-write', denied.success === false && writeCalls === writesBeforeDenied, denied);
} catch (error) {
  observedErrors.push(`QA_HARNESS_OR_UNEXPECTED_ERROR:${error.stack || error}`); process.exitCode = 2;
} finally {
  await unmount(); dom.window.close();
  const receipt = { source, checkedAt: new Date().toISOString(), hashes, cases, summary: { total: cases.length, pass: cases.filter(item => item.pass).length, fail: cases.filter(item => !item.pass).length }, observedErrors,
    appEdited: false, realServices: false, limits: 'Real page/client ReactDOM, mappers, token signatures, portal session and payment action; cookie/read/store/upload/notification adapters controlled. Linearizable in-memory write queue, NOT Firestore/Next HTTP/native geometry/actual upload or ledger change.',
    discardedCandidate: 'costoTotalEstimado/costoTotalItem are selling subtotal/line total by Presupuesto types; do NOT report them as internal procurement-cost exposure.' };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, errors: observedErrors.filter(item => item.startsWith('QA_HARNESS')), failures: cases.filter(item => !item.pass) }));
}
