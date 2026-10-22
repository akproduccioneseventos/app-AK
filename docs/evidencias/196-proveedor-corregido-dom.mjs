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
const target = new URL('196-proveedor-corregido-dom-final.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Do not overwrite an observed receipt');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript');
const { JSDOM } = req('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://qa.invalid/proveedor/acceso/qa183', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'NodeFilter', 'HTMLInputElement', 'MutationObserver', 'CustomEvent', 'Event', 'KeyboardEvent', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
const React = req('react'), { act } = React;
const { createRoot } = req('react-dom/client');
const keyboardReq = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/keyboard161/package.json');
const user = keyboardReq('@testing-library/user-event').default.setup({ document: dom.window.document });
const hashes = {}, modules = new Map(), cases = [], calls = [], toasts = [], rejections = [];
const onRejected = error => rejections.push(error instanceof Error ? error.message : String(error));
process.on('unhandledRejection', onRejected);
let store, mode, app;
const clone = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 40));
const ok = () => ({ success: true, data: clone(store) });
const actions = {
  getProveedorByToken: async token => {
    calls.push(['read', token]);
    if (mode === 'read-throw') throw new Error('QA183: respuesta de transporte rechazada');
    if (mode === 'read-reject') return { success: false, error: 'QA183: acceso revocado' };
    return ok();
  },
  updateProveedorEstado: async (token, state) => { calls.push(['status', token, state]); store.estadoActual = state; return ok(); },
  confirmarLlegada: async token => { calls.push(['arrival', token]); store.estadoActual = 'Llegó'; return ok(); },
  confirmarPartida: async token => { calls.push(['finish', token]); store.estadoActual = 'Completó'; return ok(); },
  toggleTareaProveedor: async (token, id) => {
    calls.push(['task', token, id]);
    store.tareas = store.tareas.map(task => task.id === id ? { ...task, completada: !task.completada } : task);
    return ok();
  },
  addNotaProveedor: async (token, text) => {
    calls.push(['note', token, text]);
    if (mode === 'note-reject') return { success: false, error: 'QA183: no se guardo' };
    if (mode === 'note-throw') throw new Error('QA183: fallo del transporte al guardar');
    store.notas = text;
    return ok();
  },
};
function read(file) {
  const result = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  hashes[file] = crypto.createHash('sha256').update(result.stdout).digest('hex');
  return result.stdout;
}
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  function localRequire(id) {
    if (id === 'next/navigation') return { useParams: () => ({ token: 'qa183' }) };
    if (id === '@/app/actions/provider-portal') return actions;
    if (id === '@/hooks/use-toast') return { useToast: () => ({ toast: item => toasts.push(clone(item)) }) };
    if (id === '@/components/legal/AvisoDeDatos') return { AvisoDeDatos: () => React.createElement('small', null, 'QA legal') };
    if (!id.startsWith('@/') && !id.startsWith('.')) return req(id);
    const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.posix.join(path.posix.dirname(file), id);
    const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
      .find(candidate => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile());
    assert.ok(resolved, `Resolve ${id}`);
    return load(resolved);
  }
  const code = ts.transpileModule(read(file), { fileName: file, compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
  return module.exports;
}
const check = (name, pass, observed) => cases.push({ name, pass: Boolean(pass), observed });
const text = () => document.body.textContent;
const button = label => [...document.querySelectorAll('button')].find(item => item.textContent.trim() === label);
const click = async element => { assert.ok(element); await act(async () => { await user.click(element); await tick(); }); };
const edit = async value => { await act(async () => { await user.clear(document.querySelector('textarea')); await user.type(document.querySelector('textarea'), value); }); };
async function mount() {
  app = createRoot(document.getElementById('app'));
  await act(async () => { app.render(React.createElement(Page)); await tick(); });
}
async function unmount() { if (app) { await act(async () => { app.unmount(); await tick(); }); app = null; } }
const Page = load('src/app/proveedor/acceso/[token]/page.tsx').default;
try {
  store = { id: 'qa183-provider', nombreProveedor: 'Proveedor ficticio QA183', tipoProveedor: 'Fotografia', estadoActual: 'Pendiente',
    horaLlegadaEstimada: '18:00', horaPartidaEstimada: '23:00', notas: '', tareas: [{ id: 'qa183-task', texto: 'Probar equipo ficticio', completada: false }] };
  mode = 'ok'; await mount();
  check('positive-load', text().includes(store.nombreProveedor) && !!button('Confirmar'), text());
  await click(button('Confirmar'));
  check('confirm-consumer-state', store.estadoActual === 'Confirmado' && text().includes('Confirmado') && !button('Confirmar'), { state: store.estadoActual, lastCall: calls.at(-1) });
  await click(button('En camino'));
  check('travel-consumer-state', store.estadoActual === 'En Camino' && !!button('Llegué'), { state: store.estadoActual, lastCall: calls.at(-1) });
  await click(button('Llegué'));
  check('arrival-consumer-state', store.estadoActual === 'Llegó' && !!button('Finalizar'), { state: store.estadoActual, lastCall: calls.at(-1) });
  await click(button('Finalizar'));
  check('finish-consumer-state', store.estadoActual === 'Completó' && !button('Finalizar'), { state: store.estadoActual, lastCall: calls.at(-1) });
  await click(document.querySelector('[role="checkbox"]'));
  check('task-consumer-state', store.tareas[0].completada && text().includes('1/1 completadas'), { task: store.tareas[0], lastCall: calls.at(-1) });
  await edit('  Nota ficticia QA183  '); await click(button('Guardar nota'));
  check('note-consumer-payload', store.notas === 'Nota ficticia QA183' && document.querySelector('textarea').value === store.notas, { note: store.notas, lastCall: calls.at(-1) });
  await unmount(); await mount();
  check('remount-rereads-action-store', text().includes('Completó') && text().includes('1/1 completadas') && document.querySelector('textarea').value === 'Nota ficticia QA183', { state: store.estadoActual, note: document.querySelector('textarea').value });
  mode = 'note-reject'; await edit('No se debe guardar'); const beforeToast = toasts.length; await click(button('Guardar nota'));
  check('note-rejected-no-success-and-enabled', store.notas === 'Nota ficticia QA183' && toasts.length === beforeToast + 1 && toasts.at(-1).variant === 'destructive' && !button('Guardar nota').disabled, { note: store.notas, toast: toasts.at(-1) });
  mode = 'note-throw'; await click(button('Guardar nota'));
  check('note-transport-failure-shown-and-enabled', toasts.at(-1).variant === 'destructive' && !button('Guardar nota').disabled, toasts.at(-1));
  await unmount(); mode = 'read-reject'; await mount();
  check('structured-read-failure-visible', text().includes('Acceso no disponible') && text().includes('QA183: acceso revocado') && !document.querySelector('.animate-spin'), text());
  await unmount(); mode = 'read-throw'; await mount();
  await act(async () => { await tick(); });
  check('transport-read-failure-leaves-loading', !document.querySelector('.animate-spin') && /No pudimos abrir|Acceso no disponible/.test(text()) && rejections.length === 0 && !!button('Reintentar'), { body: text(), spinner: !!document.querySelector('.animate-spin'), unhandled: [...rejections] });
  mode = 'ok'; await click(button('Reintentar'));
  check('transport-retry-recovers-existing-access', !document.querySelector('.animate-spin') && !!button('Guardar nota'), { body: text() });
} finally {
  await unmount(); process.off('unhandledRejection', onRejected); dom.window.close();
  const receipt = { source, environment: 'ReactDOM + real page/UI components in JSDOM; action, token-param and toast adapters controlled; no Next HTTP/real provider/SDK/native geometry',
    hashes, cases, summary: { total: cases.length, passed: cases.filter(item => item.pass).length, failed: cases.filter(item => !item.pass).length },
    calls, toasts, rejections, servicesStarted: false, appChanged: false };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, failures: cases.filter(item => !item.pass) }));
}
