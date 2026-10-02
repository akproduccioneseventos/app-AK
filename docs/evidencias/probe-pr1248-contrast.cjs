const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../.audit-runtime-62dcb2c/akproduccioneseventos-app-AK-62dcb2c');
const ts = require(path.join(root, 'node_modules/typescript'));
const source = process.argv[2]
  ? { sha: process.argv[3] || 'unverified-checkout', files: null }
  : JSON.parse(fs.readFileSync(path.join(__dirname, 'pr1248-focused-source.json'), 'utf8'));
const clone = (v) => JSON.parse(JSON.stringify(v));
function load(file, mocks = {}) {
  const input = source.files ? source.files[file] : fs.readFileSync(path.join(root, file), 'utf8');
  const js = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, console, URLSearchParams, require: (key) => {
    if (!(key in mocks)) throw new Error('Unexpected dependency: ' + key);
    return mocks[key];
  } });
  return exports;
}
async function employee() {
  let received;
  const mod = load('src/app/actions/asistente-proactivo.actions.ts', {
    '@/lib/auth/session-token': { verifySession: async () => ({ success: true, user: { name: 'Employee Fixture', role: 'employee', email: 'fixture@example.invalid' } }) },
    '@/lib/asistente/propuestas-service': { getPropuestasParaUsuario: async (...args) => { received = args; return []; }, getResumenMientrasNoEstabas: async () => null },
    '@/lib/asistente/avisar-al-duenio': { getAsistenteSettings: async () => ({ fixture: true }) },
  });
  const result = await mod.getBandejaAsistenteAction();
  return { treatedAsOwner: result.esDuenio, name: result.usuarioNombre, serviceOwnerArgument: received[1] };
}
async function proposals() {
  let rows = [];
  let count = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const mod = load('src/lib/asistente/propuestas-service.ts', {
    '@/lib/data-service': {
      readData: async (file) => {
        if (file !== 'asistente-propuestas.json') return [];
        const snapshot = clone(rows);
        if (++count === 2) release();
        await gate;
        return snapshot;
      },
      writeData: async (_, value) => { rows = clone(value); },
    },
    '@/lib/multiagent/memory-store': {}, '@/app/actions/multiagent': {}, '@/app/actions/scheduled-messages': {}, '@/lib/whatsapp/internal-token': {},
  });
  const result = await Promise.all(['A', 'B'].map((clave) => mod.agregarPropuestasDeduplicadas([{ clave, titulo: clave, area: 'fiestas', quePasa: 'fixture', porQueImporta: 'fixture', quePropone: 'fixture' }])));
  return { acknowledged: result.reduce((n, r) => n + r.agregadas.length, 0), persisted: rows.length };
}
async function task(data) {
  let written;
  const tasks = [{ id: 'salon', texto: 'Confirmar proveedor del salon' }, { id: 'comida', texto: 'Confirmar proveedor de comida' }];
  const mod = load('src/app/actions/multiagent.ts', {
    '@/lib/multiagent/memory-store': { saveAgentLearning: async () => {}, listAgentMemoryProfiles: async () => [] },
    '@/lib/multiagent/chat-store': { appendMultiAgentChatTurn: async () => ({ id: 'fixture' }), listMultiAgentChatSessions: async () => [] },
    '@/lib/multiagent/diagnostics': {},
    '@/app/actions/fiesta/fiesta.actions': { getFiestaById: async () => ({ id: 'fixture', tareas: clone(tasks) }) },
    '@/lib/notifications/create-notification': {},
    '@/lib/auth/session-token': { verifySession: async () => ({ success: true }) },
    '@/lib/auth/require-session': { requireAppSession: async () => ({}) },
    '@/ai/flows/multiagent-flow': { runMultiAgent: async () => ({ success: true, response: 'Fixture', agentType: 'fiesta', agentName: 'Test', action: { type: 'complete_task', data } }) },
    '@/app/actions/fiesta/tareas.actions': { updateTareas: async (_, value) => { written = clone(value); return { success: true }; } },
    '@/lib/fiesta/lectura-completa': { LECTURA_COMPLETA: Symbol('fixture') },
  });
  await mod.sendPersistentMultiAgentMessage({ message: 'Fixture', fiestaId: 'fixture', agentType: 'fiesta' });
  return written?.filter((t) => t.completada).map((t) => t.id) ?? [];
}
(async () => {
  const contract = load('src/lib/contract-template.ts', { '@/lib/utils': { hoyEnUruguay: () => '2026-10-01' } });
  const text = contract.replaceContractPlaceholders('{{FECHA_EVENTO}}', { fechaEvento: '15/12/2026 a las 21:00' });
  const measurement = load('src/lib/medicion-segura.ts');
  const results = {
    sha: source.sha, scope: 'Real TypeScript with mocked storage/session/model; no network, browser, production data or build',
    employee: await employee(), proposals: await proposals(),
    contract: { input: '15/12/2026 a las 21:00', output: text, keepsTime: text.includes('21:00') },
    taskExactId: await task({ tareaId: 'comida', texto: 'Confirmar proveedor' }),
    taskAmbiguous: await task({ texto: 'Confirmar proveedor' }),
    measurement: { guestAllowed: measurement.sePuedeMedir('/invitacion/A/invitado/B'), cleaned: measurement.direccionParaMedir('/bodas', '?token=fixture-private&utm_source=ig') },
  };
  assert.deepEqual(results.taskExactId, ['comida']);
  assert.deepEqual(results.taskAmbiguous, []);
  assert.equal(results.measurement.guestAllowed, false);
  assert.equal(results.measurement.cleaned, '/bodas?utm_source=ig');
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });

