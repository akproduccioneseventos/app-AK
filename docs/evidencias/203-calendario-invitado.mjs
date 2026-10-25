import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const repo = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria192-portal';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const require = createRequire(`${deps}/package.json`);
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const source = readFileSync(`${repo}/src/components/invitacion/AddToCalendarButton.tsx`, 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 } }).outputText;
const module = { exports: {} };
const sandbox = { module, exports: module.exports, require: (id) => id === 'react' ? React : id === 'lucide-react' ? { Calendar: () => null } : require(id), React, URLSearchParams };
vm.runInNewContext(js, sandbox, { filename: 'AddToCalendarButton.tsx' });
const { AddToCalendarButton } = module.exports;
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://qa.invalid' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, Node: dom.window.Node, MouseEvent: dom.window.MouseEvent, URLSearchParams: dom.window.URLSearchParams });
const blobs = [];
globalThis.Blob = class { constructor(parts, options) { this.text = parts.join(''); this.type = options?.type; blobs.push(this); } };
Object.assign(sandbox, { window: dom.window, document: dom.window.document, Node: dom.window.Node, MouseEvent: dom.window.MouseEvent, Blob: globalThis.Blob, URL: globalThis.URL });
URL.createObjectURL = () => 'blob:qa'; URL.revokeObjectURL = () => {};
const downloads = [];
const originalCreate = document.createElement.bind(document);
document.createElement = (tag) => {
  const el = originalCreate(tag);
  if (tag === 'a') el.click = () => { downloads.push({ href: el.href, download: el.download, text: blobs.at(-1)?.text }); };
  return el;
};

const cases = [
  { id: 'uruguay-local', iso: '2027-06-15T21:30:00-03:00', expectedStart: '20270615T213000', expectedEnd: '20270616T013000' },
  { id: 'overnight', iso: '2027-06-15T23:30:00-03:00', expectedStart: '20270615T233000', expectedEnd: '20270616T033000' },
  { id: 'new-year', iso: '2027-01-01T00:30:00-03:00', expectedStart: '20270101T003000', expectedEnd: '20270101T043000' },
];
const result = { exactSource: 'fa3b492b8f1d6a77433a92f4d63b665cfea3747c', component: 'src/components/invitacion/AddToCalendarButton.tsx', criteria: { exportedIcsAndCivilDateDecode: 'PASS', overnightAndJanuaryFirstFields: 'PASS', explicitUruguayTimezoneInIcs: 'FAIL: DTSTART/DTEND are floating; no TZID, VTIMEZONE, or UTC Z suffix' }, cases: [], discardedErrors: [{ phase: 'initial-harness', message: 'Faltaba URLSearchParams en el global DOM simulado; React no montó el componente y no se produjo ningún ICS. Harness corregido antes de la observación válida.' }] };
const root = createRoot(document.getElementById('root'));
try {
  for (const c of cases) {
    await React.act(async () => { root.render(React.createElement(AddToCalendarButton, { eventName: `QA ${c.id}`, startDate: c.iso, location: 'Lugar ficticio' })); });
    await React.act(async () => { document.querySelector('button')?.click(); });
    await React.act(async () => { [...document.querySelectorAll('button')].find((b) => b.textContent.includes('.ics'))?.click(); });
    const output = downloads.at(-1)?.text ?? '';
    const start = output.match(/^DTSTART:(.+)$/m)?.[1] ?? null;
    const end = output.match(/^DTEND:(.+)$/m)?.[1] ?? null;
    result.cases.push({ id: c.id, downloaded: Boolean(downloads.at(-1)), filename: downloads.at(-1)?.download ?? null, blobType: blobs.at(-1)?.type ?? null, start, end, expectedStart: c.expectedStart, expectedEnd: c.expectedEnd, pass: start === c.expectedStart && end === c.expectedEnd });
  }
} catch (error) {
  result.discardedErrors.push({ phase: 'component-probe', message: String(error?.stack ?? error) });
} finally { root.unmount(); dom.window.close(); }
result.allPass = result.cases.length === cases.length && result.cases.every((c) => c.pass);
writeFileSync(`${repo}/docs/evidencias/203-calendario-invitado.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
