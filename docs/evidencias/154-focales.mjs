import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const target = new URL('154-focales.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {};
const read = file => {
  const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex'); return r.stdout;
};
const cases = [];
const file = 'src/app/(app)/fiestas/nueva/gestion-documental/cancelacion-parcial/page.tsx';
const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const handlers = [];
const visit = n => { if (ts.isVariableDeclaration(n) && n.name.getText(ast) === 'handleShare') handlers.push(n.initializer.getText(ast)); ts.forEachChild(n, visit); };
visit(ast); assert.equal(handlers.length, 1);
const code = ts.transpileModule(`exports.run = (${handlers[0]});`, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
for (const kind of ['share-success', 'canShare-absent-delayed-copy', 'clipboard-rejected', 'clipboard-absent']) {
  const events = []; const toasts = []; const exports = {}; let release;
  const waiting = new Promise(yes => { release = yes; });
  const navigator = kind === 'share-success' ? { canShare: () => true, share: async () => { events.push('shared'); } }
    : kind === 'canShare-absent-delayed-copy' ? { share: async () => { throw new Error('Must not call'); }, clipboard: { writeText: async () => { events.push('copy-start'); await waiting; events.push('copy-done'); } } }
      : kind === 'clipboard-rejected' ? { clipboard: { writeText: async () => { throw new Error('Denied QA'); } } } : {};
  vm.runInNewContext(code, { exports, navigator, fiesta: { configuracion: { nombreEvento: 'QA ficticio' } },
    window: { location: { href: 'https://qa.invalid/solo-prueba' } }, toast: value => toasts.push(value) }, { timeout: 2000 });
  const task = exports.run();
  let prematureToast = false;
  if (kind === 'canShare-absent-delayed-copy') { await new Promise(yes => setImmediate(yes)); prematureToast = toasts.length !== 0; release(); }
  await task;
  const pass = kind === 'share-success' ? events.length === 1 && events[0] === 'shared' && toasts.length === 0
    : kind === 'canShare-absent-delayed-copy' ? !prematureToast && events.join(',') === 'copy-start,copy-done' && toasts.length === 1 && toasts[0].title === 'Enlace copiado'
      : toasts.length === 1 && toasts[0].variant === 'destructive' && toasts[0].description.includes('https://qa.invalid/solo-prueba');
  cases.push({ kind, pass, prematureToast, events, toasts });
}
const blogFile = 'src/lib/blog/sin-promesas.ts';
const blogAst = ts.createSourceFile(blogFile, read(blogFile), ts.ScriptTarget.Latest, true);
const names = ['REGEX_PROMESAS', 'textoQuePromete', 'limpiarTextoDeOracionesQuePrometen', 'corregirPromesasDelBlog'];
const selected = blogAst.statements.filter(n => ts.isFunctionDeclaration(n) && n.name && names.includes(n.name.text)
  || ts.isVariableStatement(n) && n.declarationList.declarations.some(d => ts.isIdentifier(d.name) && names.includes(d.name.text)));
assert.equal(selected.length, names.length);
const exports = {};
vm.runInNewContext(ts.transpileModule(selected.map(n => n.getText(blogAst)).join('\n'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports }, { timeout: 2000 });
const posts = JSON.parse(read('data/blog-posts.json'));
const original = posts.find(p => p.slug === 'como-calcular-bebida-evento-salto');
assert.ok(original);
const post = exports.corregirPromesasDelBlog([original])[0];
const text = [post.title, post.excerpt, post.takeaway, ...(post.checklist || []), ...post.sections.flatMap(s => [s.heading, ...s.body])].join(' ');
const assertions = { noExacto: !text.toLowerCase().includes('exacto'), noDoble: !text.toLowerCase().includes('el doble'), adults: text.includes('mayores de 18'),
  estimation: text.includes('Es una estimación para calcular la compra, no una recomendación de consumo'), responsible: text.includes('servicio responsable') };
cases.push({ kind: 'blog-canonical-fixture', pass: Object.values(assertions).every(Boolean), assertions,
  canonicalBlob: spawnSync('git', ['rev-parse', `${source}:data/blog-posts.json`], { cwd: root, encoding: 'utf8' }).stdout.trim(),
  originalFixtureProblem: 'Missing sparse-checkout file, not a failed content assertion' });
const result = { source, hashes, cases, summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual changed cancellation handler with browser API doubles; actual blog correction and exact canonical Git data with original assertions',
  limits: ['No real browser clipboard/share or production blog data', 'Focal case retry is not a second complete green Jest run'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result));
if (result.summary.fail) process.exitCode = 1;
