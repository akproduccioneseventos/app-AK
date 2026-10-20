import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const target = new URL('156-portales-cruzados-final.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];
const copy = value => structuredClone(value);
const quiet = { log() {}, warn() {}, error() {} };
const load = (file, names, context = {}) => {
  const p = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr); hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex');
  const ast = ts.createSourceFile(file, p.stdout, ts.ScriptTarget.Latest, true);
  const selected = ast.statements.filter(n => !ts.isImportDeclaration(n) && !ts.isExportDeclaration(n) &&
    (!names || ts.isFunctionDeclaration(n) && n.name && names.includes(n.name.text) ||
      ts.isVariableStatement(n) && n.declarationList.declarations.some(d => ts.isIdentifier(d.name) && names.includes(d.name.text))));
  if (names) for (const name of names) assert.ok(selected.some(n => ts.isFunctionDeclaration(n) && n.name?.text === name || ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(ast) === name)), `${file}:${name}`);
  const extra = names ? `\nexports.__qa = {${names.join(',')}};` : '';
  const code = ts.transpileModule(selected.map(n => n.getText(ast)).join('\n'), { fileName: file, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText + extra;
  const exports = {};
  vm.runInNewContext(code, { exports, Buffer, Date, Math, crypto, console: quiet, structuredClone,
    require: id => { throw new Error(`Unexpected dependency ${id}`); }, ...context }, { filename: file, timeout: 3000 });
  return names ? exports.__qa : exports;
};
const run = async (name, expected, action, predicate) => {
  try { const result = await action(); cases.push({ name, expected, pass: Boolean(predicate(result)), result }); }
  catch (error) { cases.push({ name, expected, pass: expected === 'deny', thrown: String(error.message || error) }); }
};
const profiles = load('src/lib/auth/perfiles.ts');
let actor = null;
const verifySession = async () => actor ? { success: true, user: copy(actor) } : { success: false, error: 'QA no session' };
const session = load('src/lib/auth/require-session.ts', null, { ...profiles, verifySession });

// Employee portal: compose its REAL directory and event guards, not mocked success.
const employees = [{ id: 'qa156-ea', nombre: 'Empleado ficticio A', email: 'ea@qa.invalid', cedula: 'QA-A' },
  { id: 'qa156-eb', nombre: 'Empleado ficticio B', email: 'eb@qa.invalid', cedula: 'QA-B' }];
const directory = load('src/app/actions/empleados.ts', ['EMPLEADOS_FILE','getEmpleados','sinDatosPersonales'], {
  ...profiles, verifySession, readData: async () => copy(employees),
});
const team = load('src/lib/auth/equipo-de-la-fiesta.ts', null, { ...profiles, verifySession,
  require: id => { assert.equal(id, '@/app/actions/empleados'); return directory; } });
const events = load('src/app/actions/fiesta/fiesta.actions.ts', ['getFiestas','requireEquipo','paraAfuera'], {
  ...session, ...team, leerFiestasCrudas: async () => [],
  recortarFiestaPorPerfil: f => f, recortarFiestaParaAfuera: f => f,
  require: id => { assert.equal(id, '@/lib/auth/session-token'); return { verifySession }; },
});
const employeeNames = ['ACCOUNTS_FILE','toPublicAccount','readAccounts','getEmployeeWorkspacePortal'];
const employeeContext = { ...profiles, verifySession, leerRolesInterno: async () => [], readData: async () => [],
  getEmpleados: directory.getEmpleados, getFiestas: events.getFiestas };
const portalEmployee = load('src/app/actions/google-workspace.ts', employeeNames, employeeContext);
for (const kind of ['dueno','secretaria','operador','personal','cliente','prospecto','invitado']) {
  actor = { userId: kind === 'personal' ? 'qa156-ea' : `qa156-${kind}`, email: kind === 'personal' ? 'ea@qa.invalid' : `${kind}@qa.invalid`, perfil: kind, role: kind === 'dueno' ? 'admin' : 'user' };
  const shouldOpen = kind === 'dueno' || kind === 'personal';
  await run(`employee-own-${kind}-real-call-chain`, shouldOpen ? 'own portal allowed' : 'deny',
    () => portalEmployee.getEmployeeWorkspacePortal('qa156-ea'), r => shouldOpen ? r.employee?.id === 'qa156-ea' : r.employee === null && Boolean(r.error));
}
actor = { userId: 'different-session-id', email: ' EA@QA.INVALID ', perfil: 'personal', role: 'user' };
await run('employee-own-matching-verified-email-real-call-chain', 'own portal allowed',
  () => portalEmployee.getEmployeeWorkspacePortal('qa156-ea'), r => r.employee?.id === 'qa156-ea');
actor = { userId: 'qa156-ea', email: 'ea@qa.invalid', perfil: 'personal', role: 'user' };
await run('employee-other-denied', 'deny', () => portalEmployee.getEmployeeWorkspacePortal('qa156-eb'), r => r.employee === null && Boolean(r.error));
await run('general-directory-stays-denied-to-personal', 'deny', () => directory.getEmpleados(), () => false);
await run('general-events-stay-denied-to-personal', 'deny', () => events.getFiestas(), () => false);
const portalWithDirectoryAdapter = load('src/app/actions/google-workspace.ts', employeeNames, {
  ...employeeContext, getEmpleados: async () => copy(employees),
});
await run('employee-own-after-only-directory-adapter-still-blocked-by-events', 'own portal allowed',
  () => portalWithDirectoryAdapter.getEmployeeWorkspacePortal('qa156-ea'), r => r.employee?.id === 'qa156-ea');
actor = null;
await run('employee-anonymous-denied', 'deny', () => portalEmployee.getEmployeeWorkspacePortal('qa156-ea'), r => r.employee === null && Boolean(r.error));

// Two supplier tokens and events; storage is controlled, business action bodies are real.
const initialProviders = ['a','b'].map(id => ({ id: `qa156-p${id}`, token: `qa156-token-${id}`, fiestaId: `qa156-f${id}`,
  nombreProveedor: 'Proveedor ficticio mismo nombre', activo: true, venceEl: '2099-01-01T00:00:00Z',
  tareas: [{ id: `qa156-task-${id}`, descripcion: 'Tarea ficticia', completada: false }], estadoActual: 'Pendiente' }));
let providerRecords = copy(initialProviders), writes = 0;
const provider = load('src/app/actions/provider-portal.ts', null, { ...session, ...profiles,
  readData: async () => copy(providerRecords),
  updateDataItem: async (_file, _collection, id, value) => {
    const index = providerRecords.findIndex(p => p.id === id); if (index < 0) return null;
    providerRecords[index] = copy(value); writes++; return copy(value);
  }, randomUUID: crypto.randomUUID,
});
await run('provider-token-a-only-event-a', 'own event', () => provider.getProveedorByToken('qa156-token-a'), r => r.success && r.data.fiestaId === 'qa156-fa');
await run('provider-token-b-only-event-b', 'own event', () => provider.getProveedorByToken('qa156-token-b'), r => r.success && r.data.fiestaId === 'qa156-fb');
await run('provider-unknown-token-denied', 'deny', () => provider.getProveedorByToken('qa156-no-token'), r => !r.success && !r.data);
providerRecords[0].activo = false;
await run('provider-revoked-token-denied', 'deny', () => provider.getProveedorByToken('qa156-token-a'), r => !r.success && !r.data);
providerRecords = copy(initialProviders); providerRecords[0].venceEl = '2000-01-01T00:00:00Z';
await run('provider-expired-token-denied', 'deny', () => provider.confirmarLlegada('qa156-token-a'), r => !r.success && writes === 0);
providerRecords = copy(initialProviders);
await run('provider-cannot-toggle-other-event-task', 'deny', () => provider.toggleTareaProveedor('qa156-token-a', 'qa156-task-b'), r => !r.success && writes === 0);
await run('provider-invalid-state-denied', 'deny', () => provider.updateProveedorEstado('qa156-token-a', 'Invalid QA'), r => !r.success && writes === 0);
await run('provider-arrival-preserves-other-event', 'own write only', () => provider.confirmarLlegada('qa156-token-a'),
  r => r.success && providerRecords[0].estadoActual === 'Llegó' && JSON.stringify(providerRecords[1]) === JSON.stringify(initialProviders[1]));
await run('provider-task-preserves-other-event', 'own write only', () => provider.toggleTareaProveedor('qa156-token-a', 'qa156-task-a'),
  r => r.success && providerRecords[0].tareas[0].completada && JSON.stringify(providerRecords[1]) === JSON.stringify(initialProviders[1]));
await run('provider-departure-preserves-other-event', 'own write only', () => provider.confirmarPartida('qa156-token-a'),
  r => r.success && providerRecords[0].estadoActual === 'Completó' && JSON.stringify(providerRecords[1]) === JSON.stringify(initialProviders[1]));

// Client session uses the actual HMAC signer/verifier, current key and actual DTO.
const secret = 'QA156-only-fictional-secret-not-a-production-credential';
const raw = new Map(['a','b'].map(id => [`qa156-f${id}`, { id: `qa156-f${id}`, configuracion: { nombreEvento: `Evento ficticio ${id}` },
  clientPortalSettings: { enabled: true, accessKey: `qa156-key-${id}` }, invitados: [], gestionCostos: { total: 9500 },
  personalAsignado: [{ empleadoId: `qa156-e${id}`, eventSalary: 3000 }],
  programa: [{ id: 'public', titulo: 'Momento cliente' }, { id: 'private', titulo: 'Solo equipo', visibleParaCliente: false }] }]));
let cookieValue;
const cookieStore = { get: () => cookieValue ? { value: cookieValue } : undefined, set: (_name, value) => { cookieValue = value; } };
const readRaw = async id => copy(raw.get(id) || null);
const clientSession = load('src/lib/security/portal-session.ts', null, { ...crypto,
  process: { env: { NODE_ENV: 'production', AK_SESSION_SECRET: secret } }, cookies: async () => cookieStore,
  require: id => { assert.equal(id, '@/lib/fiesta/get-fiesta-raw'); return { getFiestaByIdRaw: readRaw }; },
});
const mapper = load('src/lib/client-portal/public-fiesta.ts');
const client = load('src/app/actions/fiesta/portal.actions.ts', ['initializePortalSession','getFiestaForPortalSession','getFiestaByAccessKey'], {
  ...clientSession, ...mapper, getFiestaByIdRaw: readRaw, leerFiestasCrudas: async () => copy([...raw.values()]),
  sanitizeActionError: () => 'QA read error', process: { env: { AK_USE_LOCAL_JSON_ONLY: 'true' } },
});
await run('client-a-login-and-current-event-only', 'own event', async () => {
  const login = await client.initializePortalSession('qa156-fa', 'qa156-key-a');
  const own = await client.getFiestaForPortalSession('qa156-fa');
  const other = await client.getFiestaForPortalSession('qa156-fb'); return { login, own, other };
}, r => r.login.success && r.own?.id === 'qa156-fa' && r.other === null && !r.own.gestionCostos && (r.own.personalAsignado ?? []).length === 0 && !r.own.clientPortalSettings.accessKey && r.own.programa.length === 1);
await run('client-cross-event-key-denied', 'deny', () => client.initializePortalSession('qa156-fb', 'qa156-key-a'), r => !r.success);
await run('client-b-login-and-cannot-read-a', 'own event', async () => {
  const login = await client.initializePortalSession('qa156-fb', 'qa156-key-b');
  return { login, own: await client.getFiestaForPortalSession('qa156-fb'), other: await client.getFiestaForPortalSession('qa156-fa') };
}, r => r.login.success && r.own?.id === 'qa156-fb' && r.other === null);
raw.get('qa156-fb').clientPortalSettings.accessKey = 'qa156-rotated-b';
await run('client-key-rotation-revokes-existing-cookie', 'deny', () => client.getFiestaForPortalSession('qa156-fb'), r => r === null);
cookieValue = clientSession.createPortalSession('qa156-fa', 'qa156-key-a');
raw.get('qa156-fa').clientPortalSettings.enabled = false;
await run('client-disabled-portal-revokes-existing-cookie', 'deny', () => client.getFiestaForPortalSession('qa156-fa'), r => r === null);
raw.get('qa156-fa').clientPortalSettings.enabled = true;
cookieValue += 'tampered';
await run('client-tampered-signature-denied', 'deny', () => client.getFiestaForPortalSession('qa156-fa'), r => r === null);
const fingerprint = crypto.createHash('sha256').update('qa156-key-a').digest('hex');
const expired = `qa156-fa:${fingerprint}:${Date.now() - 1000}`;
cookieValue = expired + '.' + crypto.createHmac('sha256', secret).update(expired).digest('hex');
await run('client-expired-signed-cookie-denied', 'deny', () => client.getFiestaForPortalSession('qa156-fa'), r => r === null);
await run('client-key-lookup-does-not-return-other-event', 'own event', () => client.getFiestaByAccessKey('qa156-key-a'), r => r?.id === 'qa156-fa');
await run('client-old-key-lookup-denied-after-rotation', 'deny', () => client.getFiestaByAccessKey('qa156-key-b'), r => r === null);
await run('client-blank-key-denied', 'deny', () => client.getFiestaByAccessKey(' '), r => r === null);

const result = { source, testSha256: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), hashes, cases, summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual portal action bodies, profiles, upstream employee/event permission guards, client HMAC session and client mapper; two fictional employees/events/provider tokens',
  limits: ['Storage, app-session user and Next cookies are controlled adapters, not HTTP/SDK or UI',
    'Employee fixture has no assigned events: demonstrates self-access blocked before assignment display, not salary/calendar correctness',
    'Provider writes are in-memory: not real persistence/concurrency or arrival hardware',
    'Client key lookup exercises JSON compatibility reader, not Firestore index/query; no external accounts or production data'],
  appEdited: false, built: false, merged: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: result.summary, failed: cases.filter(c => !c.pass) }));
if (result.summary.fail) process.exitCode = 1;
