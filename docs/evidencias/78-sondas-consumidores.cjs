const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const main = 'f790a002426aecb6598efa239fa948db57571752';
const pending = '4cd3ba776b2e21d3fe528c4b487c9cecf849e256';
const corrected = '09051f80ee7722537a06c50c8eb7524b21ac11e8';
const read = (sha, file) => execFileSync('git', ['show', `${sha}:${file}`], { cwd: root, maxBuffer: 16 * 1024 * 1024 }).toString('utf8');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;

function catering(sha, correctedConsumer = false) {
  const helperPath = 'src/lib/catering/menu-images.ts';
  const pagePath = 'src/app/simulador-de-presupuesto/page.tsx';
  const helper = {};
  vm.runInNewContext(transpile(read(sha, helperPath)), { exports: helper });
  const page = read(sha, pagePath);
  const source = ts.createSourceFile(pagePath, page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let conversion;
  let projection;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'menuItemToServicioEmpresa') {
      assert(!conversion, 'Ambiguous service conversion'); conversion = node.initializer.getText(source);
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useMemo'
      && node.arguments[0]?.getText(source).includes('const allDishes =')) {
      assert(!projection, 'Ambiguous dish projection'); projection = node.arguments[0].getText(source);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert(conversion && projection, 'Actual consumer expressions missing');
  const menus = JSON.parse(read(sha, 'src/data/menus-catering.json'));
  const buffet = menus.flatMap(menu => menu.items).find(item => item.id === 'dish_main_19');
  const actual = {};
  vm.runInNewContext(transpile(`const menuItemToServicioEmpresa = ${conversion};
    exports.projected = (${projection})();
    exports.direct = menuItemToServicioEmpresa(buffet);
    exports.custom = menuItemToServicioEmpresa({ ...buffet, imageUrl: '/media/mi-buffet-real.jpg' });`), {
    exports: actual, allMenus: menus, config: {}, gastronomiaSearchTerm: '', buffet, ...helper,
  });
  const card = actual.projected.principalesDisponibles.find(item => item.id === buffet.id);
  assert(card, 'Buffet must reach actual principal card data');
  assert.equal(actual.custom.imageUrl, '/media/mi-buffet-real.jpg');
  assert.equal(actual.direct.imageUrl ?? null, correctedConsumer ? null : '/catering/menus/xv/dish_main_19.jpeg');
  return { sourceCommit: sha, helperResult: helper.getCateringDishImage(buffet) ?? null,
    directConversion: actual.direct.imageUrl ?? null, cardDataImage: card.imageUrl ?? null,
    customImagePreserved: actual.custom.imageUrl,
    sourceHashes: { helper: hash(read(sha, helperPath)), consumer: hash(page) } };
}

async function virtualMenuIds() {
  const actionPath = 'src/app/actions/menus-catering.ts';
  const catalogPath = 'src/lib/simulator/catalog.ts';
  const source = ts.createSourceFile(actionPath, read(main, actionPath), ts.ScriptTarget.Latest, true);
  const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'armarMenus');
  assert(declaration, 'Actual armarMenus function missing');
  const rawMenus = JSON.parse(read(main, 'src/data/menus-catering.json'));
  const actual = {};
  const catalog = {};
  vm.runInNewContext(transpile(read(main, catalogPath)), { exports: catalog });
  vm.runInNewContext(transpile(`${declaration.getText(source)}\nexports.run = armarMenus;`), {
    exports: actual, cachedMenus: null, readMenusFile: async () => copy(rawMenus),
    leerInsumosCrudos: async () => [], recalculateMenu: menu => menu,
  });
  const publicMenus = await actual.run();
  const virtual = publicMenus.flatMap(menu => menu.items).filter(item => item.id.endsWith('_virtual_buffet'));
  const authoritativeIds = new Set(catalog.buildAuthoritativeSimulatorServices([], rawMenus).map(item => item.id));
  assert.equal(virtual.length, 4);
  for (const item of virtual) {
    assert.equal(authoritativeIds.has(item.id), false);
    assert.equal(authoritativeIds.has(item.id.replace('_virtual_buffet', '')), true);
  }
  return { sourceCommit: main, rejectedOfferedIds: virtual.map(item => ({ id: item.id, name: item.name })),
    baseIdsAccepted: true, actualFunctions: ['armarMenus', 'buildAuthoritativeSimulatorServices'],
    simulated: ['raw menu reader', 'ingredient reader', 'recipe recalculation (identity, IDs only)'],
    doesNotValidatePricingOrDatabase: true,
    sourceHashes: { publicMenus: hash(read(main, actionPath)), authoritativeCatalog: hash(read(main, catalogPath)) } };
}

async function instagramTransactionRetry(sha = pending, expectedCount = 2) {
  const state = { 'catalogo-fotos.json': [], 'social-posts.json': [], 'galeria-publica.json': { fotos: [], videos: [] } };
  const feed = [{ sourceId: 'reel_probe78', mediaType: 'video', mediaUrl: 'https://example.invalid/thumb.jpg',
    permalink: 'https://example.invalid/reel', caption: 'Fiesta de prueba', likes: 1, publishedAt: '2026-10-07T10:00:00Z' }];
  let retries = 0;
  let committed;
  const db = {
    collection: name => ({ doc: id => ({ collection: name, id }) }),
    runTransaction: async callback => {
      for (let attempt = 0; attempt < 2; attempt++) {
        retries++;
        const input = attempt === 0 ? { fotos: [], videos: [] }
          : { fotos: [{ id: 'foto_concurrente', url: '/probe78.jpg' }], videos: [] };
        let proposed;
        await callback({
          get: async ref => { assert.equal(ref.collection, 'json_documents'); assert.equal(ref.id, 'galeria-publica.json');
            return { exists: true, data: () => ({ _data: copy(input) }) }; },
          set: (ref, value) => { proposed = copy(value); },
        });
        if (attempt === 1) committed = proposed;
      }
    },
  };
  const noCall = name => () => { throw new Error(`Unexpected external call: ${name}`); };
  const mocks = {
    'src/lib/logger.ts': { shouldSkipFirestoreDuringBuild: () => false },
    'src/lib/firebase/server.ts': { dbAdmin: db },
    'src/lib/data-service.ts': {
      readData: async (file, fallback) => copy(state[file] ?? fallback),
      writeData: async (file, data) => { state[file] = copy(data); },
    },
    'src/lib/auth/require-session.ts': { requirePermiso: async () => ({ ok: true }), requireAppSession: async () => undefined },
    'src/lib/auth/perfiles.ts': { PERMISOS: { CRM: 'crm' } },
    'src/lib/marketing/internal-token.ts': { MARKETING_AUTOMATION_INTERNAL_TOKEN: 'probe-only' },
    'src/lib/instagram/public-feed.ts': { getPublicInstagramFeed: async () => copy(feed), idOriginalDeInstagram: post => post.sourceId || post.id },
    'src/components/landing/gallery-media-utils.ts': { classifyGalleryCategories: () => ['Fiestas'] },
    'src/lib/ai/consumo-servidor.ts': { hayPresupuestoParaIA: noCall('AI budget'), registrarConsumoIA: noCall('AI consumption') },
    'src/ai/flows/marketing-agent-flow.ts': { chatWithMarketingAgent: noCall('Gemini') },
    'src/lib/presencia-digital/publicador.ts': { publishPostInternal: noCall('publishing') },
  };
  const cache = new Map();
  const mirrors = [];
  function load(file) {
    if (mocks[file]) return mocks[file];
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const allowed = new Set(['src/app/actions/social-media.ts', 'src/lib/generic-json-store.ts',
      'src/lib/backup/backup-registry.ts', 'src/lib/mutex.ts']);
    assert(allowed.has(file), `Unapproved actual module: ${file}`);
    const requireInSandbox = id => {
      if (id === 'path') return path;
      if (id === 'fs/promises') return { mkdir: async () => undefined,
        writeFile: async (destination, bytes) => { mirrors.push({ destination, bytes: bytes.length }); } };
      const resolved = id.startsWith('@/') ? `src/${id.slice(2)}.ts`
        : `${path.posix.normalize(path.posix.join(path.posix.dirname(file), id))}.ts`;
      return load(resolved);
    };
    vm.runInNewContext(transpile(read(sha, file)), {
      exports, require: requireInSandbox, process: { env: { NODE_ENV: 'production' }, cwd: () => root },
      console: { log() {}, error() {} }, Promise, setTimeout, clearTimeout, Buffer,
    }, { filename: file });
    return exports;
  }
  const response = await load('src/app/actions/social-media.ts').syncInstagramPosts();
  assert.equal(retries, 2);
  assert.equal(response.success, true);
  assert.equal(committed.videos.length, 1);
  assert.equal(committed.fotos.length, 1);
  assert.equal(response.videosCount, expectedCount);
  return { sourceCommit: sha, realMutator: 'mutarDocumento', transactionAttempts: retries,
    returnedVideosCount: response.videosCount, committedVideos: committed.videos.length,
    committedPhotos: committed.fotos.length, localMirrorsSimulated: mirrors.length,
    sourceHashes: { sync: hash(read(sha, 'src/app/actions/social-media.ts')),
      mutator: hash(read(sha, 'src/lib/generic-json-store.ts')) },
    simulated: ['Firestore retry and snapshots', 'API feed', 'session', 'data-service', 'classification', 'filesystem mirrors'],
    noRealNetworkOrDatabase: true };
}

(async () => {
  const fixed = catering(main);
  const open = catering(pending);
  const repaired = catering(corrected, true);
  assert.equal(repaired.cardDataImage, null);
  assert.equal(fixed.helperResult, null);
  assert.equal(fixed.cardDataImage, '/catering/menus/xv/dish_main_2.jpeg');
  assert.equal(open.cardDataImage, '/catering/menus/xv/dish_main_19.jpeg');
  const result = { meaning: 'Historical assertions reproduce defects; corrected results are focused source retests, not live Firebase/UI evidence.',
    catering: [fixed, open, repaired], virtualMenuIds: await virtualMenuIds(),
    transactionRetry: [await instagramTransactionRetry(), await instagramTransactionRetry(corrected, 1)] };
  const directory = path.join(__dirname, '78-resultados');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'sondas.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
