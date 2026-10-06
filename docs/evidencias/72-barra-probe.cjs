// Real actions and transition helper; synthetic storage/auth fixtures, no network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const sha = process.argv[2] || 'e52c07839563115236652229d73ac5ebf2e4e551';
const copy = structuredClone;
const token = 'synthetic-guest-token-72';
const order = {
  id: 'bar_synthetic-request-72', fiestaId: 'audit72', guestId: 'guest72',
  guestName: 'Invitado de prueba', drinkId: 'drinkA', drinkName: 'Trago A',
  note: 'Nota privada sintetica', status: 'nuevo', stockMovements: [],
};
let fiesta = {
  id: 'audit72', invitados: [{ id: 'guest72', nombre: 'Invitado de prueba', guestAccessToken: token }],
  cartaTragos: { items: [{ id: 'drinkA', nombre: 'Trago A' }, { id: 'drinkB', nombre: 'Trago B' }] },
  others: { barraTecnologica: { settings: { enabled: true }, orders: [copy(order)] } },
};
let writes = 0;
const mocks = {
  '@/lib/fiesta/lectura-completa': { LECTURA_COMPLETA: Symbol('complete') },
  '@/lib/fiesta-defaults': { defaultCartaTragosData: { items: [] } },
  '@/lib/carta-tragos-master': { mergeMasterTragosWithFiesta: (_master, items) => items },
  '@/lib/carta-tragos/leer-carta-master': { leerCartaTragosMaster: async () => [] },
  './fiesta.actions': { getFiestaById: async () => copy(fiesta), saveFiesta: async () => { writes++; return { success: true }; } },
  '@/lib/firebase/storage': { uploadToStorage: async () => { throw new Error('Network prohibited'); } },
  '@/app/actions/social-gallery': {}, '@/lib/auth/entertainment-token': {},
  '@/lib/insumos/leer-insumos': { limpiarCacheInsumos() {} },
  '@/lib/data-service': { readData: async (_file, fallback) => copy(fallback), writeData: async () => { writes++; } },
  '@/lib/generic-json-store': {},
  '@/lib/fiesta/get-fiesta-raw': { preserveFiestaSecrets: async (_id, value) => value },
  '@/lib/logger': { warn() {}, error() {} }, '@/lib/barra/cierre-de-barra': {},
  '@/lib/auth/event-access': { requireEventPermission: async () => { throw new Error('No staff session'); } },
  '@/lib/auth/perfiles': { PERMISOS: { NOCHE: 'night', INSUMOS: 'stock' } },
  '@/lib/commercial/public-rate-limit': { enforcePublicRateLimit: async () => {} },
  '@/lib/firebase/server': { dbAdmin: null },
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
  vm.runInNewContext(code, {
    exports, Date, Intl, Math, console, Buffer,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'path') return path;
      if (name === '@/lib/barra-tecnologica') return load('src/lib/barra-tecnologica.ts');
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }, { filename });
  return exports;
}
(async () => {
  const actions = load('src/app/actions/fiesta/barra-tecnologica.actions.ts');
  const changed = await actions.changeBarDrinkOrder('audit72', order.id, 'drinkB', 'guest72', token);
  assert.equal(changed.success, false);
  assert.match(changed.error, /enlace de invitado/);
  assert.equal(writes, 0);
  console.log(JSON.stringify({ sha, id: 'BARRA72-1', action: 'changeBarDrinkOrder', validGuest: true, currentStatus: 'nuevo', differentAvailableDrink: true, result: changed, writes }));

  fiesta.others.barraTecnologica.orders[0].status = 'preparando';
  const canceled = await actions.cancelBarDrinkOrder('audit72', order.id, 'guest72', token);
  const changedPreparing = await actions.changeBarDrinkOrder('audit72', order.id, 'drinkB', 'guest72', token);
  assert.equal(canceled.success, false);
  assert.equal(changedPreparing.success, false);
  assert.match(canceled.error, /preparacion/);
  assert.match(changedPreparing.error, /preparacion/);
  console.log(JSON.stringify({ sha, id: 'BARRA72-2', status: 'preparando', cancel: canceled, change: changedPreparing, note: 'Both controls are rendered for preparando in MiniQuiosco; UI evidence is source inspection, not a browser rendering test.' }));

  const denied = await actions.getGuestBarOrders('audit72', 'guest72', 'wrong-token');
  assert.equal(denied.success, false);
  const replay = await actions.createBarDrinkOrder({ fiestaId: 'audit72', drinkId: 'drinkB', guestId: 'guest72', guestAccessToken: 'wrong-token', clientRequestId: 'synthetic-request-72' });
  assert.equal(replay.success, true);
  assert.equal(replay.order.guestId, 'guest72');
  assert.equal(replay.order.note, order.note);
  assert.equal(writes, 0);
  console.log(JSON.stringify({ sha, id: 'BARRA72-3', controlListDenied: true, invalidTokenReplayAccepted: true, returnedGuestId: replay.order.guestId, returnedNote: replay.order.note, requiresKnownRequestId: true, writes, storage: 'synthetic fallback fixture, real actions/helper, no Firestore or HTTP' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
