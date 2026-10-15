/** @jest-environment node */
import fs from 'fs';
import vm from 'vm';
import crypto from 'crypto';
import ts from 'typescript';

const root = 'src/app/(app)/fiestas/nueva/';
const rutas = ['itinerario/pdf', 'reuniones/imprimir', 'resumen-imprimible',
  'gestion-documental/recibo-pago', 'gestion-documental/cancelacion-parcial',
  'gestion-documental/cancelacion-contrato', 'gestion-documental/cambio-fecha',
  'decoracion/pdf', 'musica/pdf', 'gestion-costos-rentabilidad/reporte'];
const rows: any[] = [];
afterAll(() => fs.writeFileSync('docs/evidencias/130-compartir-variantes-observado.json', JSON.stringify({
  applicationSourceSha: 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
  scope: 'EXACT_AST_EXTRACTED_REAL_HANDLERS_WITH_REAL_BUTTON_BINDING_VERIFIED_AND_BROWSER_DOUBLES_NOT_REACT_RENDER_NOT_NATIVE_BROWSER',
  rows, realAccountsOrMessagesTouched: false,
}, null, 2) + '\n'));

async function probar(ruta: string, modo: string) {
  const file = `${root}${ruta}/page.tsx`, source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let original: string | undefined, bound = false;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'handleShare' && node.initializer) original = node.initializer.getText(ast);
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'onClick' && node.initializer && /\bhandleShare\b/.test(node.initializer.getText(ast))) bound = true;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!original || !bound) throw new Error(`QA: handler/boton no localizado en ${file}`);
  const native = jest.fn(async () => undefined), open = jest.fn(), clipboard = jest.fn(async () => undefined), toast = jest.fn();
  const configuracion = { nombreEvento: 'Fiesta ficticia QA130', fechaEvento: '2026-10-15', nombreLugar: 'Salon ficticio' };
  const context: any = {
    navigator: { share: modo === 'sin-share' ? undefined : native, canShare: modo === 'share-completo' ? () => true : undefined, clipboard: { writeText: clipboard } },
    window: { location: { href: 'https://example.invalid/qa130-documento', origin: 'https://example.invalid' }, open },
    toast, console: { error: jest.fn(), warn: jest.fn(), log: jest.fn() }, URL,
    fiestaId: 'qa130-fiesta-ficticia', fiesta: { id: 'qa130-fiesta-ficticia', configuracion },
    accessView: { nombreEvento: 'Fiesta ficticia QA130', configuracion }, reportData: { nombreEvento: 'Fiesta ficticia QA130' },
    data: { fiesta: { configuracion } }, showLayout: false, setShareUrlToShow: jest.fn(),
  };
  const js = ts.transpileModule(`globalThis.__handler = (${original});`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInNewContext(js, context, { filename: file, timeout: 1000 });
  let thrown: any;
  try { await context.__handler(); } catch (e: any) { thrown = { name: e.name, message: e.message }; }
  rows.push({ file, modo, sourceSha256: crypto.createHash('sha256').update(source).digest('hex'), bound,
    nativeCalls: native.mock.calls.length, fallbackCalls: open.mock.calls.length, clipboardCalls: clipboard.mock.calls.length, toastCalls: toast.mock.calls, thrown });
  return { native, open, clipboard, thrown };
}
describe.each(rutas)('%s', ruta => {
  test('control sin compartir nativo ofrece alternativa', async () => {
    const r = await probar(ruta, 'sin-share'); expect(r.thrown).toBeUndefined();
    expect(r.open.mock.calls.length + r.clipboard.mock.calls.length).toBeGreaterThan(0);
  });
  test('control con API completa comparte por nativo', async () => {
    const r = await probar(ruta, 'share-completo'); expect(r.thrown).toBeUndefined(); expect(r.native).toHaveBeenCalledTimes(1);
  });
  test('sin canShare no pierde las dos alternativas', async () => {
    const r = await probar(ruta, 'share-sin-canShare'); expect(r.thrown).toBeUndefined();
    expect(r.native.mock.calls.length + r.open.mock.calls.length + r.clipboard.mock.calls.length).toBeGreaterThan(0);
  });
});
