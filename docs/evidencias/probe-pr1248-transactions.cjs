const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../.audit-runtime-62dcb2c/akproduccioneseventos-app-AK-62dcb2c');
const ts = require(path.join(root, 'node_modules/typescript'));
const source = process.argv[2] ? { sha: process.argv[3] || 'unverified-checkout', files: null } : JSON.parse(fs.readFileSync(path.join(__dirname, 'pr1248-pdf-store-source.json'), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const docs = new Map();
let retries = 0;
let rejectCommit = false;
const db = {
  collection: (collection) => ({ doc: (id) => collection + '/' + id }),
  runTransaction: async (callback) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      let key, version, pending;
      await callback({
        get: async (ref) => {
          key = ref;
          const current = docs.get(ref);
          version = current?.version || 0;
          const data = current ? clone(current.data) : undefined;
          await new Promise((resolve) => setTimeout(resolve, 1));
          return { exists: !!current, data: () => data };
        },
        set: (_, value) => { pending = clone(value); },
      });
      if (rejectCommit) throw new Error('SIMULATED_COMMIT_FAILURE');
      if ((docs.get(key)?.version || 0) !== version) { retries++; continue; }
      if (pending) docs.set(key, { version: version + 1, data: pending });
      return;
    }
    throw new Error('Retry limit');
  },
};
function instance() {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const mocks = {
      './logger': {}, './backup/backup-registry': {},
      './mutex': () => load('src/lib/mutex.ts'),
      './firebase/server': () => ({ dbAdmin: db }),
      '@/lib/generic-json-store': () => load('src/lib/generic-json-store.ts'),
      '@/lib/data-service': () => ({ readData: async () => { throw new Error('Unexpected nontransactional read'); } }),
      '@/lib/multiagent/manual-ak': () => ({ AK_MANUAL_VERSION: 'fixture', getManualLearningSeed: () => 'fixture' }),
      'fs/promises': () => ({ mkdir: async () => {}, writeFile: async () => {} }),
      path: () => path,
    };
    const code = source.files ? source.files[file] : fs.readFileSync(path.join(root, file), 'utf8');
    const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(js, { exports, console, process: { env: { NODE_ENV: 'production' }, cwd: () => 'fixture' }, require: (key) => {
      if (!(key in mocks)) throw new Error('Unexpected dependency: ' + key);
      return typeof mocks[key] === 'function' ? mocks[key]() : mocks[key];
    } });
    return exports;
  }
  return { chat: load('src/lib/multiagent/chat-store.ts'), memory: load('src/lib/multiagent/memory-store.ts') };
}
(async () => {
  const a = instance(), b = instance();
  const input = { agentType: 'fiesta', agentName: 'Fixture', fiestaId: 'fixture', userMessage: 'A', assistantMessage: 'Answer' };
  const first = await a.chat.appendMultiAgentChatTurn(input);
  await Promise.all([a, b].map((i, n) => i.chat.appendMultiAgentChatTurn({ ...input, sessionId: first.id, userMessage: 'parallel-' + n })));
  const chat = docs.get('multiagent/chats').data;
  assert.equal(chat.sessions.length, 1);
  assert.equal(chat.sessions[0].messages.length, 6);
  await Promise.all([a, b].map((i, n) => i.memory.saveAgentLearning({ agentType: 'fiesta', fiestaId: 'fixture', title: 'learning-' + n, content: 'fixture' })));
  const memory = docs.get('multiagent/memory').data;
  assert.equal(memory.profiles[0].learnings.length, 2);
  rejectCommit = true;
  await assert.rejects(() => a.chat.appendMultiAgentChatTurn({ ...input, sessionId: first.id }), /SIMULATED_COMMIT_FAILURE/);
  assert.equal(docs.get('multiagent/chats').data.sessions[0].messages.length, 6);
  assert.ok(retries >= 2);
  console.log(JSON.stringify({ sha: source.sha, result: 'PASS', chatMessages: 6, memoryLearnings: 2, retries, failedCommitRejects: true, scope: 'Real helper and stores in two separate VM instances; optimistic Firestore transaction double, no real Firestore/emulator or disk writes' }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });

