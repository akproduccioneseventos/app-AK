import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const target = new URL('155-galeria-teclado.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Do not overwrite a result');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript');
const { JSDOM } = req('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div><div id="control"></div></body></html>',
  { url: 'https://qa.invalid/', pretendToBeVisual: true });
for (const key of ['window','document','navigator','HTMLElement','SVGElement','Element','Node','NodeFilter','HTMLInputElement','MutationObserver','CustomEvent','Event','KeyboardEvent','getComputedStyle']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
dom.window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
const React = req('react');
const { act } = React;
const { createRoot } = req('react-dom/client');
const hashes = {}, cache = new Map();
const read = file => {
  const p = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex');
  return p.stdout;
};
const load = file => {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const localRequire = id => {
    if (!id.startsWith('@/') && !id.startsWith('.')) return req(id);
    const base = id.startsWith('@/') ? 'src/' + id.slice(2) : path.posix.join(path.posix.dirname(file), id);
    const resolved = [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx']
      .find(f => fs.existsSync(path.join(root, f)) && fs.statSync(path.join(root, f)).isFile());
    assert.ok(resolved, `Resolve ${id} from ${file}`); return load(resolved);
  };
  const code = ts.transpileModule(read(file), { fileName: file, compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
  return module.exports;
};
const cases = [];
const check = (name, pass, observed) => cases.push({ name, pass: Boolean(pass), observed });
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
const click = async element => { assert.ok(element); await act(async () => { element.click(); await tick(); }); };
const key = async value => { await act(async () => {
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true })); await tick();
}); };
let app, control;
try {
  // Raw Radix is the positive control; app Dialog intentionally cancels autofocus.
  const radix = req('@radix-ui/react-dialog');
  const ui = { Dialog: radix.Root, DialogTrigger: radix.Trigger, DialogContent: radix.Content,
    DialogTitle: radix.Title, DialogDescription: radix.Description };
  control = createRoot(document.getElementById('control'));
  await act(async () => { control.render(React.createElement(ui.Dialog, null,
    React.createElement(ui.DialogTrigger, { 'data-control-trigger': true }, 'Abrir control'),
    React.createElement(ui.DialogContent, { 'data-control-dialog': true },
      React.createElement(ui.DialogTitle, null, 'Control ficticio'),
      React.createElement(ui.DialogDescription, null, 'Sin datos reales'),
      React.createElement('button', { 'data-control-inner': true }, 'Interior')))); await tick(); });
  const controlTrigger = document.querySelector('[data-control-trigger]'); controlTrigger.focus();
  await click(controlTrigger);
  const controlDialog = document.querySelector('[data-control-dialog]');
  check('positive-control-initial-focus', controlDialog?.contains(document.activeElement), document.activeElement?.outerHTML);
  await act(async () => { control.unmount(); await tick(); }); control = null;

  const { GallerySection } = load('src/components/landing/GallerySection.tsx');
  app = createRoot(document.getElementById('app'));
  const images = ['a','b','c'].map(id => ({ id: `qa155-${id}`, src: `https://qa.invalid/qa155-${id}.jpg`,
    alt: `Evento ficticio QA155${id}`, hint: 'eventos', category: 'Eventos', titulo: `Evento QA155${id}` }));
  await act(async () => { app.render(React.createElement(GallerySection, { images })); await tick(); });
  const trigger = document.querySelector('button[aria-label^="Abrir foto:"]'); assert.ok(trigger);
  trigger.focus(); await click(trigger);
  const dialog = () => document.querySelector('[role="dialog"]');
  const picture = () => dialog()?.querySelector('img')?.getAttribute('src');
  check('open-real-gallery', Boolean(dialog()) && picture()?.includes('qa155-a.jpg'), { picture: picture() });
  check('gallery-initial-focus-inside', dialog()?.contains(document.activeElement), document.activeElement?.outerHTML);
  await key('ArrowRight'); check('arrow-right-next-photo', picture()?.includes('qa155-b.jpg'), { picture: picture() });
  await key('ArrowLeft'); check('arrow-left-previous-photo', picture()?.includes('qa155-a.jpg'), { picture: picture() });
  await key('ArrowLeft'); check('arrow-left-wraps', picture()?.includes('qa155-c.jpg'), { picture: picture() });
  const close = dialog()?.querySelector('button[aria-label="Cerrar galería"]'); assert.ok(close); close.focus();
  check('focus-can-enter-close-button', document.activeElement === close, document.activeElement?.outerHTML);
  await key('Escape'); check('escape-closes-gallery', !dialog(), { remainingDialogs: document.querySelectorAll('[role="dialog"]').length });
  check('gallery-restores-trigger-focus', document.activeElement === trigger, { activeTag: document.activeElement?.tagName, activeLabel: document.activeElement?.getAttribute('aria-label') });
} finally {
  await act(async () => { if (app) app.unmount(); if (control) control.unmount(); await tick(); });
  dom.window.close();
}
assert.equal(cases.find(c => c.name === 'positive-control-initial-focus')?.pass, true, 'Invalid DOM focus harness');
const result = { source, hashes, cases, summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual GallerySection, framer-motion, next/image and raw Radix positive control rendered with React in jsdom; synthetic images and document keyboard events',
  limits: ['Not native browser/Tab traversal, actual screen-reader or visual QA', 'No network image loading, production data, provider calls or app edits', 'Two failed focus assertions can be one modal-focus defect, not two bugs'],
  browserAttempt: 'In-app browser createTab navigation timeout, then Page.getFrameTree timeout; not classified as app failure', appEdited: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, cases: cases.map(({ name, pass }) => ({ name, pass })), summary: result.summary }));
if (result.summary.fail) process.exitCode = 1;
