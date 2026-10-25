import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '45a0b1d4783ad58846c2e2d07ad8f318287024bf';
const target = new URL('150-otros-perfiles.json', import.meta.url);
if (fs.existsSync(target)) throw new Error('Preserve prior receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {};
const read = file => {
  const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex'); return r.stdout;
};
const evaluate = (text, dependencies = {}, globals = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: name => { if (name in dependencies) return dependencies[name]; throw new Error(`Unexpected dependency ${name}`); }, ...globals }, { timeout: 2000 });
  return exports;
};
const profiles = evaluate(read('src/lib/auth/perfiles.ts'));
const privacy = evaluate(read('src/lib/fiesta/recortar-para-afuera.ts'), { '@/lib/auth/perfiles': profiles });
const helper = evaluate(read('src/lib/fiesta/reponer-la-plata.ts'));
const teamSource = read('src/lib/auth/equipo-de-la-fiesta.ts');
const file = 'src/app/actions/fiesta/fiesta.actions.ts';
const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
const names = ['esEquipoParaFiesta', 'requireFiestaWriteAccess', 'getSesionYPermisos', 'validatePersonalAssignments', 'saveFiesta'];
const selected = ast.statements.filter(n => ts.isFunctionDeclaration(n) && n.name && names.includes(n.name.text));
assert.equal(selected.length, names.length);
const code = selected.map(n => n.getText(ast)).join('\n');
const clone = value => JSON.parse(JSON.stringify(value));
const fullProfile = Object.keys(profiles.PERMISOS_POR_PERFIL).find(perfil =>
  [profiles.PERMISOS.CONTABILIDAD, profiles.PERMISOS.SUELDOS, profiles.PERMISOS.GANANCIAS].every(p => profiles.puede({ perfil }, p)));
assert.ok(fullProfile);
const cases = [];
for (const kind of ['secretaria', 'personal', 'cliente', 'prospecto', 'invitado']) {
  const actor = { perfil: kind, userId: 'op150', email: 'op150@qa.invalid' };
  let stored = { id: 'qa150-gate', configuracion: { nombreEvento: 'QA ficticio' }, gestionCostos: { total: 9500 },
    personalAsignado: [{ empleadoId: kind === 'operator-unassigned' ? 'otro150' : 'op150', rolId: 'dj', eventSalary: 3000 }],
    estadosCompra: [{ proveedorId: 'a', proveedor: 'A', pagado: true, montoPagado: 60.30 }] };
  const verifySession = async () => actor ? { success: true, user: actor } : { success: false };
  const team = evaluate(teamSource, { 'server-only': {}, '@/lib/auth/perfiles': profiles,
    '@/lib/auth/session-token': { verifySession }, '@/app/actions/empleados': { getEmpleados: async () => [{ id: 'op150', email: 'op150@qa.invalid' }] } });
  const allowedByRealTeam = (await team.quienEsElEquipo())(stored);
  const input = privacy.recortarFiestaPorPerfil(clone(stored), actor);
  input.invitacionDigital = { titulo: 'Edicion no financiera QA' };
  const inputHasCosts = 'gestionCostos' in input;
  let writes = 0;
  const modules = { '@/lib/auth/session-token': { verifySession }, '@/lib/fiesta/get-fiesta-raw': { getFiestaByIdRaw: async () => clone(stored) },
    '@/lib/fiesta/actualizar-fiesta': { actualizarFiesta: async (_id, fn) => { writes++; stored = clone(await fn(clone(stored))); return { success: true, updatedFiesta: clone(stored) }; } } };
  const actions = evaluate(code, modules, { ...helper, PERMISOS: profiles.PERMISOS, puede: profiles.puede,
    quienEsElEquipo: team.quienEsElEquipo, verifyPortalSession: async () => false, CAMPOS_DEL_EQUIPO: privacy.CAMPOS_DEL_EQUIPO,
    FIESTAS_DIR: 'fiestas', preserveFiestaSecrets: async (_id, value) => value,
    writeData: async (_file, value) => { writes++; stored = clone(value); } });
  let response, rejected = false;
  try { response = await actions.saveFiesta(clone(input)); } catch { rejected = true; }
  const leaked = response?.fiesta && !profiles.puede(actor, profiles.PERMISOS.GANANCIAS) && 'gestionCostos' in response.fiesta;
  const salaryLeak = !!response?.fiesta?.personalAsignado?.some(p => 'eventSalary' in p) && !profiles.puede(actor, profiles.PERMISOS.SUELDOS);
  const pass = kind === 'secretaria' ? response?.success === true && !leaked && !salaryLeak : rejected && writes === 0;
  cases.push({ kind, actorProfile: actor?.perfil ?? null, allowedByRealTeam, inputHasCosts, rejected, writes,
    responseHasCosts: !!response?.fiesta?.gestionCostos, returnedCosts: response?.fiesta?.gestionCostos ?? null,
    returnedSupplierPayment: response?.fiesta?.estadosCompra?.[0]?.montoPagado ?? null,
    storedCosts: stored.gestionCostos, salaryLeak, returnedStaffSalary: response?.fiesta?.personalAsignado?.[0]?.eventSalary ?? null, pass });
}
const record = { source, hashes, cases, summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Five additional profiles only; actual action/gate/profile model, fake session and database; no portal credential',
  limits: ['No real signed HTTP, SDK persistence, production or real financial data',
    'Secretaria starts from redacted input; profits and salaries restored from fake storage are not echoed input',
    'Cliente/prospecto/invitado denial is without portal credential, not rejection of their dedicated portal flows'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: record.summary, cases }));
if (record.summary.fail) process.exitCode = 1;
