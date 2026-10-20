import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '2e5363f259461a31bf6b31807872c227855415de';
const target = new URL('151-guardado-perfiles.json', import.meta.url);
if (fs.existsSync(target)) throw new Error('Preserve prior receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {};
const read = file => {
  const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex');
  return r.stdout;
};
const evaluate = (text, modules = {}, globals = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: name => { if (name in modules) return modules[name]; throw new Error(`Unexpected dependency ${name}`); }, ...globals }, { timeout: 2000 });
  return exports;
};
const extract = (file, names) => {
  const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const found = new Set();
  const pieces = ast.statements.filter(n => {
    const matches = ts.isFunctionDeclaration(n) && n.name && names.includes(n.name.text) ? [n.name.text]
      : ts.isVariableStatement(n) ? n.declarationList.declarations.filter(d => ts.isIdentifier(d.name) && names.includes(d.name.text)).map(d => d.name.text) : [];
    matches.forEach(name => found.add(name)); return matches.length;
  });
  assert.deepEqual([...found].sort(), [...names].sort());
  return pieces.map(n => n.getText(ast)).join('\n');
};
const profiles = evaluate(read('src/lib/auth/perfiles.ts'));
const privacy = evaluate(read('src/lib/fiesta/recortar-para-afuera.ts'), { '@/lib/auth/perfiles': profiles });
const teamSource = read('src/lib/auth/equipo-de-la-fiesta.ts');
const preserveCode = extract('src/lib/fiesta/get-fiesta-raw.ts', ['preserveFiestaSecrets']);
const actionCode = extract('src/app/actions/fiesta/fiesta.actions.ts', [
  'CAMPOS_DE_PLATA_Y_CONTRATO', 'PAGO_DE_LA_COMPRA', 'tocaLaPlata', 'reponerLaPlata',
  'esEquipoParaFiesta', 'requireFiestaWriteAccess', 'validatePersonalAssignments', 'saveFiesta',
]);
const clone = value => JSON.parse(JSON.stringify(value));
const cases = [];
const kinds = ['dueno', 'operador-asignado', 'operador-no-asignado', 'secretaria', 'personal', 'cliente', 'prospecto', 'invitado', 'anonimo', 'portal-cliente'];
for (const kind of kinds) {
  const profile = kind.startsWith('operador-') ? 'operador' : kind;
  const actor = ['anonimo', 'portal-cliente'].includes(kind) ? null : { perfil: profile, userId: profile === 'secretaria' ? 'sec151' : 'op151', email: 'qa151@qa.invalid' };
  let stored = { id: 'qa151', configuracion: { nombreEvento: 'QA ficticio' }, gestionCostos: { total: 9500 },
    personalAsignado: [{ empleadoId: kind === 'operador-no-asignado' ? 'otro151' : 'op151', rolId: 'dj', eventSalary: 3000 }],
    estadosCompra: [{ proveedorId: 'a', proveedor: 'QA', pedido: false, pagado: true, montoPagado: 60.30 }],
    planDePagos: { cuotas: [{ id: 'cuota151', monto: 1000, pagada: true }] } };
  const before = clone(stored);
  const verifySession = async () => actor ? { success: true, user: actor } : { success: false };
  const team = evaluate(teamSource, { 'server-only': {}, '@/lib/auth/perfiles': profiles,
    '@/lib/auth/session-token': { verifySession }, '@/app/actions/empleados': { getEmpleados: async () => [{ id: 'op151', email: 'qa151@qa.invalid' }] } });
  const fromStorage = async () => clone(stored);
  const preserve = evaluate(preserveCode, {}, { getFiestaByIdRaw: fromStorage, reponerLoRecortado: privacy.reponerLoRecortado }).preserveFiestaSecrets;
  let writes = 0;
  const modules = { '@/lib/auth/session-token': { verifySession }, '@/lib/fiesta/get-fiesta-raw': { getFiestaByIdRaw: fromStorage },
    '@/lib/fiesta/recortar-para-afuera': privacy,
    '@/lib/fiesta/actualizar-fiesta': { actualizarFiesta: async (_id, update) => {
      const next = await update(clone(stored));
      stored = clone(await preserve('qa151', next)); writes++;
      return { success: true, updatedFiesta: clone(stored) };
    } } };
  const app = evaluate(actionCode, modules, { puede: profiles.puede, PERMISOS: profiles.PERMISOS,
    quienEsElEquipo: team.quienEsElEquipo, verifyPortalSession: async () => kind === 'portal-cliente',
    CAMPOS_DEL_EQUIPO: privacy.CAMPOS_DEL_EQUIPO, FIESTAS_DIR: 'fiestas', preserveFiestaSecrets: preserve,
    writeData: async (_path, data) => { stored = clone(data); writes++; } });
  const input = kind === 'portal-cliente' ? privacy.recortarFiestaParaAfuera(clone(stored), { esCliente: true }) : privacy.recortarFiestaPorPerfil(clone(stored), actor);
  input.invitacionDigital = { titulo: 'Cambio operativo QA151' };
  let response, error;
  try { response = await app.saveFiesta(input); } catch (e) { error = String(e); }
  const allowed = ['dueno', 'operador-asignado', 'secretaria', 'portal-cliente'].includes(kind);
  const forbidden = [];
  const out = response?.fiesta;
  if (out) {
    if (!profiles.puede(actor, profiles.PERMISOS.GANANCIAS) && out.gestionCostos !== undefined) forbidden.push('gestionCostos');
    if (!profiles.puede(actor, profiles.PERMISOS.SUELDOS) && out.personalAsignado?.some(p => p.eventSalary !== undefined)) forbidden.push('eventSalary');
    if (!profiles.puede(actor, profiles.PERMISOS.CONTABILIDAD) && out.estadosCompra?.some(e => e.montoPagado !== undefined)) forbidden.push('montoPagado');
  }
  const responsePass = allowed ? response?.success === true && forbidden.length === 0 && (kind !== 'dueno' || out?.gestionCostos?.total === 9500) : !!error && writes === 0;
  const preserved = JSON.stringify(stored.personalAsignado) === JSON.stringify(before.personalAsignado)
    && JSON.stringify(stored.estadosCompra) === JSON.stringify(before.estadosCompra)
    && JSON.stringify(stored.gestionCostos) === JSON.stringify(before.gestionCostos)
    && JSON.stringify(stored.planDePagos) === JSON.stringify(before.planDePagos);
  cases.push({ kind, allowed, responsePass, writes, error, forbidden, storedFinancialFieldsPreserved: preserved,
    salaryBefore: before.personalAsignado[0].eventSalary, salaryAfter: stored.personalAsignado?.[0]?.eventSalary ?? null,
    inputHadSalary: input.personalAsignado?.[0]?.eventSalary !== undefined, responseHadSalary: out?.personalAsignado?.[0]?.eventSalary !== undefined,
    updatedOperationalField: stored.invitacionDigital?.titulo, pass: responsePass && preserved });
}
const record = { source, hashes, cases, summary: { responsePass: cases.filter(c => c.responsePass).length,
  pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual save, assignment/profile gates, inline financial preservation, redactor and preserveFiestaSecrets; fake session, read and transaction/write adapters',
  limits: ['Not signed HTTP, SDK, production, real accounts or financial data', 'Seven profiles in this save guard, not all their portals',
    'The backend double calls actual preserveFiestaSecrets after mutation, matching actualizarFiesta ordering; no real database locking tested'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: record.summary, cases }));
if (record.summary.fail) process.exitCode = 1;
