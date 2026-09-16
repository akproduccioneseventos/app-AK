// Audit only: actual action chain; fake authentication boundaries and in-memory IO.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(process.argv[3] || path.join(__dirname, '../..'));
const base = 'src/app/actions/fiesta/';
const editor = 'src/app/(app)/fiestas/nueva/decoracion/page.tsx';
const results = [];
function extract(file, name, kind) {
  const tree = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  let found;
  function visit(n) {
    if (!found && kind(n) && n.name?.getText(tree) === name) found = n;
    if (!found) ts.forEachChild(n, visit);
  }
  visit(tree); assert.ok(found, `Missing ${file}:${name}`); return found.getText(tree);
}
const fn = (file, name) => extract(file, name, ts.isFunctionDeclaration);
const variable = name => extract(editor, name, ts.isVariableDeclaration);
function evaluate(code, mocks) {
  const context = { exports: {}, console, ...mocks };
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, context, { timeout: 2000 });
  return context.exports;
}
const clone = x => JSON.parse(JSON.stringify(x));
function fixture(role) {
  let data = { id: 'audit-only', decoracion: { tema: 'Original', itemsDecoracion: [] }, gestionCostos: { costosItems: [] } };
  let writes = 0;
  const code = fn(base + 'fiesta.actions.ts', 'requireFiestaWriteAccess') + '\n'
    + fn(base + 'fiesta.actions.ts', 'updateFiestaPartial') + '\n'
    + fn(base + 'costos.actions.ts', 'updateGestionCostos') + '\n'
    + ['updateDecoracion', 'syncDecoGastosToModule', 'enviarOpinionDecoracion']
      .map(name => fn(base + 'decoracion.actions.ts', name)).join('\n');
  const api = evaluate(code, {
    path, FIESTAS_DIR: 'fiestas', validatePersonalAssignments: () => null,
    getFiestaById: async () => clone(data),
    hasAppSession: async () => role === 'employee',
    verifyPortalSession: async id => id === data.id && role === 'client',
    requireAppSession: async () => { if (role !== 'employee') throw new Error('Employee session required'); },
    updateDataPartial: async (_file, partial) => { writes++; data = { ...data, ...clone(partial) }; },
  });
  return { api, read: () => clone(data), writes: () => writes };
}
async function probe(id, run) {
  try { const detail = await run(); results.push({ id, status: 'PASS', detail }); }
  catch (e) { results.push({ id, status: 'FAIL', reason: e.message }); }
}
(async () => {
  await probe('DECO-14 authorized portal feedback must not require employee session', async () => {
    const f = fixture('client');
    const result = await f.api.enviarOpinionDecoracion('audit-only', true);
    assert.equal(result.success, true, JSON.stringify({ result, persisted: f.read().decoracion.opinionCliente, writes: f.writes() }));
  });
  await probe('PRESERVE employee feedback chain succeeds', async () => {
    const f = fixture('employee');
    assert.equal((await f.api.enviarOpinionDecoracion('audit-only', true)).success, true);
    assert.equal(f.read().decoracion.opinionCliente.leGusta, true);
  });
  await probe('PRESERVE unauthorized event write remains rejected', async () => {
    const f = fixture('unauthorized');
    assert.equal((await f.api.enviarOpinionDecoracion('audit-only', true)).success, false);
    assert.equal(f.writes(), 0);
  });
  await probe('DECO-15 old save completion must not clear a newer unsaved edit', async () => {
    let complete;
    let dirty = true;
    let liveElements = [{ id: 'table', x: 10 }];
    let submitted;
    const api = evaluate('const ' + variable('saveCanvas') + '; exports.save = saveCanvas;', {
      useCallback: cb => cb, fiestaId: 'audit-only', decoracionData: {}, zonasDiseno: [],
      canvasElementos: liveElements, canvasFondoColor: '#ffffff', canvasFondoImagenUrl: '',
      setIsSavingCanvas: () => {}, setIsAutoSaving: () => {}, setAutoSaveError: () => {}, toast: () => {},
      setCanvasHasChanges: value => { dirty = value; },
      updateDecoracionFiestaActual: async (_id, data) => {
        submitted = clone(data.vistaDecorativa.elementos);
        return new Promise(resolve => { complete = resolve; });
      },
    });
    const pending = api.save(true);
    // The editor has received another change while the older snapshot is in flight.
    liveElements = [{ id: 'table', x: 90 }];
    dirty = true;
    complete({ success: true });
    await pending;
    assert.notDeepEqual(submitted, liveElements, 'Fixture must contain a genuinely newer design');
    assert.equal(dirty, true, 'Older snapshot marks a newer edit clean; autosave effect can cancel its pending timer');
  });
  let state = { estiloDecoracion: 'old', opinionCliente: { leGusta: true, fecha: '2026-09-01' } };
  const style = evaluate('const ' + variable('handleSelectEstilo') + '; exports.select = handleSelectEstilo;', {
    ESTILOS_DECORACION: [{ id: 'new', label: 'Different style', colors: { primary: '#123456' } }],
    setDecoracionData: update => { state = update(state); },
  });
  style.select('new');
  results.push({ id: 'PRODUCT-01 feedback remains after style change', status: 'OBSERVED',
    detail: { style: state.estiloDecoracion, opinion: state.opinionCliente, decision: 'Owner approval needed before changing feedback/version workflow' } });
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.some(r => r.status === 'FAIL') ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 2; });

