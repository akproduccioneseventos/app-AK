// Read-only audit. Actual AST functions with mocked IO/React; no GPU, AI call or real data.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../..');
const results = [];
const action = 'src/app/actions/fiesta/decoracion.actions.ts';
const layout = 'src/app/(app)/fiestas/nueva/invitados/layout/page.tsx';
function ast(file) { return ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true); }
function find(file, predicate) {
  const tree = ast(file);
  let found;
  function visit(node) { if (!found && predicate(node, tree)) found = node; if (!found) ts.forEachChild(node, visit); }
  visit(tree);
  assert.ok(found, `Missing audit target: ${file}`);
  return found.getText(tree);
}
function declaration(file, name) { return find(file, n => ts.isFunctionDeclaration(n) && n.name?.text === name); }
function run(source, mocks) {
  const context = { exports: {}, console, ...mocks };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React,
  } }).outputText, context, { timeout: 2000 });
  return context.exports;
}
async function probe(id, check) {
  try { await check(); results.push({ id, status: 'PASS' }); }
  catch (error) { results.push({ id, status: 'FAIL', reason: error.message }); }
}
const mockFiesta = { id: 'audit-only', configuracion: { nombreEvento: 'TEST' }, decoracion: { fotosGeneradasAi: [] } };
const imageApi = mocks => run(declaration(action, 'generarVisualizacionSalonAi'), {
  requireAppSession: async () => {}, getFiestaById: async () => mockFiesta,
  updateDecoracion: async () => ({ success: true }), ...mocks,
});
(async () => {
  await probe('DECO-01 generated venue must use supplied reference photo', async () => {
    let received;
    const api = imageApi({ generateGeminiImage: async options => { received = options; return 'test-only'; } });
    await api.generarVisualizacionSalonAi('audit-only', 'https://example.invalid/my-venue.jpg');
    assert.ok(received.images?.length, 'Generator receives no reference images');
  });
  await probe('DECO-02 image generation must use manually edited palette', async () => {
    let prompt;
    const api = imageApi({
      getFiestaById: async () => ({ ...mockFiesta, decoracion: {
        paletaColores: { primary: '#123456', secondary: '#234567', accent: '#345678' },
        colorPalette: { primary: '#aaaaaa', secondary: '#bbbbbb', accent: '#cccccc' },
      } }),
      generateGeminiImage: async options => { prompt = options.prompt; return 'test-only'; },
    });
    await api.generarVisualizacionSalonAi('audit-only');
    assert.ok(prompt.includes('#123456'), 'Generator uses stale colorPalette, not edited paletaColores');
  });
  await probe('DECO-03 generator must not report persisted image after failed save', async () => {
    const api = imageApi({ generateGeminiImage: async () => 'test-only', updateDecoracion: async () => ({ success: false }) });
    assert.equal((await api.generarVisualizacionSalonAi('audit-only')).success, false);
  });
  await probe('DECO-04 concurrent generation must respect remaining one-image quota', async () => {
    let calls = 0;
    const api = imageApi({
      getFiestaById: async () => ({ ...mockFiesta, decoracion: { fotosGeneradasAi: ['one', 'two'] } }),
      generateGeminiImage: async () => { calls++; return 'test-only'; },
    });
    await Promise.all([api.generarVisualizacionSalonAi('audit-only'), api.generarVisualizacionSalonAi('audit-only')]);
    assert.equal(calls, 1, 'Both requests spend the last available generation');
  });
  const scene = run(declaration('src/components/salon-3d/SalonScene.tsx', 'SalonElement') + '\nexports.render = SalonElement;', {
    React: { createElement: (type, props, ...children) => ({ type, props, children }) },
    Mesa3D: 'TABLE_TEST_DOUBLE', PistaBaile3D: 'DANCE_TEST_DOUBLE', Escenario3D: 'STAGE_TEST_DOUBLE',
  });
  const element = { id: 'test', x: 100, y: 120, width: 160, height: 80, type: 'element', rotation: 90 };
  await probe('DECO-05 balloon arch must not become a table', async () => {
    const result = scene.render({ element: { ...element, category: 'arco-globos' }, pixelsPerMeter: 40, salonWidth: 15, salonHeight: 15 });
    assert.notEqual(result.type, 'TABLE_TEST_DOUBLE', 'Generic decorative element is rendered as Mesa3D');
  });
  await probe('DECO-06 rotated bar must carry rotation into 3D', async () => {
    const result = scene.render({ element: { ...element, category: 'Barra' }, pixelsPerMeter: 40, salonWidth: 15, salonHeight: 15 });
    assert.ok(result.props.rotation, 'Bar group ignores the saved 90-degree rotation');
  });
  await probe('DECO-07 importing venue layout must preserve its scale', async () => {
    const callback = find(layout, (n, tree) => ts.isArrowFunction(n) && n.getText(tree).includes('setSalonSuggestion(null)') && n.getText(tree).includes('const layout = salonSuggestion.salonLayout'));
    let captured;
    const api = run('exports.load = ' + callback, {
      salonSuggestion: { nombre: 'TEST', salonLayout: { pixelsPerMeter: 80, salonWidth: 20, salonHeight: 10, salonElements: [element] } },
      decoracion: { pixelsPerMeter: 40 }, setDecoracion: value => { captured = value; }, setSalonSuggestion: () => {}, toast: () => {},
    });
    api.load();
    assert.equal(captured.pixelsPerMeter, 80, 'Imported pixel coordinates retain destination scale 40 instead of source 80');
  });
  await probe('DECO-08 layout autosave must propagate server failure', async () => {
    const callback = find(layout, n => ts.isPropertyAssignment(n) && n.name?.getText() === 'onSave');
    const api = run('const options = {' + callback + '}; exports.save = options.onSave;', {
      fiestaId: 'audit-only', updateDecoracionFiestaActual: async () => ({ success: false, error: 'Injected audit failure' }),
    });
    assert.equal((await api.save({ salonElements: [] })).success, false);
  });
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.some(r => r.status === 'FAIL') ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 2; });
