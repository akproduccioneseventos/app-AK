// Audit only: real source functions, fake event and persistence; no network or messages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../..');
const results = [];
function find(file, predicate) {
  const tree = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  let match;
  function visit(node) { if (!match && predicate(node)) match = node; if (!match) ts.forEachChild(node, visit); }
  visit(tree); assert.ok(match, `Missing target in ${file}`); return match.getText(tree);
}
const fn = (file, name) => find(file, n => ts.isFunctionDeclaration(n) && n.name?.text === name);
function evaluate(source, mocks = {}) {
  const context = { exports: {}, console, ...mocks };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, context, { timeout: 2000 });
  return context.exports;
}
async function probe(id, callback) {
  try { await callback(); results.push({ id, status: 'PASS' }); }
  catch (error) { results.push({ id, status: 'FAIL', reason: error.message }); }
}
const fixture = {
  id: 'audit-only', configuracion: { nombreEvento: 'TEST ONLY' },
  clientPortalSettings: { enabled: true, accessKey: 'FAKE-SECRET' },
  clientChecklist: [{ id: 'task-test', completada: false }],
  programa: [{ id: 'private', hora: '18:00', titulo: 'PRIVATE TEST', descripcion: 'INTERNAL TEST NOTE', visibleParaCliente: false }],
};
(async () => {
  const actionsFile = 'src/app/actions/fiesta/portal.actions.ts';
  let notices = 0;
  const actions = evaluate(['updateFiestaData', 'updateClientChecklistItem'].map(name => fn(actionsFile, name)).join('\n'), {
    verifyPortalSession: async () => true, getFiestaById: async () => fixture,
    saveFiesta: async () => ({ success: false, error: 'Injected audit failure' }),
    createNotification: async () => { notices++; }, sanitizeActionError: error => error.message,
  });
  const response = await actions.updateClientChecklistItem('audit-only', 'task-test', true);
  await probe('PORTAL-01a failed save must reach client as failure', () => assert.equal(response.success, false));
  await probe('PORTAL-01b failed save must not notify organizer of completed task', () => assert.equal(notices, 0));
  const mapperFile = 'src/lib/client-portal/public-fiesta.ts';
  const mapperNames = ['mapDocument', 'mapGuest', 'mapFiestaToClientPortal'];
  if (fs.readFileSync(path.join(root, mapperFile), 'utf8').includes('function mapProgramaParaElCliente')) {
    mapperNames.unshift('mapProgramaParaElCliente');
  }
  const mapper = evaluate(mapperNames.map(name => fn(mapperFile, name)).join('\n'));
  const projected = mapper.mapFiestaToClientPortal(fixture);
  await probe('PORTAL-02a server projection must remove internal itinerary', () => {
    assert.ok(!JSON.stringify(projected).includes('INTERNAL TEST NOTE'), 'Client DTO contains explicitly private itinerary');
  });
  await probe('PRESERVE existing access-key redaction', () => {
    assert.ok(!JSON.stringify(projected).includes('FAKE-SECRET'));
  });
  const viewFile = 'src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx';
  const declaration = find(viewFile, n => ts.isVariableDeclaration(n) && n.name?.getText() === 'programaItems');
  const view = evaluate('const ' + declaration + '; exports.items = programaItems;', { fiesta: projected });
  await probe('PORTAL-02b active client view must exclude hidden itinerary', () => {
    assert.equal(view.items.length, 0, 'Hidden item reaches the array rendered by the active client view');
  });
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.some(r => r.status === 'FAIL') ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 2; });
