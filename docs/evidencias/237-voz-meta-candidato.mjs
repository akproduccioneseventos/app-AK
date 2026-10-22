import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'b91bdbeff7d3db7489fabdadd599776376c0577a';
const target = new URL('237-voz-meta-candidato.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve execution');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];
function load(file, dependencies = {}, globals = {}) {
  const result = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  assert.equal(result.status, 0, result.stderr);
  hashes[file] = crypto.createHash('sha256').update(result.stdout).digest('hex');
  const code = ts.transpileModule(result.stdout, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} }, localRequire = name => { assert.ok(Object.hasOwn(dependencies, name), `Unconfigured ${name}`); return dependencies[name]; };
  new Function('require','exports','module', ...Object.keys(globals), code)(localRequire, module.exports, module, ...Object.values(globals));
  return module.exports;
}
const perfiles = load('src/lib/auth/perfiles.ts');
const risk = load('src/lib/asistente/que-puede-hacer-solo.ts', { '@/lib/data-service': {} });
const next = { json: (body, init = {}) => new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json' } }) };
function database() {
  const files = new Map(), versions = new Map(); let retries = 0;
  return { files, get retries() { return retries; },
    mutateGenericJsonArray: async (name, change) => {
      for (let i = 0; i < 100; i++) {
        const version = versions.get(name) || 0;
        const value = change(structuredClone(files.get(name) || []));
        await new Promise(resolve => setTimeout(resolve, 1));
        if (version !== (versions.get(name) || 0)) { retries++; continue; }
        if (value !== null) { files.set(name, structuredClone(value)); versions.set(name, version + 1); }
        return structuredClone(files.get(name) || []);
      }
      throw new Error('QA197_TRANSACTION_RETRY_LIMIT');
    },
  };
}
function voice(db) {
  const state = { user: { userId: 'qa197-owner', email: 'owner@qa.invalid', perfil: 'dueno' } };
  const route = load('src/app/api/asistente/voz-en-vivo/accion/route.ts', {
    'next/server': { NextResponse: next },
    '@/lib/auth/equipo-de-la-fiesta': { usuarioDelEquipo: async () => state.user },
    '@/lib/auth/perfiles': perfiles,
    '@/lib/asistente/que-puede-hacer-solo': { ...risk, registrarAccionAsistente: async () => {} },
    '@/app/actions/multiagent': { ejecutarAccionSecretario: async () => ({ success: true, mensaje: 'QA197' }) },
    '@/lib/generic-json-store': db,
    '@/app/actions/fiesta/fiesta.actions': { getFiestas: async () => [] },
    '@/lib/fiesta/preparation-score': { calculateFiestaPreparationScore: () => ({ importantPending: [] }) },
  });
  return { state, post: async body => { const response = await route.POST(new Request('https://qa.invalid/api/asistente/voz-en-vivo/accion', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })); return { status: response.status, body: await response.json() }; } };
}
function meta(db) {
  const secret = 'qa197-local-not-a-real-meta-secret';
  const route = load('src/app/api/meta/webhook/route.ts', { 'next/server': { NextResponse: next }, crypto, '@/lib/generic-json-store': db }, { process: { env: { META_APP_SECRET: secret } } });
  return { post: async (mid, correct = true) => {
    const body = JSON.stringify({ object: 'instagram', entry: [{ messaging: [{ sender: { id: 'qa197-guest' }, recipient: { id: 'qa197-ak' }, message: { mid, text: 'Mensaje ficticio QA197' } }] }] });
    const signature = `sha256=${crypto.createHmac('sha256', correct ? secret : 'wrong').update(body).digest('hex')}`;
    const response = await route.POST(new Request('https://qa.invalid/api/meta/webhook', { method: 'POST', headers: { 'x-hub-signature-256': signature }, body }));
    return { status: response.status, body: await response.json() };
  } };
}
const check = (id, pass, observed) => cases.push({ id, pass: Boolean(pass), observed });
let unexpected;
try {
  const payload = { id: 'qa197-one-attempt', accion: 'crear_tarea', argumentos: { titulo: 'Tarea ficticia QA197' } };
  let db = database(), a = voice(db), b = voice(db);
  const sequential = [await a.post(payload), await b.post(payload)];
  check('voice-two-modules-same-attempt-once', sequential.every(value => value.body.success) && db.files.get('tasks.json')?.length === 1, { sequential, tasks: db.files.get('tasks.json') });
  db = database(); a = voice(db); b = voice(db);
  const concurrent = await Promise.all([a.post(payload), b.post(payload)]);
  check('voice-two-modules-callback-retry-once', concurrent.every(value => value.body.success) && db.files.get('tasks.json')?.length === 1 && db.retries > 0, { concurrent, tasks: db.files.get('tasks.json'), callbackRetries: db.retries });
  const different = await a.post({ ...payload, id: 'qa197-deliberate-new-attempt' });
  check('voice-new-deliberate-attempt-allowed', different.body.success && db.files.get('tasks.json')?.length === 2, { different, tasks: db.files.get('tasks.json')?.length });
  a.state.user = { userId: 'qa197-operator', email: 'operator@qa.invalid', perfil: 'operador' };
  const denied = await a.post({ id: 'qa197-owner-private', accion: 'cuanto_me_deben' });
  check('voice-operator-finance-denied', denied.status === 403, denied);
  db = database(); const ma = meta(db), mb = meta(db);
  const mids = await Promise.all([ma.post('qa197-a'), mb.post('qa197-b')]);
  check('meta-two-modules-distinct-mids-preserved', mids.every(value => value.status === 200) && db.files.get('social-mensajes-directos.json')?.length === 2 && db.retries > 0, { mids, stored: db.files.get('social-mensajes-directos.json'), callbackRetries: db.retries });
  const same = await Promise.all([ma.post('qa197-a'), mb.post('qa197-a')]);
  check('meta-repeated-mid-not-duplicated', same.every(value => value.status === 200) && db.files.get('social-mensajes-directos.json')?.length === 2, { same, stored: db.files.get('social-mensajes-directos.json')?.length });
  check('meta-instagram-channel-preserved', db.files.get('social-mensajes-directos.json').every(item => item.canal === 'instagram_dm'), db.files.get('social-mensajes-directos.json'));
  const falseSignature = await ma.post('qa197-false', false);
  check('meta-false-signature-no-write', falseSignature.status === 403 && db.files.get('social-mensajes-directos.json')?.length === 2, falseSignature);
} catch (error) { unexpected = String(error.stack || error); process.exitCode = 2; }
finally {
  const receipt = { source, checkedAt: new Date().toISOString(), hashes, cases, unexpected,
    summary: { total: cases.length, pass: cases.filter(item => item.pass).length, fail: cases.filter(item => !item.pass).length },
    appEdited: false, realServices: false,
    limits: 'Actual POST handlers and risk/permission helpers, independent loaded module instances, HMAC signatures. Shared controlled optimistic transaction adapter explicitly repeats callbacks on conflict. No Firestore SDK/Next HTTP, live voice/model/Meta provider or deployed multi-server acceptance.' };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, unexpected, failures: cases.filter(item => !item.pass) }));
  if (receipt.summary.fail && !unexpected) process.exitCode = 1;
}
