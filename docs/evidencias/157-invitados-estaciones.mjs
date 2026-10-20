import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '894d01603e0e03cebc8f90a6ccf869ef86bbe1de';
const target = new URL('157-invitados-estaciones.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipt');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes = {}, cases = [];
const read = file => { const r = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); hashes[file] = crypto.createHash('sha256').update(r.stdout).digest('hex'); return r.stdout; };
const load = (file, names, context = {}) => {
  const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const statements = ast.statements.filter(n => !ts.isImportDeclaration(n) && !ts.isExportDeclaration(n) &&
    (!names || ts.isFunctionDeclaration(n) && names.includes(n.name?.text) || ts.isVariableStatement(n) && n.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))));
  if (names) for (const name of names) assert.ok(statements.some(n => ts.isFunctionDeclaration(n) && n.name?.text === name || ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(ast) === name)), name);
  const code = ts.transpileModule(statements.map(n => n.getText(ast)).join('\n'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code + (names ? `\nexports.__qa={${names.join(',')}};` : ''), { exports, Buffer, Date, Math, URLSearchParams, crypto, ...context }, { filename: file, timeout: 3000 });
  return names ? exports.__qa : exports;
};
const check = (name, pass, observed = {}) => cases.push({ name, pass: Boolean(pass), observed });
const tokens = load('src/lib/auth/entertainment-token.ts', null, {
  process: { env: { NODE_ENV: 'production', AK_ENTERTAINMENT_SECRET: 'qa157-fictional-only-secret' } },
  hasAppSession: async () => false,
});
const dto = load('src/lib/guest-portal-public-data.ts');
const stations = load('src/lib/entertainment/station-config.ts');
const available = load('src/lib/guest-portal/guest-entertainment.ts');
const modules = ['fotocabina','plataforma360','espejoMagicoFoto','espejoMagicoFirma','espejoMagicoIA','bogue','capsulaTiempo'];
const guestId = 'qa157-guest-&a', accessKey = 'qa157-key&a?';
const fixture = id => ({ id: `qa157-f${id}`, configuracion: { nombreEvento: `Evento ficticio ${id}` },
  clientPortalSettings: { enabled: true, accessKey: 'private-client-key', videosParaInvitadosActivo: true },
  invitados: [{ id: guestId, nombre: `Invitado ${id}`, guestAccessToken: id === 'a' ? accessKey : 'qa157-key-b', checkedIn: false, contacto: 'private-contact', notes: 'private-note' },
    { id: 'qa157-other', nombre: 'Otro invitado', guestAccessToken: 'qa157-other-key', checkedIn: true }],
  modulosContratados: { entretenimiento: true, buzon: true },
  others: { entretenimiento: { modules: Object.fromEntries(modules.map(m => [m, { enabled: true }])) } },
  videosParaInvitados: [{ storagePath: `qa157/video-${id}.mp4`, invitadoIds: [guestId] }],
  personalAsignado: [{ empleadoId: 'private-worker', eventSalary: 3000 }], gestionCostos: { total: 9500 },
  programa: [{ id: 'visible', titulo: 'Momento publico' }, { id: 'internal', titulo: 'Momento interno', visibleParaCliente: false }],
});
const events = new Map([['qa157-fa', fixture('a')], ['qa157-fb', fixture('b')]]);
let signedCalls = [];
const actions = load('src/app/actions/public-guest-portal.ts', ['GUEST_ENTERTAINMENT_MODULES','buildGuestEntertainmentLinks','getPublicGuestPortalData','getPublicGuestEntertainmentLinks'], {
  ...tokens, ...dto, ...stations, ...available,
  LECTURA_COMPLETA: Symbol('QA lectura interna'), getFiestaById: async id => structuredClone(events.get(id) || null),
  getSignedUrl: async path => { signedCalls.push(path); return `https://qa.invalid/${path}`; },
});
const portal = await actions.getPublicGuestPortalData('qa157-fa', guestId, accessKey);
check('guest-a-gets-only-own-personal-data', portal?.guest.id === guestId && portal.guest.nombre === 'Invitado a' && !portal.guest.guestAccessToken && !portal.guest.contacto && !portal.guest.notes && !portal.fiesta.gestionCostos && !portal.fiesta.personalAsignado && !portal.fiesta.clientPortalSettings && portal.fiesta.programa.length === 1,
  { guestId: portal?.guest.id, eventName: portal?.fiesta.configuracion.nombreEvento, linkCount: portal?.entertainmentLinks.length });
check('guest-cross-event-same-id-wrong-token-denied', await actions.getPublicGuestPortalData('qa157-fb', guestId, accessKey) === null);
check('guest-cannot-use-own-token-for-other-guest', await actions.getPublicGuestPortalData('qa157-fa', 'qa157-other', accessKey) === null);
check('guest-empty-token-denied', await actions.getPublicGuestPortalData('qa157-fa', guestId, '') === null);
check('guest-missing-event-denied', await actions.getPublicGuestPortalData('qa157-missing', guestId, accessKey) === null);
check('guest-before-checkin-no-video-or-signed-call', !portal?.videoPersonal && signedCalls.length === 0);
check('all-seven-enabled-station-links-generated', portal?.entertainmentLinks.length === 7);
for (const moduleId of modules) {
  const item = portal.entertainmentLinks.find(link => link.id === moduleId);
  const url = new URL(item.href, 'https://qa.invalid');
  const token = url.searchParams.get('access');
  check(`station-${moduleId}-credentials-encoded-without-query-split`, url.searchParams.get('guestId') === guestId && url.searchParams.get('guestAccessToken') === accessKey);
  check(`station-${moduleId}-guest-scope-accepted`, tokens.verifyEntertainmentAccessToken(token, 'qa157-fa', moduleId, 'guest'));
  check(`station-${moduleId}-guest-cannot-control`, !tokens.verifyEntertainmentAccessToken(token, 'qa157-fa', moduleId, 'operator'));
  check(`station-${moduleId}-other-event-denied`, !tokens.verifyEntertainmentAccessToken(token, 'qa157-fb', moduleId, 'guest'));
  check(`station-${moduleId}-other-module-denied`, !tokens.verifyEntertainmentAccessToken(token, 'qa157-fa', moduleId === 'fotocabina' ? 'plataforma360' : 'fotocabina', 'guest'));
}
const token = tokens.createEntertainmentAccessToken('qa157-fa', 'fotocabina', 'guest');
check('station-tampered-token-denied', !tokens.verifyEntertainmentAccessToken(token + 'x', 'qa157-fa', 'fotocabina', 'guest'));
const expired = tokens.createEntertainmentAccessToken('qa157-fa', 'fotocabina', 'guest', -1);
check('station-expired-token-denied', !tokens.verifyEntertainmentAccessToken(expired, 'qa157-fa', 'fotocabina', 'guest'));
events.get('qa157-fa').invitados[0].checkedIn = true;
const video = await actions.getPublicGuestPortalData('qa157-fa', guestId, accessKey);
check('guest-checkedin-gets-only-assigned-video', video?.videoPersonal?.url === 'https://qa.invalid/qa157/video-a.mp4' && signedCalls.length === 1 && signedCalls[0] === 'qa157/video-a.mp4');
signedCalls = [];
const other = await actions.getPublicGuestPortalData('qa157-fa', 'qa157-other', 'qa157-other-key');
check('other-checkedin-guest-does-not-get-unassigned-video', Boolean(other) && !other.videoPersonal && signedCalls.length === 0);
events.get('qa157-fa').invitados[0].guestAccessToken = 'qa157-rotated';
check('guest-rotated-identity-revokes-old-token', await actions.getPublicGuestPortalData('qa157-fa', guestId, accessKey) === null && signedCalls.length === 0);
check('invalid-guest-cannot-obtain-station-links', (await actions.getPublicGuestEntertainmentLinks('qa157-fa', guestId, accessKey)).length === 0);
events.get('qa157-fa').invitados[0].guestAccessToken = accessKey;
events.get('qa157-fa').others.entretenimiento.modules.fotocabina.enabled = false;
const withoutPhoto = await actions.getPublicGuestEntertainmentLinks('qa157-fa', guestId, accessKey);
check('disabled-station-not-offered', withoutPhoto.length === 6 && !withoutPhoto.some(link => link.id === 'fotocabina'));
events.get('qa157-fa').modulosContratados.entretenimiento = false;
const withoutEntertainment = await actions.getPublicGuestEntertainmentLinks('qa157-fa', guestId, accessKey);
check('uncontracted-entertainment-not-offered-but-contracted-buzon-remains', withoutEntertainment.length === 1 && withoutEntertainment[0].id === 'capsulaTiempo');
events.get('qa157-fa').modulosContratados.buzon = false;
check('uncontracted-buzon-not-offered', (await actions.getPublicGuestEntertainmentLinks('qa157-fa', guestId, accessKey)).length === 0);
const result = { source, testSha256: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), hashes, cases,
  summary: { pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual guest portal actions, DTO, station config/paths and HMAC tokens across two events/guests and seven modules',
  limits: ['Raw event storage and signed-media URL service are controlled adapters; no HTTP, SDK or real media URL signed',
    'No capture, printing, physical360, AI model, screen, hardware or actual mobile UI accepted',
    'No app-session bypass tested: station token scope path is checked without an app session'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: result.summary, failed: cases.filter(c => !c.pass) }));
if (result.summary.fail) process.exitCode = 1;
