import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '9b7ee982c5d6ff1377fccc0490abc85a9cfd8419';
const target = new URL('160-retest-portales-tareas.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Never overwrite a receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];
const copy = value => structuredClone(value);
const load = (file, names, context = {}) => {
  const p = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex');
  const ast = ts.createSourceFile(file, p.stdout, ts.ScriptTarget.Latest, true);
  const wanted = n => ts.isFunctionDeclaration(n) && names.includes(n.name?.text) ||
    ts.isVariableStatement(n) && n.declarationList.declarations.some(d => names.includes(d.name.getText(ast)));
  const selected = ast.statements.filter(n => !ts.isImportDeclaration(n) && !ts.isExportDeclaration(n) && (!names || wanted(n)));
  if (names) for (const name of names) assert.ok(selected.some(n =>
    ts.isFunctionDeclaration(n) && n.name?.text === name || ts.isVariableStatement(n) &&
    n.declarationList.declarations.some(d => d.name.getText(ast) === name)), `${file}:${name}`);
  const code = ts.transpileModule(selected.map(n => n.getText(ast)).join('\n'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText + (names ? `\nexports.__qa = {${names.join(',')}};` : '');
  const exports = {};
  vm.runInNewContext(code, { exports, Date, Math, URL, Request, Response, Buffer, console: { log() {}, warn() {}, error() {} },
    require: id => { throw new Error(`Unexpected dependency: ${id}`); }, ...context }, { filename: file, timeout: 3000 });
  return names ? exports.__qa : exports;
};
const run = async (name, action, predicate, expectThrow = false) => {
  try { const result = await action(); cases.push({ name, pass: !expectThrow && Boolean(predicate(result)), result }); }
  catch (error) { cases.push({ name, pass: expectThrow, thrown: String(error.message || error) }); }
};
const profiles = load('src/lib/auth/perfiles.ts');
let actor = null, readCalls = [], writes = 0, googleCalls = 0;
const verifySession = async () => actor ? { success: true, user: copy(actor) } : { success: false, error: 'QA no session' };
const session = load('src/lib/auth/require-session.ts', null, { ...profiles, verifySession });
const employees = ['a', 'b'].map(id => ({ id: `qa160-e${id}`, nombre: `Empleado ficticio ${id}`, email: `${id}@qa.invalid`, cedula: `QA-${id}` }));
const fixture = (id, assignments) => ({ id, estado: 'Planificacion', configuracion: {
  nombreEvento: `Fiesta ficticia ${id}`, fechaEvento: '2027-08-08', nombreLugar: 'Salon ficticio', invitadosEstimados: 100,
}, personalAsignado: assignments.map(([suffix, salary]) => ({ empleadoId: `qa160-e${suffix}`, rolId: 'mozo', eventSalary: salary })) });
const activeEvents = [fixture('qa160-fa', [['a', 1500.25], ['b', 9000.75]]), fixture('qa160-fb', [['b', 8000.5]])];
const archivedEvents = [fixture('qa160-archived', [['a', 700.5]])];
let accounts = ['a','b'].map(id => ({ id: `employee_qa160-e${id}`, kind: 'employee', employeeId: `qa160-e${id}`,
  email: `${id}@qa.invalid`, accessToken: `QA_ACCESS_${id}`, refreshToken: `QA_REFRESH_${id}`, status: 'connected' }));
const readData = async (file, fallback) => {
  readCalls.push(file);
  return copy(file === 'empleados.json' ? employees : file === '_google-workspace-accounts.json' ? accounts : fallback);
};
const directory = load('src/app/actions/empleados.ts', ['EMPLEADOS_FILE','getEmpleados','sinDatosPersonales'], { ...profiles, verifySession, readData });
const team = load('src/lib/auth/equipo-de-la-fiesta.ts', null, { ...profiles, verifySession,
  require: id => { assert.equal(id, '@/app/actions/empleados'); return directory; } });
const raw = load('src/lib/fiesta/leer-fiestas.ts', ['FIESTAS_DIR','ARCHIVE_DIR','leerHistorialCrudo','leerFiestasCrudas'], {
  leerColeccion: async dir => { readCalls.push(`collection:${dir}`); return copy(dir === 'archive' ? archivedEvents : activeEvents); },
});
const events = load('src/app/actions/fiesta/fiesta.actions.ts', ['getFiestas','requireEquipo','paraAfuera'], {
  ...session, ...team, ...raw, recortarFiestaPorPerfil: f => f, recortarFiestaParaAfuera: f => f,
  require: id => { assert.equal(id, '@/lib/auth/session-token'); return { verifySession }; },
});
const calendar = load('src/lib/google-workspace.ts', ['getFiestaTitle','getFiestaTimes','getRoleName','compactLines',
  'buildEmployeeCalendarEvent','googleCalendarDate','buildGoogleCalendarTemplateUrl','accountFromToken'], { process: { env: {} } });
const portal = load('src/app/actions/google-workspace.ts', ['ACCOUNTS_FILE','leerFichaDeEmpleado','readAccounts',
  'writeAccounts','upsertAccount','toPublicAccount','formatEmployeeEvent','getEmployeeWorkspacePortal','saveGoogleWorkspaceAccountFromOAuth'], {
  ...profiles, ...calendar, verifySession, readData, getEmpleados: directory.getEmpleados, getFiestas: events.getFiestas,
  ...raw, leerRolesInterno: async () => [{ id: 'mozo', nombre: 'Mozo' }], process: { env: {} },
  getGoogleUserEmail: async () => { googleCalls++; return 'a@qa.invalid'; },
  writeData: async (file, value) => { assert.equal(file, '_google-workspace-accounts.json'); writes++; accounts = copy(value); },
});
const setActor = (perfil, id = 'qa160-ea', email = 'a@qa.invalid') => {
  actor = { userId: id, email, perfil, role: perfil === 'dueno' ? 'admin' : 'user' }; readCalls = [];
};
for (const perfil of ['dueno','secretaria','operador','personal','cliente','prospecto','invitado']) {
  setActor(perfil, perfil === 'personal' ? 'qa160-ea' : `qa160-${perfil}`, perfil === 'personal' ? 'a@qa.invalid' : `${perfil}@qa.invalid`);
  const allow = perfil === 'personal' || perfil === 'dueno';
  await run(`portal-profile-${perfil}`, () => portal.getEmployeeWorkspacePortal('qa160-ea'), r => allow
    ? r.employee?.id === 'qa160-ea' && r.events.length === 2 && r.events.every(e => [1500.25,700.5].includes(e.salary))
    : r.employee === null && r.events.length === 0 && !readCalls.some(f => f.startsWith('collection:')));
}
setActor('personal');
await run('own-events-exclude-other-salary-and-unassigned-event', () => portal.getEmployeeWorkspacePortal('qa160-ea'), r =>
  r.events.map(e => e.fiestaId).sort().join(',') === 'qa160-archived,qa160-fa' && !JSON.stringify(r).includes('9000.75') && !JSON.stringify(r).includes('8000.5'));
await run('calendar-template-does-not-include-other-salary', () => portal.getEmployeeWorkspacePortal('qa160-ea'), r =>
  r.events.every(e => { const details = new URL(e.calendarTemplateUrl).searchParams.get('details'); return details.includes(String(e.salary)) && !details.includes('9000.75'); }));
await run('public-account-hides-access-and-refresh-tokens', () => portal.getEmployeeWorkspacePortal('qa160-ea'), r =>
  r.googleAccount.employeeId === 'qa160-ea' && !JSON.stringify(r).includes('QA_ACCESS') && !JSON.stringify(r).includes('QA_REFRESH'));
await run('other-employee-denied-before-reading-events-accounts', () => { readCalls = []; return portal.getEmployeeWorkspacePortal('qa160-eb'); }, r =>
  r.employee === null && r.events.length === 0 && !readCalls.some(f => f.startsWith('collection:') || f === '_google-workspace-accounts.json'));
setActor('personal', 'other-id', ' A@QA.INVALID ');
await run('own-verified-email-matches-case-and-trim', () => portal.getEmployeeWorkspacePortal('qa160-ea'), r => r.employee?.id === 'qa160-ea' && r.events.length === 2);
setActor('personal');
await run('general-directory-remains-denied', () => directory.getEmpleados(), () => false, true);
await run('general-events-remain-denied', () => events.getFiestas(), () => false, true);
actor = null; readCalls = [];
await run('anonymous-denied-before-data-read', () => portal.getEmployeeWorkspacePortal('qa160-ea'), r => r.employee === null && readCalls.length === 0);
const token = { access_token: 'QA_NEW_ACCESS', refresh_token: 'QA_NEW_REFRESH', expires_in: 3600 };
setActor('personal');
await run('own-google-credential-save-uses-narrow-reader', () => portal.saveGoogleWorkspaceAccountFromOAuth({ kind: 'employee', employeeId: 'qa160-ea', token }), r =>
  r.success && writes === 1 && googleCalls === 1 && !JSON.stringify(r).includes('QA_NEW_ACCESS') && accounts[0].accessToken === 'QA_NEW_ACCESS' && accounts[1].accessToken === 'QA_ACCESS_b');
await run('other-google-account-save-denied-no-write', () => portal.saveGoogleWorkspaceAccountFromOAuth({ kind: 'employee', employeeId: 'qa160-eb', token }), () => false, true);
await run('company-google-account-save-denied-to-personal', () => portal.saveGoogleWorkspaceAccountFromOAuth({ kind: 'company', token }), () => false, true);
await run('missing-employee-google-save-denied', () => portal.saveGoogleWorkspaceAccountFromOAuth({ kind: 'employee', token }), () => false, true);
await run('denied-saves-never-call-provider-or-write', async () => ({ writes, googleCalls }), r => r.writes === 1 && r.googleCalls === 1);

const fixed = Date.parse('2026-10-21T15:00:00Z');
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [fixed])); } static now() { return fixed; } }
const marker = 'QA160-PRIVATE-CLIENT';
for (const task of ['prospectos-seguimiento','fiesta-proxima-revision']) for (const variant of ['anonymous-no-secret',
  'configured-no-key','configured-wrong-key','configured-correct-header','configured-correct-query','no-secret-throttled','worker-throws']) {
  const env = variant.startsWith('configured') ? { CRON_SECRET: 'qa160-secret' } : {};
  let engineCalls = 0, marks = 0;
  const store = { 'presupuestos.json': [{ id: 'qa160-budget', estado: 'Enviado', clienteNombre: marker, clienteContacto: '00000000',
    eventoTipo: 'Evento ficticio', timestamp: '2026-10-15T15:00:00Z', eventoFecha: '2027-08-08' }],
    'fiestas.json': [], 'scheduled-messages.json': [], 'alertas-descartadas.json': [], 'agentes-historial.json': [], 'agentes-configuracion.json': [] };
  const gate = load('src/lib/automatico/puerta-de-las-tareas.ts', null, { process: { env },
    enforcePublicRateLimit: async () => { if (variant === 'no-secret-throttled') throw new Error('QA throttle'); } });
  const engineName = task === 'prospectos-seguimiento' ? 'ejecutarPerseguidorPresupuestos' : 'ejecutarVigilanteFiestas';
  const engine = load('src/lib/agentes/motor-agentes.ts', ['CONFIG_FILE','HISTORIAL_FILE','MAX_HISTORIAL','getConfiguracionAgentes',
    'guardarConfiguracionAgentes','registrarEjecucionAgente',engineName], { Date: Clock,
    readData: async file => copy(store[file] || []), writeData: async (file, value) => { store[file] = copy(value); },
    AGENTES_DEFAULT_CONFIG: [{ id: 'perseguidor_presupuestos' },{ id: 'vigilante_fiestas' }],
    detectarErroresHumanos: () => [{ urgencia: 'urgente_7_dias', fiestaNombre: marker, titulo: 'Pendiente ficticio', descripcion: 'Detalle interno QA' }],
  });
  const route = load(`src/app/api/cron/${task}/route.ts`, null, { Date: Clock, ...gate,
    NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json' } }) },
    [engineName]: async date => { engineCalls++; if (variant === 'worker-throws') throw new Error('QA storage unavailable'); return engine[engineName](date); },
    marcarCorrida: async () => { marks++; },
  });
  const headers = variant === 'configured-correct-header' ? { Authorization: 'Bearer qa160-secret' } :
    variant === 'configured-wrong-key' ? { Authorization: 'Bearer wrong' } : {};
  await run(`${task}-${variant}`, async () => {
    const response = await route.GET(new Request(`https://qa.invalid/api/cron/${task}${variant === 'configured-correct-query' ? '?clave=qa160-secret' : ''}`, { headers }));
    return { status: response.status, body: await response.json(), engineCalls, marks, prepared: store['scheduled-messages.json'].length };
  }, r => {
    const expected = ['configured-no-key','configured-wrong-key'].includes(variant) ? 401 : variant === 'no-secret-throttled' ? 429 : variant === 'worker-throws' ? 500 : 200;
    const withKey = variant.startsWith('configured-correct');
    return r.status === expected && (withKey ? JSON.stringify(r.body).includes(marker) : !JSON.stringify(r.body).includes(marker)) &&
      (expected === 401 || expected === 429 ? r.engineCalls === 0 && r.marks === 0 : variant === 'worker-throws' ? r.marks === 0 : r.engineCalls === 1 && r.marks === 1) &&
      (variant !== 'anonymous-no-secret' || JSON.stringify(r.body) === '{"ok":true,"recortada":true}');
  });
}
const result = { source, testSha256: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), hashes, cases,
  summary: { total: cases.length, pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Orders200/201: actual portal/action/profile/guard/raw-filter/calendar/token-DTO and cron/gate/engine bodies composed with fictional I/O',
  limits: ['No real session cookie, HTTP server, Firestore transaction or Google OAuth/network',
    'Calendar helpers real; fixture collections and accounts controlled, no external sync or delivery certified',
    'Cron two actual handlers and engines, conditional no-secret fixture; not production configuration or all eleven engines'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: result.summary, failed: cases.filter(c => !c.pass) }));
if (result.summary.fail) process.exitCode = 1;
