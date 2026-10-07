const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const sha = '09051f80ee7722537a06c50c8eb7524b21ac11e8';
const pagePath = 'src/app/(app)/presupuestos/[id]/ver/page.tsx';
const settingsPath = 'src/app/actions/settings.ts';
const read = file => execFileSync('git', ['show', `${sha}:${file}`], { cwd: root }).toString('utf8');
const parse = file => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const page = parse(pagePath);
const settings = parse(settingsPath);
let fetchCallback;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(page) === 'fetchPresupuestoAndSettings') {
    assert(ts.isCallExpression(node.initializer));
    fetchCallback = node.initializer.arguments[0].getText(page);
  }
  ts.forEachChild(node, visit);
}
visit(page);
const companyFunction = settings.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'getCompanyInfo');
assert(companyFunction && fetchCallback);
const observed = { budgetAssigned: false, privateGateCalls: 0, companyReadCalls: 0, error: null };
const exportsObject = {};
const budgetId = 'pres_public_b38acb198fcbf8483be6747b';
const pdfToken = '5378ed006c029412fb4159a6380f0e6fa377c6786104694438f872b9d3037bc0';
assert.equal(crypto.createHmac('sha256', 'playwright-session-secret-with-enough-entropy').update(`budget-token:${budgetId}`).digest('hex'), pdfToken);
const noCall = name => () => { throw new Error(`Unexpected call ${name}`); };
vm.runInNewContext(ts.transpileModule(`${companyFunction.getText(settings)}\nexports.run = ${fetchCallback};`,
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
  exports: exportsObject, Promise, presupuestoId: budgetId, publicToken: pdfToken,
  requireAppSession: async () => { observed.privateGateCalls++; throw new Error('Sesion no autorizada.'); },
  leerCompanyInfo: async () => { observed.companyReadCalls++; return {}; },
  getPresupuestoById: async () => ({ id: budgetId, estado: 'Pendiente Verificacion' }),
  getBudgetDisplaySettings: async () => ({}), getInvoiceTemplateSettings: async () => ({}),
  getSocialConnectionsPublicas: async () => [],
  setIsLoading() {}, setDisplaySettings() {}, setCompanyInfo() {}, setLogoUrl() {}, setWhatsappNumber() {},
  setPresupuesto: () => { observed.budgetAssigned = true; },
  setError: value => { observed.error = value; },
  getCustomerById: noCall('customer'), setCliente: noCall('setCliente'),
  getFiestas: noCall('fiestas'), setLinkedFiestaId: noCall('setLinkedFiestaId'),
});
exportsObject.run().then(() => {
  assert.equal(observed.privateGateCalls, 1);
  assert.equal(observed.companyReadCalls, 0);
  assert.equal(observed.budgetAssigned, false);
  assert.equal(observed.error, 'Sesion no autorizada.');
  const result = { meaning: 'Passing assertions reproduce a public consumer calling a private function; not acceptance.',
    sourceCommit: sha, observed, tokenCorrectForIsolatedSecret: true,
    sourceHashes: Object.fromEntries([pagePath, settingsPath].map(file => [file, crypto.createHash('sha256').update(read(file)).digest('hex')])),
    simulated: ['session absence', 'budget/settings readers', 'React state setters'],
    actual: ['getCompanyInfo function', 'fetchPresupuestoAndSettings callback'],
    limitation: 'No Firebase or production token validation. UI separately reproduced on compiled f790a002.' };
  fs.writeFileSync(path.join(__dirname, '78-resultados/enlace-publico.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}).catch(error => { console.error(error); process.exitCode = 1; });
