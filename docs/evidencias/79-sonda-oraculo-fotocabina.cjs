const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const ts = require('typescript');
const { expect } = require('@playwright/test');

const file = 'tests/e2e/fotocabina-de-punta-a-punta.spec.ts';
const raw = fs.readFileSync(file, 'utf8');
const tree = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true);
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(tree) === 'test' && node.arguments.length === 2) {
    callback = node.arguments[1];
  }
  ts.forEachChild(node, visit);
}
visit(tree);
if (!callback || !ts.isArrowFunction(callback)) throw new Error('No se encontro el callback real.');
const printed = ts.createPrinter().printNode(ts.EmitHint.Expression, callback, tree);
const js = ts.transpileModule(`(${printed})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

async function run(text) {
  const events = [];
  const locator = {
    innerText: async () => text,
    and() { return this; },
    first() { return this; },
    count: async () => 1,
    click: async () => { events.push('clic sin captura ni resultado'); },
  };
  const page = {
    addInitScript: async () => {},
    on: () => {},
    goto: async () => ({ status: () => 200 }),
    waitForTimeout: async (ms) => { events.push(`espera sustituida: ${ms}`); },
    screenshot: async () => { events.push('captura de pantalla simulada'); },
    locator: () => locator,
    getByRole: () => locator,
    evaluate: async () => true,
  };
  const test = { setTimeout: () => {}, skip: (condition) => { if (condition) throw new Error('Saltada'); } };
  const fn = vm.runInNewContext(js, {
    test, expect, fs: { mkdirSync() {}, writeFileSync() {} }, ID: 'e2e_oraculo_79',
    crearCookieDeSesion: () => 'sesion-ficticia', crearPermisoDeEstacion: () => 'permiso-ficticio',
    enchufarCamara: async () => {},
  });
  try {
    await fn({ page, context: { addCookies: async () => {} } }, { project: { name: 'chromium-desktop', use: { baseURL: 'http://127.0.0.1:3300' } } });
    return { accepted: true, events, photosCaptured: 0, stripGenerated: false, uploadOrDelivery: false };
  } catch (error) {
    return { accepted: false, error: error.message, events };
  }
}

(async () => {
  const sourceCommit = cp.execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
  const committed = cp.execFileSync('git', ['show', `${sourceCommit}:${file}`], { encoding: 'utf8' });
  if (committed.replace(/\r\n/g, '\n') !== raw.replace(/\r\n/g, '\n')) throw new Error('El test local no coincide con el SHA de contraste.');
  const sourceBlob = cp.execFileSync('git', ['rev-parse', `${sourceCommit}:${file}`], { encoding: 'utf8' }).trim();
  const noResult = await run('Fotocabina. Sacar foto.');
  const visibleError = await run('Algo sali\u00f3 mal');
  if (!noResult.accepted || visibleError.accepted) throw new Error('La sonda no reprodujo el falso positivo/control.');
  const result = {
    sourceCommit, sourceBlob, file, hash: crypto.createHash('sha256').update(raw).digest('hex'),
    scope: 'Callback y assertions reales; navegador, camara, espera, cookies y filesystem simulados. NO es E2E ni defecto demostrado de la app.',
    noResult, visibleError,
  };
  const output = path.join(__dirname, '79-resultados', 'oraculo-fotocabina.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
