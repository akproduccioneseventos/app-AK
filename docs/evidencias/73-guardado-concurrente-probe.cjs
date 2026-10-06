// Real actions, permission helpers and Firestore-sync branch; synthetic database only.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const sha = process.argv[2] || '368988bb64e823d31c9d5c4b2fb9adc114b207ef';
const copy = structuredClone;
const original = {
  id: 'synthetic73', configuracion: { nombreEvento: 'Prueba aislada' },
  personalAsignado: [{ empleadoId: 'synthetic-operator' }],
  estado: 'En Planificacion', contratoFirmaInfo: { isSigned: false },
  planDePagos: { id: 'plan73', cuotas: [{ id: 'c73', monto: 1000, montoPagado: 0, estado: 'pendiente' }] },
  estadosCompra: [{ proveedor: 'Synthetic supplier', pagado: false }],
};
let fiesta = copy(original);
let writes = 0;
let beforeSet = null;
let user = { userId: 'synthetic-operator', email: 'synthetic@example.invalid', perfil: 'operador' };
let portal = false;
function mergeMaps(current, incoming) {
  const result = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? mergeMaps(current?.[key] || {}, value) : copy(value);
  }
  return result;
}
const db = {
  collection(collection) {
    assert.equal(collection, 'fiestas');
    return { doc(id) {
      assert.equal(id, original.id);
      return { async set(data, options) {
        assert.equal(options.merge, true);
        if (beforeSet) { const hook = beforeSet; beforeSet = null; hook(); }
        fiesta = mergeMaps(fiesta, data);
        writes++;
      } };
    } };
  },
};
const real = new Set([
  'src/app/actions/fiesta/fiesta.actions.ts', 'src/lib/auth/perfiles.ts',
  'src/lib/auth/require-session.ts', 'src/lib/auth/equipo-de-la-fiesta.ts',
  'src/lib/auth/event-access.ts', 'src/lib/fiesta/get-fiesta-raw.ts',
  'src/lib/fiesta/recortar-para-afuera.ts', 'src/lib/firebase-sync.ts',
  'src/lib/budget/los-cobros-no-se-pisan.ts', 'src/lib/marca-de-lectura.ts',
]);
const mocks = {
  'server-only': {},
  '@/lib/auth/session-token': { verifySession: async () => ({ success: !!user, user }) },
  '@/lib/security/portal-session': { verifyPortalSession: async id => portal && id === original.id },
  '@/app/actions/empleados': { getEmpleados: async () => [{ id: 'synthetic-operator', email: 'synthetic@example.invalid' }] },
  '@/lib/fiesta/leer-fiestas': { leerFiestasCrudas: async () => [copy(fiesta)], leerHistorialCrudo: async () => [] },
  '@/lib/data-service': {
    readData: async () => copy(fiesta),
    writeData: async (file, value) => load('src/lib/firebase-sync.ts').syncToFirestore(file, value),
    updateDataPartial: async (file, value) => load('src/lib/firebase-sync.ts').syncToFirestore(file, value),
  },
  '@/lib/logger': { shouldSkipFirestoreDuringBuild: () => false, info() {}, warn() {}, error() {} },
  '@/lib/firebase/server': { dbAdmin: db },
};
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const exports = {}; cache.set(relative, exports);
  const filename = path.join(root, relative);
  const source = execFileSync('git', ['show', `${sha}:${relative}`], { cwd: root, encoding: 'utf8' });
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, console, Date, structuredClone, setTimeout, clearTimeout,
    process: { env: { NODE_ENV: 'test' }, cwd: () => root },
    require(name) {
      if (name in mocks) return mocks[name];
      if (['path', 'crypto'].includes(name)) return require(name);
      if (name === 'fs/promises') return { readFile: async () => { throw new Error('No disk fixture'); } };
      const target = name.startsWith('@/') ? `src/${name.slice(2)}.ts`
        : name.startsWith('.') ? path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)).replaceAll('\\', '/') : '';
      if (target === 'src/lib/logger.ts') return mocks['@/lib/logger'];
      if (target === 'src/lib/firebase/server.ts') return mocks['@/lib/firebase/server'];
      if (real.has(target)) return load(target);
      // Uncalled unrelated action dependencies are inert; nothing can access the network.
      return {};
    },
  }, { filename });
  return exports;
}
function paidBetweenCheckAndSet() {
  fiesta.planDePagos.cuotas[0].montoPagado = 1000;
  fiesta.planDePagos.cuotas[0].estado = 'pagado';
}
function reset(client = false) {
  fiesta = copy(original); writes = 0; portal = client;
  user = client ? null : { userId: 'synthetic-operator', email: 'synthetic@example.invalid', perfil: 'operador' };
  beforeSet = null;
}
(async () => {
  const actions = load('src/app/actions/fiesta/fiesta.actions.ts');
  const auth = load('src/lib/auth/require-session.ts');
  assert.equal((await auth.requirePermiso('contabilidad')).ok, false);
  const rejected = await actions.updateFiestaPartial(original.id, {
    planDePagos: { ...original.planDePagos, cuotas: [{ ...original.planDePagos.cuotas[0], montoPagado: 1000 }] },
  });
  assert.equal(rejected.success, false);
  assert.equal(writes, 0);
  reset();
  beforeSet = paidBetweenCheckAndSet;
  const control = await actions.updateFiestaPartial(original.id, { programa: [{ id: 'only-organization' }] });
  assert.equal(control.success, true);
  assert.equal(fiesta.planDePagos.cuotas[0].montoPagado, 1000);
  console.log(JSON.stringify({ id: 'CAMPO73-CONTROL', sha, success: true, paymentAfterSet: 1000 }));
  for (const client of [false, true]) {
    for (const mode of ['partial', 'whole']) {
      reset(client);
      beforeSet = paidBetweenCheckAndSet;
      const result = mode === 'partial'
        ? await actions.updateFiestaPartial(original.id, { planDePagos: copy(original.planDePagos), programa: [{ id: 'legitimate-program-change' }] }, { allowPortal: client })
        : await actions.saveFiesta({ ...copy(original), programa: [{ id: 'legitimate-program-change' }] });
      assert.equal(result.success, true);
      assert.equal(writes, 1);
      assert.equal(fiesta.programa[0].id, 'legitimate-program-change');
      assert.equal(fiesta.planDePagos.cuotas[0].montoPagado, 0);
      console.log(JSON.stringify({ id: 'CAMPO73-RACE', sha, actor: client ? 'client portal' : 'assigned operator', mode,
        paymentBeforeSet: 1000, paymentAfterSet: fiesta.planDePagos.cuotas[0].montoPagado,
        success: result.success, writes, source: 'actual syncToFirestore; synthetic merge:true document.set' }));
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
