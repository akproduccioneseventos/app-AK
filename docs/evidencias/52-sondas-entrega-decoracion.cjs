// Read-only audit: extract target callbacks; fake state, download and persistence.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(process.argv[3] || path.join(__dirname, '../..'));
const editor = 'src/app/(app)/fiestas/nueva/decoracion/page.tsx';
const layout = 'src/app/(app)/fiestas/nueva/invitados/layout/page.tsx';
const portal = 'src/app/portal/[fiestaId]/decoracion/page.tsx';
const results = [];
function extract(file, predicate) {
  const tree = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  let found;
  function visit(n) { if (!found && predicate(n)) found = n; if (!found) ts.forEachChild(n, visit); }
  visit(tree);
  assert.ok(found, `Missing audit target in ${file}`);
  return found.getText(tree);
}
const variable = (file, name) => extract(file, n => ts.isVariableDeclaration(n) && n.name.getText() === name);
const fn = (file, name) => extract(file, n => ts.isFunctionDeclaration(n) && n.name?.text === name);
function evaluate(code, mocks = {}) {
  const context = { exports: {}, console, ...mocks };
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText, context, { timeout: 2000 });
  return context.exports;
}
async function probe(id, run) {
  try { await run(); results.push({ id, status: 'PASS' }); }
  catch (e) { results.push({ id, status: 'FAIL', reason: e.message }); }
}
(async () => {
  await probe('DECO-09 Exportar PNG must initiate a download', async () => {
    let downloads = 0;
    const api = evaluate('const ' + variable(editor, 'handleExportPng') + '; exports.run = handleExportPng;', {
      useCallback: cb => cb, toast: () => {},
      document: { createElement: () => ({ click: () => { downloads++; } }) },
      saveAs: () => { downloads++; },
    });
    await api.run();
    assert.ok(downloads > 0, 'Callback only shows toast; no download starts');
  });
  await probe('DECO-10 failed preview persistence must not announce saved', async () => {
    const notices = [];
    const api = evaluate('const ' + variable(layout, 'handleCapture3D') + '; exports.run = handleCapture3D;', {
      salonSceneRef: { current: { captureScreenshot: () => 'data:image/png;base64,TEST_ONLY' } },
      decoracion: {}, fiestaId: 'audit-only', setIsCapturing: () => {}, setDecoracion: () => {},
      updateDecoracionFiestaActual: async () => ({ success: false, error: 'Injected failure' }),
      toast: notice => notices.push(notice),
    });
    await api.run();
    assert.ok(!notices.some(n => /guardado en el portal/i.test(n.description || '')),
      'Preview is announced saved after server returns success:false');
  });
  await probe('DECO-11 customer proposal must show manually edited color', () => {
    let state = { paletaColores: { primary: '#111111' }, colorPalette: { primary: '#222222' } };
    const api = evaluate('const ' + variable(editor, 'handleColorChange') + '; exports.run = handleColorChange;', {
      setDecoracionData: updater => { state = updater(state); }, defaultDecoracion: {},
    });
    api.run('primary', '#123456');
    const view = evaluate('const ' + variable(portal, 'palette') + '; exports.palette = palette;', { deco: state });
    assert.equal(view.palette.primary, '#123456', 'Proposal reads old colorPalette after editor changes paletaColores');
  });
  const mapperFile = 'src/lib/client-portal/public-fiesta.ts';
  const mapper = evaluate(['mapDocument', 'mapGuest', 'mapProgramaParaElCliente', 'mapFiestaToClientPortal']
    .map(name => fn(mapperFile, name)).join('\n'));
  const projected = mapper.mapFiestaToClientPortal({
    id: 'audit-only', configuracion: {}, decoracion: {
      salonPreview3dUrl: 'https://example.invalid/approved-preview.png',
      generalNotesDecoracion: 'INTERNAL_TEAM_NOTE_TEST',
      itemsDecoracion: [{ costo: 87654321 }],
    },
  });
  await probe('DECO-12 current client projection must carry promised preview', () => {
    assert.equal(projected.decoracion.salonPreview3dUrl, 'https://example.invalid/approved-preview.png',
      'Saved preview is removed before reaching current client portal');
  });
  await probe('DECO-13 notes presented to staff as team notes must not reach client', () => {
    assert.ok(!JSON.stringify(projected).includes('INTERNAL_TEAM_NOTE_TEST'), 'Team note reaches client projection');
  });
  await probe('PRESERVE decoration internal cost stays excluded', () => {
    assert.ok(!JSON.stringify(projected).includes('87654321'));
  });
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.some(r => r.status === 'FAIL') ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 2; });
