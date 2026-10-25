import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'd95c35ba27c6ff5a3c1a8adac28e29c3ff02ae09';
const target = new URL('182-retest-consumidores-1346.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipt');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript'), dates = req('date-fns');
const hashes = {}, cases = [];
function read(file) {
  const p = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  assert.equal(p.status, 0, p.stderr); hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex'); return p.stdout;
}
function evaluate(value, file, dependencies = {}, globals = {}) {
  const exports = {};
  const require = name => { assert.ok(Object.hasOwn(dependencies, name), `Unconfigured dependency ${name}`); return dependencies[name]; };
  const code = ts.transpileModule(value, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, require, Date, Math, Map, Set, Object, URLSearchParams, console: { log() {}, warn() {}, error() {} }, ...globals }, { filename: file, timeout: 3000 });
  return exports;
}
const load = (file, deps, globals) => evaluate(read(file), file, deps, globals);
const functionBody = (file, name) => {
  const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name); assert.ok(node, name); return node.getText(ast);
};
async function check(id, action) { const { pass, ...observed } = await action(); cases.push({ id, pass, observed }); }
const perfiles = load('src/lib/auth/perfiles.ts');
const risk = load('src/lib/asistente/que-puede-hacer-solo.ts', { '@/lib/data-service': {} });
let messages = [], secretaryWrites = 0;
const internal = { WHATSAPP_AUTOMATION_INTERNAL_TOKEN: Symbol('qa174') };
const secretario = evaluate(functionBody('src/app/actions/multiagent.ts', 'ejecutarAccionSecretario'), 'multiagent.ts:ejecutarAccionSecretario', {
  '@/app/actions/scheduled-messages': { saveScheduledMessage: async message => { secretaryWrites++; return { success: true, message }; } },
  '@/lib/whatsapp/internal-token': internal,
}, { requireAppSession: async () => {} });
const next = { json: (body, init = {}) => new Response(JSON.stringify(body), init) };
const voice = load('src/app/api/asistente/voz-en-vivo/accion/route.ts', {
  'next/server': { NextResponse: next }, '@/lib/auth/perfiles': perfiles,
  '@/lib/auth/equipo-de-la-fiesta': { usuarioDelEquipo: async () => ({ perfil: 'dueno', email: 'qa174@qa.invalid' }) },
  '@/lib/asistente/que-puede-hacer-solo': { ...risk, registrarAccionAsistente: async () => {} },
  '@/app/actions/multiagent': secretario,
  '@/lib/generic-json-store': { mutateGenericJsonArray: async (file, change) => { assert.equal(file, 'scheduled-messages.json'); messages = change(messages); return messages; } },
  '@/app/actions/fiesta/fiesta.actions': { getFiestas: async () => [] },
  '@/lib/fiesta/preparation-score': { calculateFiestaPreparationScore: () => ({}) },
}, { Response });
const post = async body => { const response = await voice.POST(new Request('https://qa.invalid/api/asistente/voz-en-vivo/accion', { method: 'POST', body: JSON.stringify(body) })); return response.json(); };
const outboxFile = 'src/app/(app)/contabilidad/crm/outbox/page.tsx';
const outbox = ts.createSourceFile(outboxFile, read(outboxFile), ts.ScriptTarget.Latest, true);
const declarations = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && ['pendingMessages', 'overdueMessages', 'todayMessages', 'futureMessages'].includes(node.name.text)) {
    assert.ok(node.initializer); declarations[node.name.text] = node.initializer.getText(outbox);
  }
  ts.forEachChild(node, visit);
}
visit(outbox); assert.equal(Object.keys(declarations).length, 4);
const visible = rows => evaluate(`export const result = (() => {
  ${['pendingMessages','overdueMessages','todayMessages','futureMessages'].map(name => `const ${name} = ${declarations[name]};`).join('\n')}
  return { pending: pendingMessages.length, shown: overdueMessages.length + todayMessages.length + futureMessages.length };
})();`, outboxFile, {}, { messages: rows, ...dates }).result;

await check('outbox-positive-canonical-draft-visible', async () => {
  const rows = [{ id: 'qa174-control', status: 'pendiente', targetName: 'QA174', targetPhone: '59899000174', messageText: 'QA174', scheduledAt: new Date().toISOString() }];
  const observed = visible(rows); return { pass: observed.shown === 1, ...observed };
});
await check('voice-whatsapp-draft-visible-in-real-outbox-selectors', async () => {
  messages = []; const response = await post({ id: 'qa174-whatsapp', accion: 'preparar_borrador_whatsapp', argumentos: { destinatario: 'QA174', mensaje: 'QA174', telefono: '59899000174' } });
  const observed = visible(messages); return { pass: response.success === true && observed.shown === 1, response, rows: messages, ...observed };
});
await check('voice-mail-must-forward-confirmation-to-secretary', async () => {
  const before = secretaryWrites;
  const response = await post({ id: 'qa174-mail', accion: 'preparar_mail', confirmado: true, argumentos: { email: 'client@qa.invalid', asunto: 'QA174', cuerpo: 'QA174' } });
  return { pass: response.success === true && response.esperandoConfirmacion !== true && secretaryWrites === before + 1, response, writes: secretaryWrites - before };
});
await check('secretary-positive-direct-confirmation-writes', async () => {
  const before = secretaryWrites;
  const response = await secretario.ejecutarAccionSecretario({ accion: 'preparar_mail', confirmado: true, datos: { email: 'client@qa.invalid', asunto: 'QA174', cuerpo: 'QA174' } });
  return { pass: response.success === true && secretaryWrites === before + 1, response, writes: secretaryWrites - before };
});

const dto = load('src/lib/social-fiesta/public-event.ts', {
  '@/lib/games/game-engine': { calculateLeaderboard: () => ({ tableLeaderboard: [] }) },
  '@/lib/client-portal/public-fiesta': { mapProgramaParaElCliente: value => value },
  '@/lib/games/juegos-en-vivo': { topTrivia: () => [], topCazadores: () => [] },
});
await check('ar-public-dto-can-activate-real-consumer', async () => {
  const fiesta = { id: 'qa174-ar', configuracion: { nombreEvento: 'QA174', fechaEvento: '2027-08-08' }, tieneRealidadAumentada: true, mindTargetUrl: 'https://qa.invalid/target.mind', internalSalary: 9000 };
  const publicEvent = dto.toPublicSocialEvent(fiesta);
  const arFile = 'src/app/evento/ar/[fiestaId]/page.tsx'; const ast = ts.createSourceFile(arFile, read(arFile), ts.ScriptTarget.Latest, true);
  let condition;
  function find(node) { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'tieneMindConfigurado') condition = node.initializer.getText(ast); ts.forEachChild(node, find); }
  find(ast); assert.ok(condition);
  const canStart = evaluate(`export const canStart = ${condition};`, arFile, {}, { fiesta: publicEvent }).canStart;
  return { pass: canStart === true, canStart, publicKeys: Object.keys(publicEvent), privateSalaryOmitted: !Object.hasOwn(publicEvent, 'internalSalary'), method: 'Actual public projection and actual consumer condition, controlled unused ranking dependencies; no browser/hardware' };
});

const summary = { total: cases.length, pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length };
fs.writeFileSync(target, JSON.stringify({ source, hashes, cases, summary, finishedAt: new Date().toISOString(), appEdited: false, manualWorkBelongsToOwner: true,
  limits: ['Outbox selectors extracted from actual component, real date-fns, not mounted UI/HTTP', 'Actual voice route and actual secretary function; storage/session/providers controlled, no sends', 'Positive controls distinguish wiring failures from mocked storage availability', 'No broad tsc/build/Jest or full-app certification'] }, null, 2) + '\n');
console.log(JSON.stringify({ source, summary, cases }));
if (summary.fail) process.exitCode = 1;
