import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const target = new URL('161-galeria-video-retest.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve historical receipt');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript');
const { JSDOM } = req('jsdom');
const dom = new JSDOM('<!doctype html><html><body><button id="before">Antes</button><div id="app"></div><button id="after">Despues</button><div id="control"></div></body></html>',
  { url: 'https://qa.invalid/', pretendToBeVisual: true });
for (const key of ['window','document','navigator','HTMLElement','SVGElement','Element','Node','NodeFilter','HTMLInputElement','MutationObserver','CustomEvent','Event','KeyboardEvent','getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
dom.window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
const React = req('react'), { act } = React;
const { createRoot } = req('react-dom/client');
const keyboardReq = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/keyboard161/package.json');
const userEvent = keyboardReq('@testing-library/user-event').default.setup({ document: dom.window.document });
const hashes = {}, cache = new Map(), cases = [];
const read = file => {
  const p = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex'); return p.stdout;
};
const load = file => {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const localRequire = id => {
    if (id === '@/app/actions/videos-de-ayuda') return { getVideosDeAyuda: async () => [] };
    if (!id.startsWith('@/') && !id.startsWith('.')) return req(id);
    const base = id.startsWith('@/') ? 'src/' + id.slice(2) : path.posix.join(path.posix.dirname(file), id);
    const resolved = [base,base + '.ts',base + '.tsx',base + '/index.ts',base + '/index.tsx']
      .find(f => fs.existsSync(path.join(root, f)) && fs.statSync(path.join(root, f)).isFile());
    assert.ok(resolved, `Resolve ${id} from ${file}`); return load(resolved);
  };
  const code = ts.transpileModule(read(file), { fileName: file, compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
  return module.exports;
};
const tick = () => new Promise(resolve => setTimeout(resolve, 35));
const check = (name, pass, observed) => cases.push({ name, pass: Boolean(pass), observed });
const click = async element => { assert.ok(element); await act(async () => { element.click(); await tick(); }); };
const key = async value => { await act(async () => {
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true })); await tick();
}); };
const tab = async shift => { await act(async () => { await userEvent.tab({ shift }); await tick(); }); };
let app, control;
try {
  const radix = req('@radix-ui/react-dialog');
  control = createRoot(document.getElementById('control'));
  await act(async () => { control.render(React.createElement(radix.Root, null,
    React.createElement(radix.Trigger, { id: 'control-trigger' }, 'Control'),
    React.createElement(radix.Content, { 'data-control-dialog': true },
      React.createElement(radix.Title, null, 'Control ficticio'),
      React.createElement(radix.Description, null, 'Sin datos reales'),
      React.createElement('button', { id: 'control-first' }, 'Primero'), React.createElement('button', { id: 'control-last' }, 'Ultimo')))); await tick(); });
  const ct = document.getElementById('control-trigger'); ct.focus(); await click(ct);
  check('positive-control-autofocus', document.querySelector('[data-control-dialog]')?.contains(document.activeElement), document.activeElement?.id);
  document.getElementById('control-last').focus(); await tab(false);
  check('positive-control-tab-stays-inside', document.querySelector('[data-control-dialog]')?.contains(document.activeElement), document.activeElement?.id);
  await act(async () => { control.unmount(); await tick(); }); control = null;

  const { GallerySection } = load('src/components/landing/GallerySection.tsx');
  app = createRoot(document.getElementById('app'));
  const images = ['a','b','c'].map(id => ({ id: `qa161-${id}`, src: `https://qa.invalid/qa161-${id}.jpg`,
    alt: `Evento ficticio QA161${id}`, hint: 'eventos', category: 'Eventos', titulo: `Evento QA161${id}` }));
  await act(async () => { app.render(React.createElement(GallerySection, { images })); await tick(); });
  const trigger = document.querySelector('button[aria-label^="Abrir foto:"]'); trigger.focus(); await click(trigger);
  const dialog = () => document.querySelector('[role="dialog"]');
  const picture = () => dialog()?.querySelector('img')?.getAttribute('src');
  check('gallery-opens', picture()?.includes('qa161-a.jpg'), picture());
  check('gallery-autofocus-enters', dialog()?.contains(document.activeElement), document.activeElement?.getAttribute('aria-label'));
  await key('ArrowRight'); check('gallery-next', picture()?.includes('qa161-b.jpg'), picture());
  await key('ArrowLeft'); check('gallery-previous', picture()?.includes('qa161-a.jpg'), picture());
  await key('ArrowLeft'); check('gallery-wraps', picture()?.includes('qa161-c.jpg'), picture());
  const controls = [...dialog().querySelectorAll('button')]; controls.at(-1).focus(); await tab(false);
  check('gallery-forward-tab-stays-inside', dialog()?.contains(document.activeElement), { tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label'), id: document.activeElement?.id });
  controls[0].focus(); await tab(true);
  check('gallery-backward-tab-stays-inside', dialog()?.contains(document.activeElement), { tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label'), id: document.activeElement?.id });
  controls[0].focus(); await key('Escape');
  check('gallery-escape-closes', !dialog(), null);
  check('gallery-return-to-trigger', document.activeElement === trigger, document.activeElement?.getAttribute('aria-label'));
  await click(trigger); await click(dialog().querySelector('button[aria-label="Cerrar galería"]'));
  check('gallery-close-button-returns-focus', document.activeElement === trigger, document.activeElement?.getAttribute('aria-label'));
  await act(async () => { app.unmount(); await tick(); }); app = null;

  const { VideoDeAyuda } = load('src/components/ayuda/VideoDeAyuda.tsx');
  app = createRoot(document.getElementById('app'));
  await act(async () => { app.render(React.createElement(VideoDeAyuda, { lugar: 'simulador', initialVideo: { lugar: 'simulador', videoId: 'QA161', titulo: 'Ayuda ficticia' } })); await tick(); });
  const videoTrigger = document.querySelector('button[aria-label^="¿Cómo se usa?"]'); videoTrigger.focus(); await click(videoTrigger);
  check('video-autofocus-enters', dialog()?.contains(document.activeElement), document.activeElement?.getAttribute('aria-label'));
  await act(async () => { window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tick(); });
  check('video-escape-closes', !dialog(), null);
  check('video-return-to-trigger', document.activeElement === videoTrigger, document.activeElement?.getAttribute('aria-label'));
} finally {
  await act(async () => { if (app) app.unmount(); if (control) control.unmount(); await tick(); }); dom.window.close();
}
assert.ok(cases.filter(c => c.name.startsWith('positive-control')).every(c => c.pass), 'Invalid DOM keyboard harness');
const result = { source, testSha256: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), hashes, cases,
  summary: { total: cases.length, pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual GallerySection/VideoDeAyuda React components, real framer-motion/NextImage/Radix; user-event Tab/Shift+Tab DOM with positive trap control',
  limits: ['Not native browser keyboard or assistive technology; no image/YouTube network, no mobile visual acceptance',
    'Video action returns empty fictitious catalog; initialVideo supplied, no real fetch', 'Public Claude candidate108e, not main9b7 or deployment'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: result.summary, failed: cases.filter(c => !c.pass) }));
if (result.summary.fail) process.exitCode = 1;
