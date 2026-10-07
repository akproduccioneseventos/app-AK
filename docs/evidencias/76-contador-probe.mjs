import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const sha = '9bb955ac6af65a314f3ac62975020b37c9edaaf3';
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const normalized = (text) => text.replace(/\r\n/g, '\n');
for (const file of ['scripts/codex-limpio.mjs', 'docs/codex/areas.json']) {
  assert.equal(normalized(fs.readFileSync(path.join(root, file), 'utf8')),
    normalized(git(['show', `${sha}:${file}`])), `Fuente distinta: ${file}`);
}
const { resumen, estadoReal } = await import(pathToFileURL(path.join(root, 'scripts/codex-limpio.mjs')));
const { areas } = JSON.parse(git(['show', `${sha}:docs/codex/areas.json`]));
const routes = git(['ls-tree', '-r', '--name-only', sha]).trim().split(/\r?\n/)
  .filter((file) => /^src\/app\//.test(file) && /\/(page\.tsx?|route\.ts)$/.test(file));
const belongs = (file, directory) => file === directory || file.startsWith(`${directory}/`);
const outside = routes.filter((file) => !areas.some((area) => area.carpetas.some((dir) => belongs(file, dir))));
const changed = 'src/app/portal-cliente/[id]/page.tsx';
assert.ok(routes.includes(changed));
const fakeGit = (args) => {
  const separator = args.indexOf('--');
  return separator >= 0 && args.slice(separator + 1).some((dir) => belongs(changed, dir)) ? `${changed}\n` : '';
};
const portal = areas.find((area) => area.id === 'portal');
const observed = {
  sourceCommit: sha, observedAtUtc: new Date().toISOString(),
  routeCount: routes.length, covered: routes.length - outside.length,
  outsideAreaCount: outside.length, outsideRoutes: outside,
  simulated: 'Solo estado hipotetico limpio y salida de git; no modifica areas.json ni audita permisos HTTP.',
  changed, portalAfterChangedFile: estadoReal({ ...portal, estado: 'limpia', commit: sha }, fakeGit),
  allHypotheticalCleanClaim: resumen(areas.map((area) => ({ ...area, estado: 'limpia', commit: sha })), () => '').terminado,
  meaning: 'AUD01 reproducido, NO arreglado; las areas reales no se declaran limpias.',
};
assert.ok(outside.length > 0);
assert.equal(observed.portalAfterChangedFile, 'limpia');
assert.equal(observed.allHypotheticalCleanClaim, true);
const directory = path.join(root, 'docs/evidencias/76-resultados');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'contador.json'), `${JSON.stringify(observed, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ...observed, outsideRoutes: `${outside.length} rutas conservadas en contador.json` }));
