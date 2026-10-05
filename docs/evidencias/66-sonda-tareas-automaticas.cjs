const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const taskRoot = path.resolve(__dirname, '../..');
let clock = Date.parse('2026-10-05T12:00:00Z');
const persisted = new Map();
const marks = [];
const data = {
  async readData(file, fallback) {
    return JSON.parse(JSON.stringify(persisted.has(file) ? persisted.get(file) : fallback));
  },
  async writeData(file, value) { persisted.set(file, JSON.parse(JSON.stringify(value))); },
};
const modules = { 'server-only': {}, '@/lib/data-service': data };

function load(relativePath, mocks = modules) {
  const sourcePath = path.join(taskRoot, relativePath);
  const output = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require(name) {
      if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
      return mocks[name];
    },
    Date: class extends Date { static now() { return clock; } },
    console,
  }, { filename: sourcePath });
  return exports;
}

(async () => {
  const lockPath = 'src/lib/automatico/control-concurrencia.ts';
  const processA = load(lockPath);
  const processB = load(lockPath);
  const simultaneous = await Promise.all([
    processA.intentarAdquirirLock('visita'),
    processB.intentarAdquirirLock('despertador'),
  ]);
  assert.equal(simultaneous.filter(Boolean).length, 2);
  console.log(JSON.stringify({ case: 'dos instancias', acquired: simultaneous, expectedAcquired: 1 }));

  persisted.clear();
  const oldOwner = load(lockPath);
  const newOwner = load(lockPath);
  const thirdOwner = load(lockPath);
  assert.equal(await oldOwner.intentarAdquirirLock('visita'), true);
  clock += 6 * 60 * 1000;
  assert.equal(await newOwner.intentarAdquirirLock('despertador'), true);
  await oldOwner.liberarLock();
  const thirdAcquired = await thirdOwner.intentarAdquirirLock('app');
  assert.equal(thirdAcquired, true);
  console.log(JSON.stringify({ case: 'dueno viejo libera el candado del nuevo', thirdAcquired, expected: false }));

  persisted.clear();
  const ok = async () => ({});
  const fail = async () => { throw new Error('Fallo sintetico del servicio'); };
  const dispatcher = load('src/lib/automatico/al-entrar-a-la-app.ts', {
    ...modules,
    '@/lib/automatico/control-concurrencia': { intentarAdquirirLock: async () => true, liberarLock: ok },
    '@/lib/automatico/tareas-automaticas': { marcarCorrida: async (id) => { marks.push(id); } },
    '@/lib/presencia-digital/guardado-diario': { guardarMetricasDelDia: fail },
    '@/lib/social-media/comments-backfill': { syncCommentsFromNetworks: fail },
    '@/lib/presencia-digital/publicador': { procesarPosteosProgramados: ok },
    '@/lib/marketing-automation': { runMarketingAutomation: ok },
    '@/app/actions/invoices': { ejecutarEscaneoDeRecordatorios: fail },
    '@/app/actions/notifications': { checkAndCreateReunionReminders: fail },
    '@/lib/whatsapp/internal-token': { WHATSAPP_AUTOMATION_INTERNAL_TOKEN: Symbol('test') },
    '@/lib/automatico/posicionamiento-diario': { ejecutarRevisionPosicionamiento: ok },
    '@/lib/agentes/motor-agentes': {
      ejecutarVigilanteFiestas: ok, ejecutarPerseguidorPresupuestos: ok, ejecutarAgentesAutonomos: ok,
    },
    '@/lib/whatsapp/avisos-al-cliente': { correrTareaAvisosAlCliente: ok },
    '@/lib/invitaciones/recordatorio-no-abiertas': { correrTareaRecordarInvitacionNoAbierta: ok },
  });
  const result = await dispatcher.ponerAlDiaAlEntrar(new Date(clock), 'despertador');
  assert.equal(result.fallaron.length, 0);
  assert.ok(result.corrio.includes('metricas'));
  assert.ok(result.corrio.includes('recordatorios'));
  assert.ok(marks.includes('metricas-de-redes'));
  assert.ok(marks.includes('recordatorios-de-pago'));
  console.log(JSON.stringify({
    case: 'servicios fallidos se marcan como corrida correcta',
    failedServices: 4,
    reportedFailures: result.fallaron,
    markedCompleted: marks.filter((id) => ['metricas-de-redes', 'recordatorios-de-pago'].includes(id)),
    nextAttemptDelayedBySavedState: !!persisted.get('tareas-al-entrar-estado.json')?.ultimaCorrida.metricas,
  }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
