import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'fa3b492b8f1d6a77433a92f4d63b665cfea3747c';
const target = new URL('194-portal-controles-version-nueva.json', import.meta.url);
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
let app, budgetReadFails = false, store, uploadFails = false, uploadCalls = 0, writeCalls = 0, readBarrier, saveReject = false;
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
    ...bindingsGlobals }, { filename: file, timeout: 30000 });
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
const portalActions = execute('src/app/actions/fiesta/portal.actions.ts', ['MUSIC_LIST_KEYS','normalizeClientPaymentAmount','updateFiestaData','getFiestaByAccessKey','initializePortalSession','submitClientPayment','addClientMusicSuggestion','updateClientePortalExperience'], {
  ...portalSession, ...mapper, getFiestaByIdRaw: async id => id === store.id ? clone(store) : null,
  leerFiestasCrudas: async () => [clone(store)], getFiestaById: getEvent, actualizarFiesta: mutate,
  saveFiesta: async value => { if (saveReject) return { success: false, error: 'QA189_SAVE_FAILED' }; store = clone(value); writeCalls++; return { success: true }; },
  sanitizeActionError: error => error instanceof Error ? error.message : String(error),
  uploadToStorage: async () => { uploadCalls++; if (uploadFails) throw new Error('QA188_UPLOAD_FAILED'); return 'payments/qa188/receipt.png'; },
  createNotification: async () => ({ success: true }), notifyClientPaymentSubmitted: async () => {},
});
for (const name of ['submitClientMenuChangeRequest','submitClientServiceAddRequest','checkDateAvailability','cancelServicesOrParty','changeEventDate']) {
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
  fixture.clientPortalSettings.accessPhase = 'organizacion';
  for (const key of ['musica','videoVida','fotografiaYFilmacion','menu','calculadoraBebidas','moodboard','itinerario']) fixture.clientPortalSettings[key] = { visible: true };
  fixture.fotografiaYFilmacion = { notasGenerales: 'Entrega oficial ficticia QA189', servicios: [{ id: 'qa189-delivery', nombre: 'Album oficial QA189', estado: 'Entregado completo', linkEntrega: 'https://qa.invalid/album-oficial-qa189' }] };
  reset();
  const element = await renderPage();
  check('organization-controls-positive', !!document.querySelector('#portal-organizacion') && !!document.querySelector('input[placeholder="Agregar canción importante"]'), { accessPhase: element.props.fiesta.clientPortalSettings.accessPhase });
  const deliveryFromReader = await portalActions.getFiestaByAccessKey(store.clientPortalSettings.accessKey);
  check('official-delivery-reader-positive-control', deliveryFromReader.fotografiaYFilmacion.servicios[0].linkEntrega === fixture.fotografiaYFilmacion.servicios[0].linkEntrega, deliveryFromReader.fotografiaYFilmacion);
  check('official-delivery-survives-active-page-mapper', element.props.fiesta.fotografiaYFilmacion?.servicios?.some(item => item.id === 'qa189-delivery'), element.props.fiesta.fotografiaYFilmacion);
  check('official-delivery-link-reachable-in-active-client-ui', [...document.querySelectorAll('a')].some(link => link.href === fixture.fotografiaYFilmacion.servicios[0].linkEntrega || link.getAttribute('href') === `/portal-cliente/${store.id}/fotos-video`), { links: [...document.querySelectorAll('a')].map(link => ({ text: link.textContent.trim(), href: link.getAttribute('href') })) });
  const financialTrigger = document.querySelector('#portal-contable button');
  assert.ok(financialTrigger);
  const pagos = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')].find(item => item.childElementCount === 0 && item.textContent.trim() === 'Pagos');
  const shortcut = pagos?.closest('.ak-public-card'); assert.ok(shortcut);
  await click(shortcut);
  check('payment-shortcut-keeps-open-section-open', financialTrigger.getAttribute('aria-expanded') === 'true', { expanded: financialTrigger.getAttribute('aria-expanded') });
  await click(shortcut);
  check('payment-shortcut-opens-closed-section', financialTrigger.getAttribute('aria-expanded') === 'true', { expanded: financialTrigger.getAttribute('aria-expanded') });
  const beforeCover = document.querySelectorAll('input[type="file"]').length;
  await click(button('Personalizar portada'));
  check('cover-opens-real-controls', document.querySelectorAll('input[type="file"]').length > beforeCover && !!button('Brillos de Fiesta'), { beforeCover, afterCover: document.querySelectorAll('input[type="file"]').length });
  await click(button('Brillos de Fiesta'));
  check('cover-saved-through-real-action', !!store.clientePortalExperience && body().includes('Diseño de portada actualizado.'), { experience: store.clientePortalExperience, writeCalls });
  await click(document.querySelector('button[aria-label="Cerrar"]'));
  check('cover-closes-controls', document.querySelectorAll('input[type="file"]').length === beforeCover, {});
  const savedExperience = clone(store.clientePortalExperience);
  await renderPage();
  check('cover-reread-through-page-mapper', JSON.stringify((await portalActions.getFiestaByAccessKey(store.clientPortalSettings.accessKey)).clientePortalExperience) === JSON.stringify(savedExperience), { experience: store.clientePortalExperience });
  const input = document.querySelector('input[placeholder="Agregar canción importante"]'); assert.ok(input);
  await click(button('Agregar'));
  check('empty-song-not-saved', body().includes('Escribí una canción antes de agregarla.') && !(store.listaMusicaPortal?.imprescindibles?.length), {});
  await act(async () => { await user.type(input, 'Cancion ficticia QA189'); }); await click(button('Agregar'));
  check('song-saved-through-real-action-and-ui', store.listaMusicaPortal?.imprescindibles?.includes('Cancion ficticia QA189') && body().includes('Canción agregada. AK ya la verá dentro del evento.') && input.value === '', { music: store.listaMusicaPortal, writeCalls });
  await renderPage();
  check('song-survives-page-reread', body().includes('Cancion ficticia QA189'), { music: store.listaMusicaPortal });
  const failedInput = document.querySelector('input[placeholder="Agregar canción importante"]');
  await act(async () => { await user.type(failedInput, 'No guardar QA189'); }); saveReject = true; await click(button('Agregar')); saveReject = false;
  check('song-save-error-keeps-text-and-no-false-addition', failedInput.value === 'No guardar QA189' && body().includes('QA189_SAVE_FAILED') && !store.listaMusicaPortal.imprescindibles.includes('No guardar QA189'), { input: failedInput.value, music: store.listaMusicaPortal });
  await click(button('Cancelar servicios o fiesta'));
  check('cancellation-opens-ui-without-executing-money-action', !!document.querySelector('input[type="checkbox"]') || body().includes('Confirmar cancelación') || body().includes('Seleccionar servicios'), { controls: [...document.querySelectorAll('input')].map(item => ({ type: item.type, placeholder: item.placeholder })), buttons: [...document.querySelectorAll('button')].map(item => item.textContent.trim()) });
  await renderPage(); await click(button('Cambiar fecha del evento'));
  check('date-change-opens-ui-without-executing-money-action', !!document.querySelector('input[type="date"]'), { dateInputs: document.querySelectorAll('input[type="date"]').length });
} catch (error) {
  observedErrors.push(`QA_HARNESS_OR_UNEXPECTED_ERROR:${error.stack || error}`); process.exitCode = 2;
} finally {
  await unmount(); dom.window.close();
  const receipt = { source, checkedAt: new Date().toISOString(), hashes, cases, summary: { total: cases.length, pass: cases.filter(item => item.pass).length, fail: cases.filter(item => !item.pass).length }, observedErrors,
    appEdited: false, realServices: false, limits: 'Real page/client ReactDOM, mappers, token signatures, portal session and payment action; cookie/read/store/upload/notification adapters controlled. Linearizable in-memory write queue, NOT Firestore/Next HTTP/native geometry/actual upload or ledger change.',
    discardedCandidate: 'costoTotalEstimado/costoTotalItem are selling subtotal/line total by Presupuesto types; do NOT report them as internal procurement-cost exposure.',
    extraLimits: 'Organization phase only. No final cancellation/date-change operation, contract change, actual 3D, native geometry, external album download or real message was executed. Cover/music save/read adapters controlled; actual action, portal signature, page mapper and React handlers composed.' };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, errors: observedErrors.filter(item => item.startsWith('QA_HARNESS')), failures: cases.filter(item => !item.pass) }));
}
