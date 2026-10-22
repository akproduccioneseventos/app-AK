import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'baa034fd25ab77b886e7096105a6114f0336bfdc';
const candidate = 'b91bdbeff7d3db7489fabdadd599776376c0577a';
const target = new URL('247-publicador-auditoria.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve existing receipt; use a new audit namespace for a new source');
const previousEvidence = null;
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];

function gitBlob(ref, file) {
  const result = spawnSync('git', ['show', `${ref}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function loadPublisher() {
  const file = 'src/lib/presencia-digital/publicador.ts';
  const sourceText = gitBlob(source, file);
  const candidateText = gitBlob(candidate, file);
  const consumer = 'src/app/api/cron/publicar-programados/route.ts';
  const consumerText = gitBlob(source, consumer);
  hashes[file] = { source: crypto.createHash('sha256').update(sourceText).digest('hex'), candidate: crypto.createHash('sha256').update(candidateText).digest('hex'), equal: sourceText === candidateText };
  hashes[consumer] = { source: crypto.createHash('sha256').update(consumerText).digest('hex'), candidate: crypto.createHash('sha256').update(gitBlob(candidate, consumer)).digest('hex'), equal: consumerText === gitBlob(candidate, consumer) };

  const modules = new Map();
  const data = {
    posts: [], writes: 0,
    readData: async (name, fallback) => name === 'social-posts.json' ? structuredClone(data.posts) : name === 'social-connections.json' ? [{ platform: 'TikTok', accessToken: 'qa-fake-token', isConnected: true }] : fallback,
    writeData: async (name, value) => { if (name === 'social-posts.json') { data.posts = structuredClone(value); data.writes++; } },
    createDataItem: async () => {},
    mutateDataItem: async (_name, _collection, id, change) => { const i = data.posts.findIndex(post => post.id === id); if (i < 0) return null; const next = change(structuredClone(data.posts[i])); if (!next) return null; data.posts[i] = structuredClone(next); return next; },
  };
  const tiktok = { calls: 0, outcome: { success: true, status: 'PROCESSING', publishId: 'qa-uncertain-247' }, async publishToTikTok() { this.calls++; return this.outcome; } };
  const names = ['@/lib/data-service', '@/lib/social-media/meta-publisher', '@/lib/social-media/tiktok-publisher', '@/lib/social-media/youtube-publisher', '@/lib/social-media/google-business-publisher', '@/lib/social-media/pinterest-publisher', '@/lib/social-media/threads-publisher', '@/lib/social-media/x-publisher', '@/lib/social-media/unified-gateway-publisher', '@/lib/presencia-digital/mejor-horario', '@/lib/utils', '@/lib/mutex'];
  for (const name of names) modules.set(name, name === '@/lib/data-service' ? data : name === '@/lib/social-media/tiktok-publisher' ? { publishToTikTok: (...args) => tiktok.publishToTikTok(...args) } : name === '@/lib/presencia-digital/mejor-horario' ? { mejorHorario: async () => null } : name === '@/lib/mutex' ? { AsyncMutex: class { async runExclusive(fn) { return fn(); } } } : {});
  const code = ts.transpileModule(sourceText, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'exports', 'module', 'process', code)(name => { assert.ok(modules.has(name), `Unconfigured import ${name}`); return modules.get(name); }, mod.exports, mod, { env: { AK_USE_LOCAL_JSON_ONLY: 'false' } });
  return { api: mod.exports, data, tiktok };
}

function check(id, pass, expected, observed) { cases.push({ id, pass: Boolean(pass), expected, observed }); }
let unexpected;
try {
  const { api, data, tiktok } = loadPublisher();
  const now = new Date('2026-10-22T12:00:00.000Z');
  const post = (publicandoDesde) => ({ id: 'qa-post-247', platform: 'TikTok', status: 'Programado', text: 'Fixture QA', mediaUrl: 'https://qa.invalid/fake.mp4', mediaType: 'video', publishDate: '2026-10-22T11:00:00.000Z', ...(publicandoDesde ? { publicandoDesde } : {}) });

  data.posts = [post('2026-10-22T11:45:00.001Z')];
  tiktok.calls = 0;
  const vigente = await api.procesarPosteosProgramados(3, now);
  check('fresh-claim-not-stolen', tiktok.calls === 0 && vigente.publicados.length === 0 && vigente.fallados.length === 0, 'Reclamo de menos de 15 min conserva exclusión; no invoca proveedor.', { calls: tiktok.calls, result: vigente, claimAfter: data.posts[0].publicandoDesde });

  data.posts = [post('2026-10-22T11:44:59.999Z')];
  tiktok.calls = 0;
  const vencido = await api.procesarPosteosProgramados(3, now);
  check('expired-claim-reclaimed', tiktok.calls === 1 && data.posts[0].publishId === 'qa-uncertain-247' && data.posts[0].status === 'Programado' && vencido.publicados.length === 0 && vencido.fallados.length === 0, 'Reclamo vencido permite un intento; PROCESSING conserva Programado y publishId, sin reportar publicado/fallado.', { calls: tiktok.calls, result: vencido, stored: data.posts[0] });
} catch (error) { unexpected = String(error.stack || error); process.exitCode = 2; }
finally {
  const receipt = { source, candidate, checkedAt: new Date().toISOString(), hashes, cases, unexpected, initialHarnessAttemptPreserved: previousEvidence ? { summary: previousEvidence.summary, cases: previousEvidence.cases } : null, summary: { total: cases.length, pass: cases.filter(item => item.pass).length, fail: cases.filter(item => !item.pass) }, appEdited: false, realServices: false, adapters: 'Module source via git show + TypeScript transpilation; in-memory social-posts data/atomic mutation and deterministic TikTok PROCESSING adapter; all other imports inert; env only AK_USE_LOCAL_JSON_ONLY=false.' };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, unexpected, failures: cases.filter(item => !item.pass) }));
  if (receipt.summary.fail.length > 0 && !unexpected) process.exitCode = 1;
}
