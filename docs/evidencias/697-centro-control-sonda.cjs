// Runs unmodified Git sources with explicit in-memory boundaries; no app imports/network.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const ts = require(process.env.AK_QA_TYPESCRIPT || 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');
const sha = 'b58abab75d94a732daf79b32aff54ec253ccf63c';
const repo = path.resolve(__dirname, '../..');
const sources = {};
function source(file) {
  if (!sources[file]) sources[file] = cp.execFileSync('git', ['show', `${sha}:${file}`], { cwd: repo, encoding: 'utf8' });
  return sources[file];
}
function load(file, deps) {
  const exports = {};
  const js = ts.transpileModule(source(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, require(id) {
    if (!(id in deps)) throw new Error(`UNMOCKED IMPORT ${id}`);
    return deps[id];
  }, console: { warn() {}, error() {}, log() {} }, process: { env: {} }, Date, Math }, { filename: `${sha}/${file}`, timeout: 3000 });
  return exports;
}
const copy = x => structuredClone(x);
function setup(options = {}) {
  const state = { posts: [{ id: 'qa-a', text: 'original A', status: 'Borrador' }, { id: 'qa-b', text: 'original B', status: 'Borrador' }], messages: [{ id: 'qa-mail', status: 'pendiente', channel: 'email', messageText: 'OLD' }], learning: [], records: [], webCalls: [], reads: [], writes: [], sends: 0, proposals: [] };
  let waiting = [], readCount = 0;
  const data = {
    readData: async file => {
      state.reads.push(file);
      if (file === 'fiestas.json') return copy(options.fiestas || []);
      if (file === 'scheduled-messages.json') return copy(state.messages);
      if (file !== 'social-posts.json') throw new Error(`Unexpected file ${file}`);
      const snapshot = copy(state.posts);
      if (options.concurrent && readCount++ < 2) {
        await new Promise(resolve => { waiting.push(resolve); if (waiting.length === 2) waiting.forEach(r => r()); });
      }
      return snapshot;
    },
    writeData: async (file, items) => {
      state.writes.push(file);
      if (options.writeFails) throw new Error('QA_STORAGE_UNAVAILABLE');
      if (file !== 'social-posts.json') throw new Error(`Unexpected write ${file}`);
      state.posts = copy(items);
    },
    mutateDataItem: async (file, collection, id, fn) => {
      if (options.messageFails) throw new Error('QA_MESSAGE_WRITE_UNAVAILABLE');
      const index = state.messages.findIndex(m => m.id === id);
      if (index < 0) return null;
      state.messages[index] = fn(copy(state.messages[index]));
      return copy(state.messages[index]);
    },
  };
  const auth = { requirePermiso: async () => options.denied ? { ok: false, error: 'QA_DENIED' } : { ok: true, user: { perfil: 'dueno' } } };
  const deps = {
    '@/lib/auth/perfiles': { PERMISOS: { ADMINISTRACION: 'admin', CRM: 'crm' } },
    '@/lib/auth/require-session': auth,
    '@/lib/data-service': data,
    '@/lib/whatsapp/internal-token': { WHATSAPP_AUTOMATION_INTERNAL_TOKEN: Symbol('qa') },
    '@/lib/utils': {}, '@/lib/public-contact': {},
    '@/lib/mutex': { AsyncMutex: class { runExclusive(fn) { return fn(); } } },
    '@/lib/google-workspace': { sendGoogleGmailMessage() { state.sends++; throw new Error('REAL_SEND_FORBIDDEN'); } },
    '@/lib/asistente/propuestas-service': {
      getPropuestas: async () => state.proposals,
      agregarPropuestasDeduplicadas: async list => { state.proposals.push(...copy(list)); },
      aceptarPropuesta: async () => ({ success: false, mensaje: 'QA_ACTION_REJECTED' }),
      descartarNoAvisarMas: async () => ({ success: false, mensaje: 'QA_ACTION_REJECTED' }),
    },
    '@/lib/ia/reglas-de-la-ia': {
      getReglaParaTarea: async () => options.mode || 'sola',
      registrarAccionSola: async value => { state.records.push(copy(value)); },
      registrarDecisionDuenio: async value => { state.learning.push(copy(value)); },
    },
    '@/lib/agentes/motor-agentes': {},
    '@/app/actions/fiesta/armar-web-con-ia.actions': { armarWebConIA: async id => {
      state.webCalls.push(id);
      if (options.webThrows) throw new Error('QA_MODEL_UNAVAILABLE');
      return options.webResult || { success: false, error: 'QA_EVENT_NOT_FOUND' };
    } },
  };
  deps['@/app/actions/scheduled-messages'] = load('src/app/actions/scheduled-messages.ts', deps);
  return { api: load('src/app/actions/centro-de-control.ts', deps), state };
}
const results = [];
async function test(id, title, options, run, accepted) {
  const { api, state } = setup(options);
  try {
    const result = await run(api);
    results.push({ id, title, status: accepted(result, state) ? 'PASS' : 'FAIL', result, observed: state });
  } catch (e) { results.push({ id, title, status: 'HARNESS_ERROR', error: String(e.stack) }); }
}
(async () => {
  await test('C01', 'Model throws: do not assert saved web', { webThrows: true }, a => a.darOrdenPorVozOTexto('armar web de QA Lucia'), (r,s) => r.success === false && s.records.length === 0);
  await test('C02', 'No matching party: never use fabricated fallback ID', {}, a => a.darOrdenPorVozOTexto('armar web de QA Lucia'), (r,s) => r.success === false && s.webCalls.length === 0);
  await test('C03', 'Saturday answer must not invent time and special menu without reads', {}, a => a.darOrdenPorVozOTexto('que falta el sabado'), (r,s) => !(r.success && s.reads.length === 0 && /18:00/.test(r.mensaje)));
  await test('C04', 'Unknown request must not claim work started without dispatch', {}, a => a.darOrdenPorVozOTexto('prepara el inventario de cables QA'), (r,s) => !r.success || s.records.length + s.proposals.length + s.writes.length > 0);
  await test('C05', 'Post write rejection must reach caller', { writeFails: true }, a => a.aprobarItemOK('qa-a','post','generador_contenido','original A','edited'), r => r.success === false);
  await test('C06', 'Missing post must not succeed', {}, a => a.aprobarItemOK('qa-missing','post','generador_contenido'), r => r.success === false);
  await test('C07', 'Two approvals retain both decisions', { concurrent: true }, a => Promise.all([a.aprobarItemOK('qa-a','post','generador_contenido'),a.aprobarItemOK('qa-b','post','generador_contenido')]), (r,s) => r.every(x=>x.success) && s.posts.every(p=>p.status==='Aprobado'));
  await test('C08', 'Email approval alone is not evidence of delivery', {}, a => a.aprobarItemOK('qa-mail','mensaje','mandar_mensajes_clientes','OLD','CORRECTED'), (r,s) => !(s.messages[0].status==='enviado' && s.sends===0));
  await test('C09', 'Rejected child proposal must reach caller', {}, a => a.aprobarItemOK('qa-proposal','propuesta','armar_web_evento'), r => r.success === false);
  await test('C10', 'Message mutation failure must reach caller', { messageFails: true }, a => a.aprobarItemOK('qa-mail','mensaje','mandar_mensajes_clientes'), r => r.success === false);
  await test('C11', 'Denied owner permission prevents side effects', { denied: true }, a => a.aprobarItemOK('qa-a','post','generador_contenido'), (r,s) => !r.success && s.learning.length===0 && s.writes.length===0);
  await test('C12', 'Disabled web rule prevents execution', { mode: 'apagada' }, a => a.darOrdenPorVozOTexto('armar web QA'), (r,s) => !r.success && s.webCalls.length===0 && s.records.length===0);
  await test('C13', 'Sequential successful post approval persists edited text', {}, a => a.aprobarItemOK('qa-a','post','generador_contenido','original A','edited'), (r,s) => r.success && s.posts[0].status==='Aprobado' && s.posts[0].text==='edited');
  const report = { sha, method: 'Exact TypeScript module bodies transpiled with explicit memory, auth and provider boundaries. Actual scheduled-message action. No Next HTTP, browser, Firestore, external model, real messages or production.', sources: Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,{ sha256: crypto.createHash('sha256').update(v).digest('hex'), lines: v.split('\n').length }])), results, counts: Object.fromEntries(['PASS','FAIL','HARNESS_ERROR'].map(s=>[s,results.filter(r=>r.status===s).length])) };
  fs.writeFileSync(path.join(__dirname,'697-centro-control-resultados.json'), JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({ sha, counts: report.counts, cases: results.map(r=>({id:r.id,status:r.status,title:r.title})) },null,2));
  process.exitCode = report.counts.HARNESS_ERROR ? 2 : report.counts.FAIL ? 1 : 0;
})();
