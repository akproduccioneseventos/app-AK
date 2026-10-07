// Exact Git modules and actual page callbacks, with read-only synthetic settings.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const sha = process.argv[2] || '9bb955ac6af65a314f3ac62975020b37c9edaaf3';
const source = file => execFileSync('git', ['show', `${sha}:${file}`], { cwd: root, encoding: 'utf8' });
const compile = code => ts.transpileModule(code, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
} }).outputText;
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(compile(source(file)), {
    exports, setTimeout, clearTimeout, URL, encodeURIComponent,
    require(name) {
      if (name in dependencies) return dependencies[name];
      if (name.startsWith('@/data/') && name.endsWith('.json')) return JSON.parse(source(`src/${name.slice(2)}`));
      if (['@/types/armado-rapido', '@/types/settings'].includes(name)) return load(`src/${name.slice(2)}.ts`);
      throw new Error(`Unexpected runtime dependency: ${name}`);
    },
  }, { filename: file });
  return exports;
}
const pageSource = source('src/app/simulador-de-presupuesto/page.tsx');
const page = ts.createSourceFile('page.tsx', pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function arrow(name) {
  let initializer;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) initializer = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(page);
  if (!initializer || !ts.isArrowFunction(initializer)) throw new Error(`Missing actual callback: ${name}`);
  return initializer.getText(page);
}
const { toWhatsAppNumber } = load('src/lib/commercial/contact.ts');
const { AK_WHATSAPP_NUMBER } = load('src/lib/public-contact.ts');
async function scenario(label, connections, expected) {
  const bootstrap = load('src/app/actions/public-simulator-bootstrap.ts', {
    '@/app/actions/armado-rapido': { getArmadoRapidoConfig: async () => null },
    '@/app/actions/menus-catering': { getMenusPublicos: async () => [] },
    '@/app/actions/servicios-empresa': { getServiciosEmpresaPublicos: async () => [] },
    '@/app/actions/settings': { getBudgetDisplaySettings: async () => null, getInvoiceTemplateSettings: async () => null },
    '@/app/actions/social-connections': { getSocialConnectionsPublicas: connections },
  });
  const config = await bootstrap.getPublicSimulatorBootstrap();
  const opened = [];
  const callbacks = {};
  vm.runInNewContext(compile(`
    const formatCurrency = ${arrow('formatCurrency')};
    exports.consult = ${arrow('handleWhatsAppQuickConsult')};
    exports.share = ${arrow('handleShareBudgetWhatsApp')};
  `), {
    exports: callbacks, whatsappNumber: config.whatsappNumber, toWhatsAppNumber,
    clienteNombre: 'Synthetic prospect', eventoTipo: 'Boda', eventoFecha: new Date('2027-10-07T15:00:00Z'),
    generatedPresupuestoId: 'synthetic-no-record', generatedToken: 'synthetic-not-a-secret',
    stats: { totalFinal: 100000, precioPorPersona: 1000 }, bookingDepositLabel: '5000',
    Intl, Date, encodeURIComponent,
    window: { location: { origin: 'https://example.invalid' }, open: url => opened.push(url) },
  });
  callbacks.consult();
  callbacks.share();
  assert.equal(opened.length, 2);
  for (const url of opened) assert.equal(new URL(url).pathname, `/${expected}`);
  console.log(JSON.stringify({ id: 'CONTACT75', sha, scenario: label,
    returnedPhone: config.whatsappNumber, recipient: expected,
    differsFromCanonical: expected !== AK_WHATSAPP_NUMBER,
    consumersExecuted: ['handleWhatsAppQuickConsult', 'handleShareBudgetWhatsApp'],
    networkOrProductionWrites: false,
  }));
}
(async () => {
  await scenario('no connected WhatsApp', async () => [], '59899123456');
  await scenario('settings lookup fails', async () => { throw new Error('Synthetic lookup failure'); }, '59899123456');
  await scenario('settings lookup never settles: real 4.5s fallback', async () => new Promise(() => {}), '59899123456');
  await scenario('control: official configured number', async () => [{ platform: 'WhatsApp', isConnected: true, phoneNumber: AK_WHATSAPP_NUMBER }], AK_WHATSAPP_NUMBER);
})().catch(error => { console.error(error); process.exitCode = 1; });
