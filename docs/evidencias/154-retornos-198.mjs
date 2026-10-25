import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const out = new URL('154-retornos-198.json', import.meta.url);
assert.equal(fs.existsSync(out), false, 'Preserve receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {};
const read = file => { const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex'); return r.stdout; };
const evaluate = (code, modules = {}, globals = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: name => { if (name in modules) return modules[name]; throw new Error(`Unexpected dependency ${name}`); }, ...globals }, { timeout: 2000 }); return exports;
};
const extract = (file, names) => {
  const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const found = ast.statements.filter(n => ts.isFunctionDeclaration(n) && n.name && names.includes(n.name.text));
  assert.equal(found.length, names.length); return found.map(n => n.getText(ast)).join('\n');
};
const profiles = evaluate(read('src/lib/auth/perfiles.ts'));
const privacy = evaluate(read('src/lib/fiesta/recortar-para-afuera.ts'), { '@/lib/auth/perfiles': profiles });
const permissionCode = read('src/lib/auth/require-session.ts');
const meetings = extract('src/app/actions/fiesta/reuniones.actions.ts', ['updateFiestaReuniones', 'syncReunionInBackground', 'addReunion']);
const task = extract('src/app/actions/multiagent.ts', ['crearTareaDesdeMultiagente']);
const lifecycle = extract('src/app/actions/fiesta/fiesta.actions.ts', ['recortarParaQuienPregunta', 'suspenderFiestaAction', 'reactivarFiestaAction']);
const clone = value => JSON.parse(JSON.stringify(value));
const cases = [];
for (const kind of ['addReunion', 'crearTareaDesdeMultiagente', 'suspenderFiestaAction', 'reactivarFiestaAction']) {
  for (const perfil of ['dueno', 'secretaria', 'personal']) {
    const actor = { perfil, role: 'admin', userId: 'qa154', email: 'qa154@invalid.example' };
    let data = { id: 'qa154-retornos', configuracion: { nombreEvento: 'QA ficticio' }, tareas: [], reuniones: [],
      personalAsignado: [{ empleadoId: 'otro', eventSalary: 3000 }], gestionCostos: { total: 9500 }, estadosCompra: [{ montoPagado: 60.30, pagado: true }] };
    let writes = 0; const suppressed = [];
    const verifySession = async () => ({ success: true, user: actor });
    const permissions = evaluate(permissionCode, { '@/lib/auth/session-token': { verifySession }, '@/lib/auth/perfiles': profiles });
    const modules = { '@/lib/auth/session-token': { verifySession }, '@/lib/fiesta/recortar-para-afuera': privacy,
      '@/lib/fiesta/revisar-fiestas': { suspenderFiesta: f => ({ ...f, estado: 'Suspendida' }), reactivarFiesta: f => ({ ...f, estado: 'Activa' }), calcularLiquidacionSuspension: () => ({ soloFixtureNoValidaCalculos: true }) } };
    const globals = { ...permissions, PERMISOS: profiles.PERMISOS, recortarFiestaPorPerfil: privacy.recortarFiestaPorPerfil,
      actualizarFiesta: async (_id, mutate) => { data = clone(mutate(clone(data))); writes++; return { success: true, updatedFiesta: clone(data) }; },
      getFiestaById: async () => clone(data), saveFiesta: async f => { data = clone(f); writes++; return { success: true }; },
      syncReunionToGoogleWorkspace: async () => { suppressed.push('google-no-send'); },
      createNotification: async () => { suppressed.push('notification-local-double'); }, saveAgentLearning: async () => { suppressed.push('learning-local-double'); } };
    const app = evaluate(kind === 'addReunion' ? meetings : kind === 'crearTareaDesdeMultiagente' ? task : lifecycle, modules, globals);
    let response, error;
    try {
      response = kind === 'addReunion' ? await app.addReunion({ fiestaId: data.id, fecha: '2027-08-08', titulo: 'QA' })
        : kind === 'crearTareaDesdeMultiagente' ? await app.crearTareaDesdeMultiagente({ fiestaId: data.id, texto: 'Tarea QA' })
          : await app[kind](data.id, 'Motivo QA', '2027-08-08');
    } catch (e) { error = String(e); }
    const fiesta = response?.fiesta || response?.updatedFiesta;
    const allowed = perfil !== 'personal';
    const exposed = !!fiesta && (!profiles.puede(actor, profiles.PERMISOS.GANANCIAS) && fiesta.gestionCostos !== undefined
      || !profiles.puede(actor, profiles.PERMISOS.SUELDOS) && fiesta.personalAsignado?.some(p => p.eventSalary !== undefined));
    const pass = allowed ? response?.success === true && !exposed && (perfil !== 'dueno' || fiesta?.gestionCostos?.total === 9500)
      : response?.success !== true && writes === 0 && suppressed.length === 0;
    cases.push({ kind, perfil, success: response?.success, error, writes, exposed, suppressed, pass });
  }
}
const result = { source, hashes, cases, summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Four actual consumer return paths and actual session/profile permission helpers; deliberately full sensitive fixture from controlled storage',
  limits: ['Session/read/update/save and secondary effects are doubles; not another SDK/HTTP test',
    'Suspension/reactivation helpers and liquidation are controlled fixtures: no acceptance of financial liquidation arithmetic',
    'No Google email, notification delivery, assistant learning, production data or dedicated portal credentials tested'], appEdited: false };
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ source, summary: result.summary, cases }));
if (result.summary.fail) process.exitCode = 1;
