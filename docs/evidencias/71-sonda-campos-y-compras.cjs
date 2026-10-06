const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
let usuario = null;
let portal = false;
let antesDeMutar = null;
const original = {
  id: 'audit71', configuracion: { nombreEvento: 'Prueba sin datos reales' },
  personalAsignado: [{ empleadoId: 'operador71' }],
  gestionCostos: { ingresos: 10000, total: 2000 },
  contratoFirmaInfo: { isSigned: false }, estado: 'En Planificacion',
  planDePagos: { id: 'plan', cuotas: [{ id: 'c', monto: 1000, montoPagado: 0 }] },
  estadosCompra: [{ proveedor: 'proveedor-ficticio', pedido: true, pagado: false }],
};
let fiesta = structuredClone(original);
const mocks = {
  'server-only': {},
  '@/lib/auth/session-token': { verifySession: async () => ({ success: !!usuario, user: usuario }) },
  '@/lib/security/portal-session': { verifyPortalSession: async id => portal && id === fiesta.id },
  '@/app/actions/empleados': { getEmpleados: async () => [{ id: 'operador71', email: 'prueba@example.invalid' }] },
  '@/lib/fiesta/leer-fiestas': { leerFiestasCrudas: async () => [structuredClone(fiesta)] },
  '@/lib/data-service': {
    readData: async () => structuredClone(fiesta),
    writeData: async (_f, value) => { fiesta = structuredClone(value); },
    updateDataPartial: async (_f, value) => { fiesta = { ...fiesta, ...structuredClone(value) }; },
  },
  '@/lib/fiesta/actualizar-fiesta': {
    actualizarFiesta: async (_id, fn) => {
      if (antesDeMutar) antesDeMutar();
      fiesta = await fn(structuredClone(fiesta));
      return { success: true };
    },
  },
};
const real = new Set([
  'src/app/actions/fiesta/fiesta.actions.ts', 'src/app/actions/fiesta/catering.actions.ts',
  'src/lib/auth/perfiles.ts', 'src/lib/auth/require-session.ts',
  'src/lib/auth/equipo-de-la-fiesta.ts', 'src/lib/auth/event-access.ts',
  'src/lib/fiesta/get-fiesta-raw.ts', 'src/lib/fiesta/recortar-para-afuera.ts',
]);
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const filename = path.join(root, relative);
  const exports = {}; cache.set(relative, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, console, Date, structuredClone,
    process: { env: {}, cwd: () => root },
    require(name) {
      if (name in mocks) return mocks[name];
      if (['path', 'fs/promises', 'crypto'].includes(name)) return require(name);
      let relativeTarget;
      if (name.startsWith('@/')) relativeTarget = `src/${name.slice(2)}.ts`;
      if (name.startsWith('.')) relativeTarget = path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)).replaceAll('\\', '/');
      return real.has(relativeTarget) ? load(relativeTarget) : {};
    },
  }, { filename });
  return exports;
}
function result(id, data) { console.log(JSON.stringify({ id, ...data })); }
(async () => {
  const actions = load('src/app/actions/fiesta/fiesta.actions.ts');
  const auth = load('src/lib/auth/require-session.ts');
  usuario = { userId: 'operador71', perfil: 'operador', email: 'prueba@example.invalid' };
  assert.equal((await auth.requirePermiso('ganancias')).ok, false);
  assert.equal((await auth.requirePermiso('contabilidad')).ok, false);
  const cambioCosto = await actions.updateFiestaPartial(fiesta.id, {
    gestionCostos: { total: 1, ingresos: 1 },
    planDePagos: { id: 'plan', cuotas: [{ id: 'c', monto: 1000, montoPagado: 1000, estado: 'pagado' }] },
  });
  assert.equal(cambioCosto.success, true);
  assert.equal(fiesta.gestionCostos.total, 1);
  assert.equal(fiesta.planDePagos.cuotas[0].montoPagado, 1000);
  result('CAMPO01', { perfil: 'operador asignado', contabilidad: false, ganancias: false, accepted: true, markedInstallmentPaid: fiesta.planDePagos.cuotas[0].montoPagado, note: 'Costo tambien acepta cambios, pero no se reporta como defecto: la accion especifica admite ORGANIZACION. La cuota exige CONTABILIDAD en payment-plans.' });

  fiesta = structuredClone(original); usuario = null; portal = true;
  const firma = await actions.updateFiestaPartial(fiesta.id, {
    estado: 'Contratada', contratoFirmaInfo: { isSigned: true, method: 'physical' },
    planDePagos: { id: 'plan', cuotas: [{ id: 'c', monto: 1000, montoPagado: 1000, estado: 'pagado' }] },
  }, { allowPortal: true });
  assert.equal(firma.success, true);
  assert.equal(fiesta.contratoFirmaInfo.isSigned, true);
  assert.equal(fiesta.planDePagos.cuotas[0].montoPagado, 1000);
  result('CAMPO02', { perfil: 'cliente con sesion de su portal, sin sesion del equipo', accepted: true, markedPhysicalContractSigned: true, markedInstallmentPaid: 1000 });

  fiesta = structuredClone(original); portal = false;
  usuario = { userId: 'operador71', perfil: 'operador', email: 'prueba@example.invalid' };
  const catering = load('src/app/actions/fiesta/catering.actions.ts');
  const snapshot = structuredClone(fiesta.estadosCompra);
  antesDeMutar = () => { fiesta.estadosCompra[0].pagado = true; };
  const compra = await catering.updateShoppingListStatus(fiesta.id, snapshot);
  assert.equal(compra.success, true);
  assert.equal(fiesta.estadosCompra[0].pagado, false);
  result('COMPRA01', { perfil: 'operador asignado', contabilidad: false, insumos: false, concurrentPaymentBeforeMutation: true, paymentAfterStaleSave: false, accepted: true });
})().catch(error => { console.error(error); process.exitCode = 1; });
