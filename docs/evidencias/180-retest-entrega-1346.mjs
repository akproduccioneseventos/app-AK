import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'd95c35ba27c6ff5a3c1a8adac28e29c3ff02ae09';
const base = '108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const target = new URL('180-retest-entrega-1346.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipts');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];
function git(args) {
  const p = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  assert.equal(p.status, 0, p.stderr); return p.stdout;
}
function text(file, sha = source) {
  const value = git(['show', `${sha}:${file}`]);
  hashes[`${sha}:${file}`] = crypto.createHash('sha256').update(value).digest('hex');
  return value;
}
function load(file, dependencies = {}, extra = {}) {
  const code = ts.transpileModule(text(file), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const exports = {};
  const require = name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unconfigured QA dependency: ${name} in ${file}`);
    return dependencies[name];
  };
  vm.runInNewContext(code, { exports, require, Date, Math, Map, Set, URL, URLSearchParams, Request, Response,
    Buffer, process: { env: {} }, console: { log() {}, warn() {}, error() {} }, ...extra }, { filename: file, timeout: 3000 });
  return exports;
}
const next = { json: (body, init = {}) => new Response(JSON.stringify(body), {
  ...init, headers: { 'content-type': 'application/json' },
}) };
const request = (body, url = 'voz-en-vivo/accion') => new Request(`https://qa.invalid/api/asistente/${url}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
async function check(id, work) {
  const { pass, ...observed } = await work(); cases.push({ id, pass, observed });
}
const perfiles = load('src/lib/auth/perfiles.ts');
const riesgo = load('src/lib/asistente/que-puede-hacer-solo.ts', {
  '@/lib/data-service': { readData: async (_, fallback) => fallback, writeData: async () => {} },
});
const owner = { userId: 'qa171-owner', email: 'owner@qa.invalid', perfil: 'dueno' };
const operator = { userId: 'qa171-operator', email: 'operator@qa.invalid', perfil: 'operador' };
function voiceHarness(shared = { tasks: [] }) {
  const h = { user: owner, tasks: [], calls: [], mutationWait: null, readError: false };
  Object.defineProperty(h,'tasks',{get:()=>shared.tasks,set:value=>{shared.tasks=value;}});
  h.route = load('src/app/api/asistente/voz-en-vivo/accion/route.ts', {
    'next/server': { NextResponse: next },
    '@/lib/auth/equipo-de-la-fiesta': { usuarioDelEquipo: async () => h.user && Object.values(perfiles.PERMISOS).some(p => perfiles.puede(h.user, p)) ? h.user : null },
    '@/lib/auth/perfiles': perfiles,
    '@/lib/asistente/que-puede-hacer-solo': { ...riesgo, registrarAccionAsistente: async () => {} },
    '@/app/actions/multiagent': { ejecutarAccionSecretario: async args => { h.calls.push(structuredClone(args)); return { success: true, mensaje: 'QA171_DEUDA_PRIVADA_9876', total: 9876 }; } },
    '@/lib/generic-json-store': { mutateGenericJsonArray: async (file, change) => {
      if (h.mutationWait) await h.mutationWait();
      h.tasks = structuredClone(change(h.tasks)); return h.tasks;
    } },
    '@/app/actions/fiesta/fiesta.actions': { getFiestas: async () => { if (h.readError) throw new Error('QA171_READ_DOWN'); return []; } },
    '@/lib/fiesta/preparation-score': { calculateFiestaPreparationScore: () => ({ importantPending: [] }) },
  });
  h.post = async body => { const response = await h.route.POST(request(body)); return { status: response.status, body: await response.json() }; };
  return h;
}
await check('voice-anonymous-denied', async () => {
  const h = voiceHarness(); h.user = null; const r = await h.post({ accion: 'crear_tarea' });
  return { pass: r.status === 403 && h.tasks.length === 0, ...r, tasks: h.tasks.length };
});
await check('voice-personal-denied', async () => {
  const h = voiceHarness(); h.user = { perfil: 'personal' }; const r = await h.post({ accion: 'crear_tarea' });
  return { pass: r.status === 403 && h.tasks.length === 0, ...r, tasks: h.tasks.length };
});
await check('voice-operator-debt-fresh-denied', async () => {
  const h = voiceHarness(); h.user = operator; const r = await h.post({ id: 'qa171-fresh', accion: 'cuanto_me_deben' });
  return { pass: r.status === 403 && h.calls.length === 0, ...r, calls: h.calls.length };
});
await check('voice-cache-must-not-cross-actors', async () => {
  const h = voiceHarness(); const body = { id: 'qa171-shared-id', accion: 'cuanto_me_deben' };
  const ownerResult = await h.post(body); h.user = operator; const otherResult = await h.post(body);
  return { pass: otherResult.status === 403 && !JSON.stringify(otherResult.body).includes('QA171_DEUDA_PRIVADA'), ownerResult, otherResult, calls: h.calls.length };
});
await check('voice-confirmation-can-progress-with-same-id', async () => {
  const h = voiceHarness(); const body = { id: 'qa171-confirm', accion: 'agendar_reunion', argumentos: { fecha: '2027-08-08', hora: '15:00' } };
  const first = await h.post(body), confirmed = await h.post({ ...body, confirmado: true });
  return { pass: first.body.esperandoConfirmacion === true && confirmed.body.esperandoConfirmacion !== true && h.calls.length === 1, first, confirmed, calls: h.calls.length };
});
await check('voice-same-attempt-concurrent-must-create-one-task', async () => {
  const h = voiceHarness(); let arrivals = 0, release;
  const both = new Promise(resolve => { release = resolve; });
  h.mutationWait = async () => { arrivals++; await both; };
  const body = { id: 'qa171-concurrent', accion: 'crear_tarea', argumentos: { titulo: 'QA171 Hielo' } };
  const first = h.post(body); const second = h.post(body); setTimeout(release,25); const results = await Promise.all([first, second]);
  return { pass: h.tasks.length === 1, results, tasks: h.tasks.length, ids: h.tasks.map(t => t.id) };
});
await check('voice-different-attempts-may-create-two-tasks', async () => {
  const h = voiceHarness();
  await h.post({ id: 'qa171-deliberate-1', accion: 'crear_tarea', argumentos: { titulo: 'Hielo' } });
  await h.post({ id: 'qa171-deliberate-2', accion: 'crear_tarea', argumentos: { titulo: 'Hielo' } });
  return { pass: h.tasks.length === 2, tasks: h.tasks.length };
});
await check('voice-read-failure-must-not-be-no-party', async () => {
  const h = voiceHarness(); h.readError = true;
  const r = await h.post({ id: 'qa171-read', accion: 'que_falta_de_la_fiesta', confirmado: true, argumentos: { nombreFiesta: 'QA171' } });
  return { pass: r.body.success === false && !String(r.body.mensaje).includes('No encontr'), ...r };
});

const logs = [];
let adCalls = 0, genericCalls = 0, adAllowed = true;
const wa = load('src/app/api/whatsapp/webhook/route.ts', {
  'next/server': { NextResponse: next },
  '@/app/actions/whatsapp': { getWhatsAppConfig: async () => ({ enabled: true, appSecret: 'qa171-not-real' }), processIncomingMessage: async () => { genericCalls++; return { success: true }; } },
  '@/lib/whatsapp/webhook-security': { getExternalWebhookUrl: () => 'https://qa.invalid', verifyMetaWebhookSignature: () => true, verifyTwilioWebhookSignature: () => true },
  '@/lib/whatsapp/internal-token': { WHATSAPP_WEBHOOK_INTERNAL_TOKEN: Symbol('qa171') },
  '@/lib/whatsapp/vino-de-la-publicidad': { correspondeContestarSolo: async () => adAllowed },
  '@/lib/asistente/por-whatsapp': { atenderAlEquipo: async () => ({ atendido: false }), atenderProspectoAnuncioWhatsApp: async () => { adCalls++; return { completo: true }; } },
}, { process: { env: { NODE_ENV: 'production' } }, console: { error: (...v) => logs.push(v.map(String)), log() {}, warn() {} } });
const adPayload = { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { contacts: [{ profile: { name: 'QA171' } }], messages: [{ from: '59899000171', id: 'qa171-ad', type: 'text', referral: { source_type: 'ad', source_id: 'qa171' }, text: { body: '2027-08-08 para 100 personas en salon Club QA' } }] } }] }] };
function waRequest() { return new Request('https://qa.invalid/api/whatsapp/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'qa171-provider-double' }, body: JSON.stringify(adPayload) }); }
await check('whatsapp-ad-webhook-must-call-ad-handler', async () => {
  const response = await wa.POST(waRequest()); const body = await response.json();
  return { pass: adCalls === 1 && logs.length === 0, status: response.status, body, adCalls, genericCalls, logs: structuredClone(logs) };
});
await check('whatsapp-no-ad-keeps-human-policy', async () => {
  adAllowed = false; const before = logs.length, callsBefore = adCalls; const response = await wa.POST(waRequest()); const body = await response.json();
  return { pass: body.respondido === false && adCalls === callsBefore && logs.length === before, status: response.status, body };
});

let draftMode = 'ok', drafts = [], budgetCalls = 0;
const prospect = load('src/lib/asistente/por-whatsapp.ts', {
  '@/lib/public-contact': { AK_WHATSAPP_NUMBER: '59899000171' },
  '@/lib/asistente/que-puede-hacer-solo': riesgo,
  '@/lib/asistente/avisar-al-duenio': { getAsistenteSettings: async () => ({}) },
  '@/lib/asistente/propuestas-service': { agregarPropuestasDeduplicadas: async () => ({}) },
  '@/lib/whatsapp/meta-sender': { sendMetaWhatsAppMessage: async () => { throw new Error('No real sends'); } },
  '@/lib/data-service': { readData: async (_, fallback) => fallback, writeData: async () => {} },
  '@/app/actions/armado-rapido': { generateBudgetAndLeadFromSimulator: async () => { budgetCalls++; throw new Error('No real budgets'); } },
  '@/app/actions/scheduled-messages': { saveScheduledMessage: async message => {
    if (draftMode === 'throw') throw new Error('QA171_DRAFT_STORE_DOWN');
    if (draftMode === 'false') return { success: false, error: 'QA171_DRAFT_STORE_DOWN' };
    drafts.push(structuredClone(message)); return { success: true };
  } },
  '@/lib/whatsapp/internal-token': { WHATSAPP_AUTOMATION_INTERNAL_TOKEN: Symbol('qa171') },
});
const lead = { phone: '59899000171', name: 'QA171', text: '2027-08-08 para 100 personas en salon Club QA' };
await check('prospect-complete-creates-draft-not-zero-budget', async () => {
  const r = await prospect.atenderProspectoAnuncioWhatsApp(lead);
  return { pass: r.completo === true && drafts.length === 1 && budgetCalls === 0, result: r, drafts: drafts.length, budgetCalls };
});
for (const mode of ['false', 'throw']) await check(`prospect-draft-${mode}-must-not-report-complete`, async () => {
  draftMode = mode; drafts = []; const r = await prospect.atenderProspectoAnuncioWhatsApp(lead);
  return { pass: r.completo === false, result: r, drafts: drafts.length };
});

const metaFile = 'social-mensajes-directos.json';
const mutex = load('src/lib/mutex.ts');
function metaHarness(shared = { store: [] }) {
  const h = { store: [], writes: 0, barrier: null, env: { META_APP_SECRET: 'qa171-meta-not-real' } };
  Object.defineProperty(h,'store',{get:()=>shared.store,set:value=>{shared.store=value;}});
  h.route = load('src/app/api/meta/webhook/route.ts', {
    'next/server': { NextResponse: next }, crypto, '@/lib/mutex': mutex,
    '@/lib/data-service': { readData: async file => { assert.equal(file, metaFile); const snapshot = structuredClone(h.store); if (h.barrier) await h.barrier(); return snapshot; },
      writeData: async (file, value) => { assert.equal(file, metaFile); h.store = structuredClone(value); h.writes++; } },
  }, { process: { env: h.env } });
  h.post = async (id, secret = h.env.META_APP_SECRET) => {
    const body = JSON.stringify({ object: 'instagram', entry: [{ id: '178414000000171', messaging: [{ sender: { id: '171000000001' }, recipient: { id: '178414000000171' }, message: { mid: id, text: 'QA171' } }] }] });
    const signature = `sha256=${crypto.createHmac('sha256', secret || 'qa171-fallback').update(body).digest('hex')}`;
    const response = await h.route.POST(new Request('https://qa.invalid/api/meta/webhook', { method: 'POST', headers: { 'x-hub-signature-256': signature }, body }));
    return { status: response.status, body: await response.json() };
  };
  return h;
}
await check('meta-false-signature-denied', async () => { const h = metaHarness(); const r = await h.post('qa171-false', 'wrong'); return { pass: r.status === 403 && h.writes === 0, ...r, writes: h.writes }; });
await check('meta-no-secret-denied', async () => { const h = metaHarness(); delete h.env.META_APP_SECRET; const r = await h.post('qa171-empty'); return { pass: r.status === 403 && h.writes === 0, ...r, writes: h.writes }; });
await check('meta-same-mid-sequential-deduplicates', async () => { const h = metaHarness(); await h.post('qa171-repeat'); await h.post('qa171-repeat'); return { pass: h.store.length === 1, stored: h.store }; });
await check('meta-different-mids-sequential-preserved', async () => { const h = metaHarness(); await h.post('qa171-a'); await h.post('qa171-b'); return { pass: h.store.length === 2, stored: h.store }; });
await check('meta-concurrent-mids-must-both-survive', async () => {
  const h = metaHarness(); let arrivals = 0, release; const both = new Promise(resolve => { release = resolve; });
  h.barrier = async () => { arrivals++; await both; };
  const first = h.post('qa171-a'), second = h.post('qa171-b'); setTimeout(release,25); const results = await Promise.all([first, second]);
  return { pass: h.store.length === 2, results, stored: h.store, writes: h.writes, reads:arrivals };
});
await check('meta-instagram-object-retains-instagram-channel', async () => { const h = metaHarness(); await h.post('qa171-ig'); return { pass: h.store[0].canal === 'instagram_dm', stored: h.store }; });

await check('voice-same-attempt-across-two-module-instances',async()=>{
  const shared={tasks:[]},a=voiceHarness(shared),b=voiceHarness(shared);
  const body={id:'qa180-shared-attempt',accion:'crear_tarea',argumentos:{titulo:'QA180 Hielo'}};
  const first=await a.post(body),retry=await b.post(body);
  return{pass:shared.tasks.length===1,first,retry,persisted:shared.tasks.length,ids:shared.tasks.map(x=>x.id),instances:2};
});
await check('meta-two-module-instances-preserve-both-mids',async()=>{
  const shared={store:[]},a=metaHarness(shared),b=metaHarness(shared);let arrivals=0,release;
  const both=new Promise(resolve=>{release=resolve;});
  const barrier=async()=>{if(++arrivals===2)release();await both;};a.barrier=barrier;b.barrier=barrier;
  const first=a.post('qa180-instance-a'),second=b.post('qa180-instance-b');const results=await Promise.all([first,second]);
  return{pass:shared.store.length===2,results,persisted:shared.store,readArrivals:arrivals,instances:2};
});

const sourceConfig = text('src/lib/entertainment/station-config.ts');
const configAst = ts.createSourceFile('station-config.ts', sourceConfig, ts.ScriptTarget.Latest, true);
const filterText = configAst.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'filtrarPorEstacion').getText(configAst);
const filterCode = ts.transpileModule(filterText, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const filterExports = {}; vm.runInNewContext(filterCode, { exports: filterExports });
await check('album-invitados-guard-retained-no-regression', async () => {
  const value = text('src/app/evento/album/[fiestaId]/page.tsx');
  const pass = /activeTab === 'invitados'[\s\S]*?p\.sourceModule === 'invitado'[\s\S]*?filtrarPorEstacion\(posts, activeTab\)/.test(value);
  return { pass, method: 'Source contrast only; agent candidate dismissed, guard still precedes helper' };
});
await check('album-buzon-retains-capsulaTiempo', async () => {
  const fixture = [{ id: 'capsula', sourceModule: 'capsulaTiempo' }, { id: 'buzon', sourceModule: 'buzon' }, { id: 'booth', sourceModule: 'fotocabina' }];
  const value = filterExports.filtrarPorEstacion(fixture, 'buzon');
  return { pass: value.length === 2 && value.some(p => p.id === 'capsula'), expected: ['capsula', 'buzon'], actual: value.map(p => p.id), method: 'Actual helper called by album; base previously included capsulaTiempo' };
});

const arStates = [], effects = []; let stateIndex = 0, starts = 0;
const fixture = { id: 'qa171-ar', nombreEvento: 'QA171', tieneRealidadAumentada: true, mindTargetUrl: 'https://qa.invalid/target.mind' };
const react = { useState: () => { const index = stateIndex++; return [[fixture, false, null, false, true][index], value => arStates.push({ index, value })]; },
  useEffect: fn => effects.push(fn), useRef: () => ({ current: {} }), useCallback: fn => fn };
const jsx = (type, props) => ({ type: typeof type === 'string' ? type : 'component', props });
const icon = () => null;
const ar = load('src/app/evento/ar/[fiestaId]/page.tsx', {
  react: { ...react, default: react }, 'react/jsx-runtime': { jsx, jsxs: jsx },
  'next/navigation': { useParams: () => ({ fiestaId: 'qa171-ar' }), useRouter: () => ({ push() {} }) },
  'framer-motion': { motion: { div: icon } },
  'lucide-react': { Camera: icon, ArrowLeft: icon, AlertCircle: icon, Sparkles: icon, Volume2: icon, VolumeX: icon, RefreshCw: icon },
  '@/components/ui/button': { Button: icon }, '@/app/actions/social-gallery': { getPublicSocialEvent: async () => fixture },
  'mind-ar/dist/mindar-image-three.prod.js': { MindARThree: class { async start() { starts++; } stop() {} } },
}, { navigator: { mediaDevices: { getUserMedia: async () => { throw new Error('No camera allowed in QA'); } } } });
await check('ar-camera-start-is-not-target-detection', async () => {
  ar.default(); effects.forEach(effect => effect()); await new Promise(resolve => setTimeout(resolve, 0));
  return { pass: starts === 1 && !arStates.some(s => s.index === 3 && s.value === true), starts, targetEventsInjected: 0, states: arStates,
    method: 'Actual component/effects, controlled hook protocol and MindAR start double; no React DOM, camera, WebGL or hardware' };
});

const oldLock = JSON.parse(text('package-lock.json', base)), newLock = JSON.parse(text('package-lock.json'));
const lockChanges = { added: [], removed: [], versionChanged: [], unexpectedHosts: [] };
for (const [key, item] of Object.entries(newLock.packages)) {
  const old = oldLock.packages[key];
  if (!old) lockChanges.added.push({ path: key, version: item.version });
  else if (old.version !== item.version) lockChanges.versionChanged.push({ path: key, before: old.version, after: item.version });
  if (item.resolved?.startsWith('http') && new URL(item.resolved).hostname !== 'registry.npmjs.org') lockChanges.unexpectedHosts.push({ path: key, resolved: item.resolved });
}
for (const key of Object.keys(oldLock.packages)) if (!(key in newLock.packages)) lockChanges.removed.push({ path: key, version: oldLock.packages[key].version });
const summary = { total: cases.length, pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length };
const result = { source, base, finishedAt: new Date().toISOString(), hashes, cases, summary, lockChanges,
  scope: 'Actual new route/module bodies from exact Git SHA, in-process Request/Response, real profile/risk functions; bounded protocol doubles for authentication/provider/storage/hooks',
  limits: ['Not a full tsc/Jest/build or native HTTP/browser/AR run for d95', 'No real secrets, accounts, database, sends, money or hardware', 'Two module instances have independent real Maps/Mutexes and shared controlled storage, not two deployed Cloud Run processes or actual Firestore in this test', 'Single-instance read hold releases after both requests start, not after two backend calls; this permits a correct mutex/dedup to execute once', 'AR before-target control does not accept video rendering or complete order208', 'An agent album/invitados candidate is explicitly dismissed, not an app bug'],
  appEdited: false, manualWorkBelongsToOwner: true, allAppCertified: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, summary, failed: cases.filter(c => !c.pass).map(c => ({ id: c.id, observed: c.observed })), lock: Object.fromEntries(Object.entries(lockChanges).map(([k,v]) => [k, v.length])) }));
if (summary.fail) process.exitCode = 1;
