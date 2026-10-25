import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const target = new URL('158-tareas-respuesta-publica.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];
const load = (file, names, context) => {
  const p = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' }); assert.equal(p.status, 0, p.stderr);
  hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex');
  const ast = ts.createSourceFile(file, p.stdout, ts.ScriptTarget.Latest, true);
  const nodes = ast.statements.filter(n => !ts.isImportDeclaration(n) && !ts.isExportDeclaration(n) &&
    (!names || ts.isFunctionDeclaration(n) && names.includes(n.name?.text) || ts.isVariableStatement(n) && n.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))));
  if (names) for (const name of names) assert.ok(nodes.some(n => ts.isFunctionDeclaration(n) && n.name?.text === name || ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(ast) === name)), name);
  const code = ts.transpileModule(nodes.map(n => n.getText(ast)).join('\n'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {}; vm.runInNewContext(code, { exports, Request, Response, URL, Date, Math, console: { warn() {}, error() {} }, ...context }, { filename: file, timeout: 3000 }); return exports;
};
const fixed = Date.parse('2026-10-20T15:00:00Z');
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [fixed])); } static now() { return fixed; } }
const marker = 'QA158-CLIENTE-FICTICIO-NO-PUBLICO';
for (const task of ['prospectos-seguimiento','fiesta-proxima-revision']) for (const variant of ['anonymous-no-secret','configured-no-key','configured-wrong-key','configured-correct-header','configured-correct-query','no-secret-throttled','worker-throws']) {
  const env = variant.startsWith('configured') ? { CRON_SECRET: 'qa158-secret' } : {};
  let engineCalls = 0, marks = 0, throttleCalls = 0;
  const store = { 'presupuestos.json': [{ id: 'qa158-budget', estado: 'Enviado', clienteNombre: marker,
    clienteContacto: '00000000', eventoTipo: 'Evento ficticio privado', timestamp: '2026-10-14T15:00:00Z', eventoFecha: '2027-08-08' }],
    'fiestas.json': [{ id: 'qa158-event', configuracion: { nombreEvento: marker } }], 'scheduled-messages.json': [],
    'alertas-descartadas.json': [], 'agentes-historial.json': [], 'agentes-configuracion.json': [] };
  const gate = load('src/lib/automatico/puerta-de-las-tareas.ts', null, { process: { env },
    enforcePublicRateLimit: async () => { throttleCalls++; if (variant === 'no-secret-throttled') throw new Error('QA throttle'); } });
  const engineName = task === 'prospectos-seguimiento' ? 'ejecutarPerseguidorPresupuestos' : 'ejecutarVigilanteFiestas';
  const engine = load('src/lib/agentes/motor-agentes.ts', ['CONFIG_FILE','HISTORIAL_FILE','MAX_HISTORIAL','getConfiguracionAgentes','guardarConfiguracionAgentes','registrarEjecucionAgente', engineName], {
    Date: Clock, readData: async file => structuredClone(store[file] || []), writeData: async (file,value) => { store[file] = structuredClone(value); },
    AGENTES_DEFAULT_CONFIG: [{ id: 'perseguidor_presupuestos' }, { id: 'vigilante_fiestas' }],
    detectarErroresHumanos: () => [{ urgencia: 'urgente_7_dias', fiestaNombre: marker, titulo: 'Pendiente ficticio interno', descripcion: 'Detalle operativo QA' }],
  });
  const route = load(`src/app/api/cron/${task}/route.ts`, null, { Date: Clock, ...gate,
    NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json' } }) },
    [engineName]: async date => { engineCalls++; if (variant === 'worker-throws') throw new Error('QA storage unavailable'); return engine[engineName](date); },
    marcarCorrida: async () => { marks++; },
  });
  const headers = variant === 'configured-correct-header' ? { Authorization: 'Bearer qa158-secret' } : variant === 'configured-wrong-key' ? { Authorization: 'Bearer wrong' } : {};
  const url = `https://qa.invalid/api/cron/${task}` + (variant === 'configured-correct-query' ? '?clave=qa158-secret' : '');
  const response = await route.GET(new Request(url, { headers }));
  const body = await response.json();
  const containsPrivateMarker = JSON.stringify(body).includes(marker);
  const expected = variant === 'configured-no-key' || variant === 'configured-wrong-key' ? 401 : variant === 'no-secret-throttled' ? 429 : variant === 'worker-throws' ? 500 : 200;
  const allowedPrivate = variant === 'configured-correct-header' || variant === 'configured-correct-query';
  const noEngine = expected === 401 || expected === 429;
  const pass = response.status === expected && (allowedPrivate ? containsPrivateMarker : !containsPrivateMarker) &&
    (noEngine ? engineCalls === 0 && marks === 0 : variant === 'worker-throws' ? marks === 0 : engineCalls === 1 && marks === 1);
  cases.push({ task, variant, pass, status: response.status, containsPrivateMarker, engineCalls, marks, throttleCalls,
    preparedDraftCount: store['scheduled-messages.json'].length, ...(containsPrivateMarker ? { response: body } : {}) });
}
const result = { source, testSha256: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), hashes, cases,
  summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual cron GET/body and key/rate-limit gate with actual agent record/queue preparation; fictional storage and clock',
  limits: ['Conditional no-CRON_SECRET environment, not evidence of current production secret configuration or real data exposure',
    'Request/Response objects in-process, NextResponse.json adapter; no HTTP server, scheduler or real messages',
    'Rate-limit storage and error detector are controlled; not a throttle concurrency or alert-accuracy test'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: result.summary, failed: cases.filter(c => !c.pass) }));
if (result.summary.fail) process.exitCode = 1;
