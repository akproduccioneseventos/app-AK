// Audit only: extract actual functions, replace persistence, never access real events.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../..');
const base = 'src/app/actions/fiesta/';
const results = [];
function source(file, names) {
  const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  return names.map(name => {
    const node = ast.statements.find(n => n.name?.text === name);
    assert.ok(node, `Missing ${file}:${name}`);
    return node.getText(ast);
  }).join('\n');
}
function api(file, names, mocks) {
  const context = { exports: {}, console, ...mocks };
  vm.runInNewContext(ts.transpileModule(source(file, names), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context, { timeout: 2000 });
  return context.exports;
}
const clone = value => JSON.parse(JSON.stringify(value));
function memory() {
  let data = { id: 'audit-only', tareas: [], estadosCompra: [], configuracion: {}, decoracion: { moodboardItems: [] } };
  const writes = [];
  return {
    get: () => clone(data), writes,
    mocks: {
      requireAppSession: async () => {},
      getFiestaById: async () => clone(data),
      saveFiesta: async value => { data = clone(value); writes.push(clone(value)); return { success: true, fiesta: clone(value) }; },
    },
  };
}
async function probe(id, run) {
  try { await run(); results.push({ id, status: 'PASS' }); }
  catch (error) { results.push({ id, status: 'FAIL', reason: error.message }); }
}
(async () => {
  await probe('PLAN-01 tasks must report failed persistence', async () => {
    const store = memory();
    const tasks = api(base + 'tareas.actions.ts', ['updateFiestaData', 'updateTareas'], {
      ...store.mocks, saveFiesta: async () => ({ success: false, error: 'Audit injected failure' }),
    });
    assert.equal((await tasks.updateTareas('audit-only', [{ id: 't1' }])).success, false);
  });
  await probe('PLAN-02 supplier payment task survives shopping status save', async () => {
    const store = memory();
    const tasks = api(base + 'tareas.actions.ts', ['updateFiestaData', 'addTarea'], store.mocks);
    const catering = api(base + 'catering.actions.ts', ['updateShoppingListStatus'], {
      ...store.mocks, addTareaToFiestaActual: tasks.addTarea,
    });
    const result = await catering.updateShoppingListStatus('audit-only', [{ proveedor: 'TEST ONLY', pedido: true, pagado: false }]);
    assert.equal(result.success, true);
    assert.equal(store.writes[0].tareas.length, 1, 'Task should first be created');
    assert.equal(store.get().tareas.length, 1, 'Final save erased newly created task');
  });
  await probe('PLAN-03 concurrent task and menu saves preserve both changes', async () => {
    const store = memory();
    const tasks = api(base + 'tareas.actions.ts', ['updateFiestaData', 'updateTareas'], store.mocks);
    const catering = api(base + 'catering.actions.ts', ['updateMenuAsignado'], store.mocks);
    await Promise.all([tasks.updateTareas('audit-only', [{ id: 't1' }]), catering.updateMenuAsignado('audit-only', 'menu-test')]);
    assert.equal(store.get().menuAsignadoId, 'menu-test');
    assert.equal(store.get().tareas.length, 1, 'Menu save overwrote simultaneous task change');
  });
  await probe('PLAN-04 moodboard deletion must report failed save', async () => {
    const store = memory();
    const deco = api(base + 'decoracion.actions.ts', ['deleteMoodboardItem'], {
      ...store.mocks, updateDecoracion: async () => ({ success: false, error: 'Audit injected failure' }),
    });
    assert.equal((await deco.deleteMoodboardItem('audit-only', 'photo-test')).success, false);
  });
  await probe('PLAN-05 removing last decoration item must synchronize empty costs', async () => {
    const store = memory();
    let synced = false;
    const deco = api(base + 'decoracion.actions.ts', ['updateDecoracion'], {
      ...store.mocks, syncDecoGastosToModule: async () => { synced = true; return { success: true }; },
    });
    assert.equal((await deco.updateDecoracion('audit-only', { itemsDecoracion: [] })).success, true);
    assert.equal(synced, true, 'Empty list never reaches cost synchronization');
  });
  await probe('PLAN-06 manual decoration cost sync must report failed persistence', async () => {
    const store = memory();
    const deco = api(base + 'decoracion.actions.ts', ['syncDecoGastosToModule'], {
      ...store.mocks, updateGestionCostos: async () => ({ success: false, error: 'Audit injected failure' }),
    });
    assert.equal((await deco.syncDecoGastosToModule('audit-only', [])).success, false);
  });
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.some(result => result.status === 'FAIL') ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 2; });
