// Actual source functions with synthetic data. No network, credentials or writes to the app.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const { stripTypeScriptTypes } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = path.resolve(process.argv[2]);
const ts = require(path.join(root, 'node_modules/typescript'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const blobs = {};
function source(file) {
  const value = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  const bytes = Buffer.from(value);
  const blob = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  const expected = execFileSync('git', ['rev-parse', `HEAD:${file}`], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(blob, expected, `Uncommitted source: ${file}`);
  blobs[file] = blob;
  return value;
}
function declaration(file, name) {
  const text = source(file);
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, `${file}::${name}`);
  return node.getText(ast);
}
function evaluate(text, names, globals) {
  const context = vm.createContext({ Date, Math, Number, Symbol, console: { warn() {}, error() {} }, ...globals });
  const stripped = stripTypeScriptTypes(text.replace(/^export /gm, '').replace(/await import\(/g, 'await testImport('), { mode: 'strip' });
  vm.runInContext(stripped + `\nglobalThis.exports = {${names.join(',')}};`, context);
  return context.exports;
}
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
  ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

async function run() {
  const projectionText = source('src/lib/fiesta/recortar-para-afuera.ts').replace(/^import type .*;\r?\n/gm, '');
  const projection = evaluate(projectionText, ['recortarFiestaParaAfuera'], {});
  const fullRead = Symbol('trusted-server-read');
  let anonymousChecks = 0;
  const fixture = { id: 'e2e_privacy_probe', invitados: [{ id: 'e2e_guest', nombre: 'Persona de prueba',
    contacto: 'contacto-sintetico', guestAccessToken: 'token-sintetico', alergiasEspecificas: 'prueba-sintetica' }] };
  const fiesta = evaluate(declaration('src/app/actions/fiesta/fiesta.actions.ts', 'getFiestaById'), ['getFiestaById'], {
    FIESTAS_DIR: 'fiestas', LECTURA_COMPLETA: fullRead, defaultModulosContratados: {},
    readData: async () => structuredClone(fixture),
    testImport: async module => {
      if (module === '@/lib/auth/session-token') return { verifySession: async () => { anonymousChecks++; return { success: false }; } };
      if (module === '@/lib/security/portal-session') return { verifyPortalSession: async () => false };
      if (module === '@/lib/fiesta/recortar-para-afuera') return projection;
      throw new Error(`Unexpected dependency: ${module}`);
    },
  });
  const query = evaluate(declaration('src/app/actions/fiesta/invitados.actions.ts', 'getInvitados'), ['getInvitados'], {
    LECTURA_COMPLETA: fullRead, getFiestaById: fiesta.getFiestaById,
  });
  const normal = await fiesta.getFiestaById(fixture.id);
  assert.equal(normal.invitados[0].contacto, undefined);
  assert.equal(normal.invitados[0].guestAccessToken, undefined);
  const guestList = await query.getInvitados(fixture.id);
  assert.equal(guestList[0].contacto, fixture.invitados[0].contacto);
  assert.equal(guestList[0].guestAccessToken, fixture.invitados[0].guestAccessToken);
  assert.equal(anonymousChecks, 2);

  const config = JSON.parse(source('docs/codex/areas.json'));
  const counter = await import(pathToFileURL(path.join(root, 'scripts/codex-limpio.mjs')).href);
  const belongs = (file, folder) => file === folder || file.startsWith(folder + '/');
  const routes = walk(path.join(root, 'src/app')).filter(f => /[\\/](page\.tsx|route\.ts)$/.test(f))
    .map(f => path.relative(root, f).replace(/\\/g, '/'));
  const uncovered = routes.filter(f => !config.areas.some(a => a.carpetas.some(c => belongs(f, c))));
  const clean = config.areas.map(a => ({ ...a, estado: 'limpia', commit }));
  const changed = 'src/app/portal-cliente/[id]/page.tsx';
  const fakeGit = args => args.slice(args.indexOf('--') + 1).some(c => belongs(changed, c)) ? changed : '';
  const simulated = counter.resumen(clean, fakeGit);
  assert.equal(simulated.terminado, true);
  const cli = spawnSync(process.execPath, [path.join(root, 'scripts/codex-limpio.mjs')], { cwd: root, encoding: 'utf8' });
  assert.equal(cli.status, 0);
  if (process.platform === 'win32') assert.equal(cli.stdout.trim(), '');
  const result = JSON.stringify({ commit, blobs, syntheticDataOnly: true, productionWrites: 0,
    results: [
      { id: 'PER01', result: 'source-defect-reproduced', anonymousBaseProjectionRemovesSecrets: true,
        getInvitadosReturnsContactAndCredential: true, remoteExploitTested: false },
      { id: 'AUD01', result: 'coverage-gap-reproduced', routes: routes.length, uncovered: uncovered.length,
        hypotheticalCleanAreasStayCleanAfterOmittedPortalChange: simulated.terminado,
        actualAreasCurrentlyClean: config.areas.filter(a => a.estado === 'limpia').length },
      { id: 'AUD02', result: process.platform === 'win32' ? 'windows-cli-defect-reproduced' : 'not-windows',
        exitCode: cli.status, printedCharacters: cli.stdout.length },
    ], uncoveredRoutes: uncovered }, null, 2);
  if (process.argv[3]) fs.writeFileSync(path.resolve(process.argv[3]), result + '\n');
  console.log(JSON.stringify(JSON.parse(result).results));
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
