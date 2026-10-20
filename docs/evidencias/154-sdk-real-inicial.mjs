import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
assert.equal(process.env.AK_ENTORNO_AISLADO, 'true');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8085');
assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY, 'false');
assert.match(process.cwd().replaceAll('\\', '/'), /\/ak-qa-153-[^/]+$/);
const output = new URL('154-sdk-real.json', import.meta.url);
assert.equal(fs.existsSync(output), false, 'Preserve receipt');
const require = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = require('typescript');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const hashes = {};
const read = file => {
  const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex'); return r.stdout;
};
const extract = (file, names) => {
  const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const found = new Set();
  const nodes = ast.statements.filter(n => {
    const matches = ts.isFunctionDeclaration(n) && n.name && names.includes(n.name.text) ? [n.name.text]
      : ts.isVariableStatement(n) ? n.declarationList.declarations.filter(d => ts.isIdentifier(d.name) && names.includes(d.name.text)).map(d => d.name.text) : [];
    matches.forEach(name => found.add(name)); return matches.length;
  });
  assert.deepEqual([...found].sort(), [...names].sort()); return nodes.map(n => n.getText(ast)).join('\n');
};
const evaluate = (code, modules = {}, globals = {}) => {
  const exports = {};
  const compiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const dependency = name => { if (name in modules) return modules[name]; throw new Error(`Unexpected dependency ${name}`); };
  Function('exports', 'require', ...Object.keys(globals), compiled)(exports, dependency, ...Object.values(globals)); return exports;
};
const profiles = evaluate(read('src/lib/auth/perfiles.ts'));
const privacy = evaluate(read('src/lib/fiesta/recortar-para-afuera.ts'), { '@/lib/auth/perfiles': profiles });
const signer = evaluate(read('src/lib/auth/session-token.ts'), { crypto, '@/lib/auth/session-constants': evaluate(read('src/lib/auth/session-constants.ts')) });
const teamSource = read('src/lib/auth/equipo-de-la-fiesta.ts');
const rawSource = extract('src/lib/fiesta/get-fiesta-raw.ts', ['getFiestaByIdRaw', 'preserveFiestaSecrets']);
const storeSource = extract('src/lib/generic-json-store.ts', ['sinIndefinidos', 'mutarDocumentoConTransaccion']);
const updateSource = read('src/lib/fiesta/actualizar-fiesta.ts');
const actionSource = extract('src/app/actions/fiesta/fiesta.actions.ts', [
  'CAMPOS_DE_PLATA_Y_CONTRATO', 'PAGO_DE_LA_COMPRA', 'tocaLaPlata', 'reponerLaPlata',
  'esEquipoParaFiesta', 'requireFiestaWriteAccess', 'validatePersonalAssignments', 'saveFiesta',
]);
const app = initializeApp({ projectId: 'demo-ak-producciones' }, `qa154-${crypto.randomUUID()}`);
const db = getFirestore(app);
const originalTransaction = db.runTransaction.bind(db);
let transactionCount = 0;
db.runTransaction = (...args) => { transactionCount++; return originalTransaction(...args); };
const clone = value => JSON.parse(JSON.stringify(value));
const ids = [];
const cases = [];
const employee = db.collection('empleados').doc('op151');
assert.equal((await employee.get()).exists, false, 'Fresh own emulator only');
await employee.set({ id: 'op151', nombre: 'QA154', email: 'qa151@qa.invalid' });
try {
  for (const kind of ['dueno', 'operador-asignado', 'operador-no-asignado', 'secretaria', 'personal', 'cliente', 'prospecto', 'invitado', 'anonimo']) {
    const profile = kind.startsWith('operador-') ? 'operador' : kind;
    const actor = kind === 'anonimo' ? null : { perfil: profile, role: 'admin', userId: profile === 'secretaria' ? 'sec151' : 'op151', email: 'qa151@qa.invalid' };
    const token = actor ? await signer.createSignedSessionToken(actor) : null;
    const verifySession = async () => { const r = await signer.verifySignedSessionToken(token); return r.isValid ? { success: true, user: r.user } : { success: false }; };
    const id = `qa154_${kind}_${crypto.randomUUID()}`; ids.push(id);
    const before = { id, configuracion: { nombreEvento: 'QA154 ficticio' }, gestionCostos: { total: 9500 },
      personalAsignado: [{ empleadoId: kind === 'operador-no-asignado' ? 'otro151' : 'op151', rolId: 'dj', eventSalary: 3000 }],
      estadosCompra: [{ proveedorId: 'a', proveedor: 'QA', pedido: false, pagado: true, montoPagado: 60.30 }],
      planDePagos: { cuotas: [{ id: 'cuota154', monto: 1000, pagada: true }] } };
    const ref = db.collection('fiestas').doc(id); await ref.set(before);
    const readData = async file => (await db.collection(file.split('/')[0]).doc(path.basename(file, '.json')).get()).data() ?? null;
    const raw = evaluate(rawSource, {}, { readData, FIESTAS_DIR: 'fiestas', reponerLoRecortado: privacy.reponerLoRecortado });
    const team = evaluate(teamSource, { 'server-only': {}, '@/lib/auth/perfiles': profiles, '@/lib/auth/session-token': { verifySession },
      '@/app/actions/empleados': { getEmpleados: async () => (await db.collection('empleados').get()).docs.map(d => d.data()) } });
    const store = evaluate(storeSource, { 'fs/promises': fsp, path }, { getDbAdmin: async () => db });
    let actions;
    const update = evaluate(updateSource, { '@/lib/fiesta/lectura-completa': { LECTURA_COMPLETA: Symbol('QA154') },
      '@/app/actions/fiesta/fiesta.actions': { requireFiestaWriteAccess: (...args) => actions.requireFiestaWriteAccess(...args), getFiestaById: async () => { throw new Error('Unexpected fallback'); } },
      '@/lib/generic-json-store': store, '@/lib/fiesta/get-fiesta-raw': raw, '@/lib/auth/equipo-de-la-fiesta': team });
    let writes = 0;
    const modules = { '@/lib/auth/session-token': { verifySession }, '@/lib/fiesta/get-fiesta-raw': raw, '@/lib/fiesta/recortar-para-afuera': privacy,
      '@/lib/fiesta/actualizar-fiesta': { actualizarFiesta: async (...args) => { const r = await update.actualizarFiesta(...args); if (r.success) writes++; return r; } } };
    actions = evaluate(actionSource, modules, { puede: profiles.puede, PERMISOS: profiles.PERMISOS, quienEsElEquipo: team.quienEsElEquipo,
      verifyPortalSession: async () => false, CAMPOS_DEL_EQUIPO: privacy.CAMPOS_DEL_EQUIPO, FIESTAS_DIR: 'fiestas',
      preserveFiestaSecrets: raw.preserveFiestaSecrets, writeData: async (_file, data) => { await ref.set(clone(data)); writes++; } });
    const input = privacy.recortarFiestaPorPerfil(clone(before), actor);
    input.invitacionDigital = { titulo: `Cambio QA154 ${kind}` };
    const countBefore = transactionCount;
    let response, error;
    try { response = await actions.saveFiesta(input); } catch (e) { error = String(e); }
    const stored = (await ref.get()).data();
    const allowed = ['dueno', 'operador-asignado', 'secretaria'].includes(kind);
    const responseValue = response?.fiesta;
    const forbidden = [];
    if (responseValue) {
      if (!profiles.puede(actor, profiles.PERMISOS.GANANCIAS) && responseValue.gestionCostos !== undefined) forbidden.push('gestionCostos');
      if (!profiles.puede(actor, profiles.PERMISOS.SUELDOS) && responseValue.personalAsignado?.some(p => p.eventSalary !== undefined)) forbidden.push('eventSalary');
      if (!profiles.puede(actor, profiles.PERMISOS.CONTABILIDAD) && responseValue.estadosCompra?.some(e => e.montoPagado !== undefined)) forbidden.push('montoPagado');
    }
    const preserved = stored.personalAsignado?.[0]?.eventSalary === 3000 && stored.gestionCostos?.total === 9500
      && stored.estadosCompra?.[0]?.montoPagado === 60.30 && stored.planDePagos?.cuotas?.[0]?.monto === 1000;
    const pass = preserved && forbidden.length === 0 && (allowed ? response?.success === true && stored.invitacionDigital?.titulo === input.invitacionDigital.titulo
      : !!error && writes === 0 && stored.invitacionDigital === undefined);
    cases.push({ kind, allowed, signedUserVerified: actor ? (await verifySession()).success : false, success: response?.success, error, forbidden,
      writes, sdkTransactions: transactionCount - countBefore, preserved, salaryStored: stored.personalAsignado?.[0]?.eventSalary, supplierPaymentStored: stored.estadosCompra?.[0]?.montoPagado, pass });
  }
} finally {
  for (const id of ids) {
    await db.collection('fiestas').doc(id).delete();
    for (const folder of ['data', 'src/data']) {
      const file = path.resolve(folder, 'fiestas', `${id}.json`);
      assert.ok(file.startsWith(path.resolve(process.cwd()) + path.sep)); assert.match(path.basename(file), /^qa154_/);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
  await employee.delete();
  const remaining = (await db.collection('fiestas').get()).size + (await db.collection('empleados').get()).size;
  await deleteApp(app);
  const result = { source, hashes, cases, transactionCount, remainingDemoDocuments: remaining,
    summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
    scope: 'Actual save/permission/profile/signature/preservation/update/transaction functions; real SDK to isolated demo emulator',
    limits: ['Not HTTP/Next cookies: session adapter verifies the actual synthetic signed token',
      'Employee fixture reads and owner direct-write use real SDK I/O adapters, not entire employee/readData/writeData modules',
      'No portal credential in negative profiles; not tests of their dedicated portals', 'No production, real data/accounts/providers/hardware or build certification'], appEdited: false };
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ source, summary: result.summary, transactionCount, remaining, cases }));
  if (result.summary.fail || remaining) process.exitCode = 1;
}
