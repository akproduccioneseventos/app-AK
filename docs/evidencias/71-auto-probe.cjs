const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const now = new Date('2026-10-06T15:00:00Z');
const clone = structuredClone;
let data = {};
let feed = [];
let feedsDelivered = 0;
let releaseFeeds;
let bothFeeds;
let recorded = [];
let galleryStore;
let genericDocument = null;
const mocks = {
  'server-only': {},
  'fs/promises': { access: async () => {}, mkdir: async () => {} },
  '@/lib/data-service': {
    readData: async (file, fallback) => file === 'galeria-publica.json' && galleryStore
      ? clone((await galleryStore.readGenericJsonFile(file)) ?? fallback) : clone(data[file] ?? fallback),
    writeData: async (file, value) => {
      if (file === 'galeria-publica.json' && galleryStore) await galleryStore.syncGenericJsonFile(file, value);
      data[file] = clone(value);
    },
  },
  '@/lib/auth/require-session': { requirePermiso: async () => ({ ok: true }) },
  '@/lib/auth/perfiles': { PERMISOS: { CRM: 'crm' } },
  '@/lib/instagram/public-feed': {
    getPublicInstagramFeed: async () => {
      const own = clone(feed[feedsDelivered++]);
      if (feedsDelivered === 2) releaseFeeds();
      await bothFeeds;
      return own;
    },
    idOriginalDeInstagram: post => post.sourceId || post.id,
  },
  '@/components/landing/gallery-media-utils': { classifyGalleryCategories: () => ['Fiestas'] },
  '@/lib/automatico/control-concurrencia': {
    intentarAdquirirLock: async () => ({ token: 'synthetic' }), liberarLock: async () => {}, renovarLock: async () => {},
  },
  '@/lib/automatico/tareas-automaticas': { marcarCorrida: async name => recorded.push(name) },
  './logger': { shouldSkipFirestoreDuringBuild: () => false, isBuildTime: () => false },
  './backup/backup-registry': { isSafeTopLevelJsonFile: file => file === 'galeria-publica.json' },
  './firebase/server': { dbAdmin: { collection: () => ({ doc: () => ({
    set: async value => { genericDocument = clone(value); },
    get: async () => ({ exists: !!genericDocument, data: () => clone(genericDocument) }),
  }) }) } },
  './mutex': { AsyncMutex: class {} },
};
const real = new Set([
  'src/app/actions/social-media.ts', 'src/lib/presencia-digital/publicador.ts',
  'src/lib/automatico/al-entrar-a-la-app.ts',
  'src/lib/generic-json-store.ts',
]);
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const filename = path.join(root, relative);
  const exports = {}; cache.set(relative, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, console: { log() {}, warn() {}, error() {} }, structuredClone,
    setInterval: () => 1, clearInterval() {},
    process: { env: { NODE_ENV: 'production' }, cwd: () => root },
    require(name) {
      if (name in mocks) return mocks[name];
      if (['path', 'crypto'].includes(name)) return require(name);
      const target = name.startsWith('@/') ? `src/${name.slice(2)}.ts` : null;
      return real.has(target) ? load(target) : {};
    },
  }, { filename });
  return exports;
}
(async () => {
  const publisher = load('src/lib/presencia-digital/publicador.ts');
  data['social-posts.json'] = [{ id: 'post71', platform: 'Facebook', status: 'Programado', publishDate: '2026-10-05', text: 'Prueba sin publicar' }];
  data['social-connections.json'] = [];
  const failure = await publisher.procesarPosteosProgramados(3, now);
  assert.equal(failure.fallados.length, 1);
  assert.equal(failure.ok, true);
  const dispatcherSource = fs.readFileSync(path.join(root, 'src/lib/automatico/al-entrar-a-la-app.ts'), 'utf8');
  const stateFile = dispatcherSource.match(/const ESTADO_FILE\s*=\s*['"]([^'"]+)['"]/)[1];
  const names = ['metricas', 'blog', 'recordatorios', 'posicionamiento', 'fiestas_vigilante', 'prospectos_seguimiento', 'avisos_cliente', 'recordar_invitacion', 'asistente_proactivo'];
  data[stateFile] = { ultimaCorrida: Object.fromEntries(names.map(name => [name, now.toISOString()])) };
  const dispatcher = load('src/lib/automatico/al-entrar-a-la-app.ts');
  const result = await dispatcher.ponerAlDiaAlEntrar(now, 'app');
  assert.equal(result.corrio.includes('posteos'), true);
  assert.equal(result.fallaron.length, 0);
  assert.equal(recorded.includes('publicar-programados'), true);
  console.log(JSON.stringify({ id: 'AUTO03-observacion', actualPublisherFailures: failure.fallados.length, publisherOk: failure.ok, dispatcherErrors: result.fallaron.length, markedRun: true, note: 'Procesar la cola no equivale a publicar todos los items; revisar significado de salud global, no afirmar ausencia de reintentos.' }));

  data = { 'social-connections.json': [], 'catalogo-fotos.json': [], 'social-posts.json': [], 'galeria-publica.json': { fotos: [], videos: [] } };
  galleryStore = load('src/lib/generic-json-store.ts');
  await galleryStore.syncGenericJsonFile('galeria-publica.json', data['galeria-publica.json']);
  const post = id => ({ sourceId: id, mediaType: 'video', mediaUrl: `https://example.invalid/${id}.jpg`, permalink: `https://example.invalid/${id}`, caption: 'Prueba aislada', likes: 0, publishedAt: '2026-10-05' });
  feed = [[post('A')], [post('B')]];
  bothFeeds = new Promise(resolve => { releaseFeeds = resolve; });
  const social = load('src/app/actions/social-media.ts');
  const syncs = await Promise.all([social.syncInstagramPosts(), social.syncInstagramPosts()]);
  assert.equal(syncs.every(result => result.success), true);
  const persisted = await galleryStore.readGenericJsonFile('galeria-publica.json');
  assert.equal(persisted.videos.length, 1);
  console.log(JSON.stringify({ id: 'RED03', twoRealSyncActions: true, bothReportedSuccess: true, expectedUnionVideoIds: ['ig_A', 'ig_B'], actualVideoIds: persisted.videos.map(video => video.id), storage: 'real generic object adapter, Firestore .set/.get simulated; NOT a real Firestore integration race' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
