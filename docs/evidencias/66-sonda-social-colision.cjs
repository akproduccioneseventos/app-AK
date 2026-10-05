const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const sourcePath = path.resolve(__dirname, '../../src/app/actions/social-interactive.ts');
const fixedTime = 1780406901269;
const collections = new Map();
const db = {
  collection(name) {
    if (!collections.has(name)) collections.set(name, new Map());
    return {
      doc(id) {
        return { async set(value) { collections.get(name).set(id, { ...value }); } };
      },
    };
  },
};
const modules = {
  'firebase-admin': { __esModule: true, default: {} },
  '@/app/actions/fiesta/fiesta.actions': {
    getFiestaById: async (id) => ({ id, socialGallerySettings: { showDedications: true } }),
    saveFiesta: async () => ({ success: true }),
  },
  '@/lib/logger': { warn() {}, error() {} },
  '@/lib/social-fiesta/content-review': {
    reviewSocialContent: ({ text }) => ({ status: 'approved', sanitizedText: text }),
    sanitizeSocialText: (text) => text,
  },
  '@/lib/firebase/storage': {},
  '@/lib/auth/require-session': {},
  '@/lib/auth/event-access': {},
  '@/lib/auth/perfiles': { PERMISOS: {} },
  '@/lib/social-fiesta/guardrails': {},
  '@/lib/commercial/public-rate-limit': { enforcePublicRateLimit: async () => {} },
  '@/lib/commercial/social-interaction-rate-limit': {
    enforceSocialInteractionRateLimit: async () => {},
  },
  '@/lib/firebase/server': { dbAdmin: db },
};
const { outputText } = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const moduleExports = {};
vm.runInNewContext(outputText, {
  exports: moduleExports,
  require(name) {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
  },
  Date: class extends Date { static now() { return fixedTime; } },
  console,
  Buffer,
}, { filename: sourcePath });

async function check(label, collection, action, sameEvent) {
  collections.clear();
  const results = await Promise.all([
    action('fiesta_prueba_a', 'Mensaje A', 'Invitado A'),
    action(sameEvent ? 'fiesta_prueba_a' : 'fiesta_prueba_b', 'Mensaje B', 'Invitado B'),
  ]);
  assert.equal(results.filter((result) => result.success).length, 2);
  const saved = collections.get(collection);
  assert.equal(saved.size, 1, 'La colision debe reproducirse en este commit');
  console.log(JSON.stringify({
    case: label,
    acknowledged: 2,
    persisted: saved.size,
    returnedIds: results.map((result) => (result.request || result.dedication).id),
    survivingEvents: [...saved.values()].map((value) => value.fiestaId),
    expectedPersisted: 2,
  }));
}

(async () => {
  await check('canciones misma fiesta', 'social_song_requests', moduleExports.addSongRequest, true);
  await check('canciones fiestas distintas', 'social_song_requests', moduleExports.addSongRequest, false);
  await check('dedicatorias misma fiesta', 'social_dedications', moduleExports.addDedication, true);
  await check('dedicatorias fiestas distintas', 'social_dedications', moduleExports.addDedication, false);
})().catch((error) => { console.error(error); process.exitCode = 1; });
