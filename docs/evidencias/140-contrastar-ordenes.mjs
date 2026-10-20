import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const other = 'C:/Users/Usuario/.gemini/antigravity/scratch/app-AK';
const candidate = '4d845b921d3b579515de7937fd7d209cbab71f3b';
const base = '7230f9d02b32805952a185f704a0208bd5d643e6';
const phase = process.argv[2];
if (!['antes', 'despues'].includes(phase)) throw new Error('Use antes or despues');
const git = (cwd, args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
};
const sourceFiles = ['src/lib/auth/perfiles.ts', 'src/app/(app)/contabilidad/crm/agenda/page.tsx', 'src/app/(app)/empresa/servicios/page.tsx'];
const comparisons = sourceFiles.map((file) => {
  const baseline = git(root, ['rev-parse', `${base}:${file}`]);
  const next = git(other, ['rev-parse', `${candidate}:${file}`]);
  return { file, baseline, candidate: next, identical: baseline === next };
});
const collisions = [
  ['179', '179-gemini-agenda-recordatorio-whatsapp-local.md', '179-gemini-devolucion-176-177-y-ia-gratis-mas-nueva.md'],
  ['180', '180-claude-perfiles-solo-claves-propias.md', '180-gemini-menu-por-perfil-y-galeria-vogue.md'],
].map(([number, ours, theirs]) => ({ number, ours, theirs,
  ourBlobAtAuditHead: git(root, ['rev-parse', `HEAD:docs/ordenes/${ours}`]),
  otherBlobAtCandidate: git(other, ['rev-parse', `${candidate}:docs/ordenes/${theirs}`]),
}));
const scriptFile = path.join(root, 'scripts/ordenes-cumplidas.mjs');
const script = fs.readFileSync(scriptFile, 'utf8');
const deps = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = deps('typescript');
const parsed = ts.createSourceFile(scriptFile, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const wanted = ['leerComprobaciones', 'comprobar', 'bloquesSinComprobacion'];
const functions = parsed.statements.filter((n) => ts.isFunctionDeclaration(n) && wanted.includes(n.name?.text));
if (functions.length !== wanted.length) throw new Error('Checker source changed');
const context = vm.createContext({ fs, path, process: { cwd: () => root } });
vm.runInContext(functions.map((n) => n.getText(parsed)).join('\n') +
  '\nglobalThis.check = (texto) => { const checks=leerComprobaciones(texto); return { checks:checks.map(c=>({...c,pass:comprobar(c)})), missingBlocks:bloquesSinComprobacion(texto,checks) }; };', context);
const orderFile = path.join(root, 'docs/ordenes/180-claude-perfiles-solo-claves-propias.md');
const order = fs.readFileSync(orderFile, 'utf8');
const result = { phase, observed: new Date().toISOString(), appSource: base, candidate, comparisons, collisions,
  checkerSha256: crypto.createHash('sha256').update(script).digest('hex'),
  orderSha256: crypto.createHash('sha256').update(order).digest('hex'),
  structural: context.check(order), applicationEdited: false,
  scope: 'Read-only Git blobs and real structural checker functions. NOT application runtime, build, permission approval or provider test.' };
if (!comparisons.every((c) => c.identical)) throw new Error('Known app files changed; do not reuse138 evidence');
fs.writeFileSync(path.join(root, `docs/evidencias/140-${phase}.json`), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ phase, identical: comparisons.length,
  passed: result.structural.checks.filter((c) => c.pass).length,
  failed: result.structural.checks.filter((c) => !c.pass).length,
  missingBlocks: result.structural.missingBlocks.length, collisions: collisions.length }));
