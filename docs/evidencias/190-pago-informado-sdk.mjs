import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '09ea4138f5146cd2dfa6b792eda31cc04c30843f';
const target = new URL('190-pago-informado-sdk.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve observed receipt');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8085');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ak-producciones');
assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY, 'false');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript');
const { initializeApp, deleteApp } = req('firebase-admin/app');
const { getFirestore } = req('firebase-admin/firestore');
const app = initializeApp({ projectId: 'demo-ak-producciones' }, 'qa190-only');
const db = getFirestore(app); db.settings({ ignoreUndefinedProperties: true });
const hashes = {}, cases = [], cookies = new Map(), ids = [];
let currentId, barrier, uploadFails = false, uploadCalls = 0;
const clone = value => JSON.parse(JSON.stringify(value));
const read = file => {
  const result = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  assert.equal(result.status, 0, result.stderr); hashes[file] = crypto.createHash('sha256').update(result.stdout).digest('hex'); return result.stdout;
};
function load(file, names = null, globals = {}, dependencies = {}) {
  const raw = read(file), ast = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true);
  const selected = names ? ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)
    || ts.isVariableStatement(node) && node.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))) : ast.statements;
  if (names) for (const name of names) assert.ok(selected.some(node => ts.isFunctionDeclaration(node) && node.name?.text === name || ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === name)), name);
  const code = ts.transpileModule(selected.map(node => node.getText(ast)).join('\n'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText + (names ? `\nexports.__qa={${names.join(',')}};` : '');
  const module = { exports: {} }, localRequire = id => { assert.ok(Object.hasOwn(dependencies,id), `Unconfigured ${id}`); return dependencies[id]; };
  new Function('require','module','exports',...Object.keys(globals),code)(localRequire,module,module.exports,...Object.values(globals));
  return names ? module.exports.__qa : module.exports;
}
const raw = async id => { const doc = await db.collection('fiestas').doc(id).get(); return doc.exists ? doc.data() : null; };
const profile = load('src/lib/auth/perfiles.ts');
const portalSession = load('src/lib/security/portal-session.ts', null, {}, {
  crypto, 'next/headers': { cookies: async () => ({ get: name => cookies.has(name) ? { value: cookies.get(name) } : undefined }) },
  '@/lib/fiesta/get-fiesta-raw': { getFiestaByIdRaw: raw },
});
const redaction = load('src/lib/fiesta/recortar-para-afuera.ts', null, {}, { '@/lib/auth/perfiles': profile });
const secrets = load('src/lib/fiesta/get-fiesta-raw.ts', ['preserveFiestaSecrets'], { getFiestaByIdRaw: raw, reponerLoRecortado: redaction.reponerLoRecortado });
const storage = load('src/lib/generic-json-store.ts', ['getDbAdmin','sinIndefinidos','mutarDocumentoConTransaccion'], {}, { './firebase/server': { dbAdmin: db } });
const getEvent = async id => {
  const value = await raw(id);
  if (barrier) await barrier();
  if (!value) return null;
  const result = clone(value);
  if (result.clientPortalSettings) result.clientPortalSettings.accessKey = undefined;
  return redaction.recortarFiestaParaAfuera(result, { esCliente: true });
};
const guards = load('src/app/actions/fiesta/fiesta.actions.ts', ['requireFiestaWriteAccess'], {
  esEquipoParaFiesta: async () => false, verifyPortalSession: portalSession.verifyPortalSession,
});
const updater = load('src/lib/fiesta/actualizar-fiesta.ts', ['fiestaUpdateQueues','acquireFiestaUpdateLock','actualizarFiesta'], {
  ...guards, ...storage, ...secrets, getFiestaById: raw, LECTURA_COMPLETA: Symbol('qa190-full'), quienEsElEquipo: async () => () => false,
});
const actions = load('src/app/actions/fiesta/portal.actions.ts', ['normalizeClientPaymentAmount','submitClientPayment'], {
  ...portalSession, ...updater, getFiestaById: getEvent, crypto,
  sanitizeActionError: error => error instanceof Error ? error.message : String(error),
  uploadToStorage: async () => { uploadCalls++; if (uploadFails) throw new Error('QA190_UPLOAD_FAILED'); return 'payments/qa190/receipt.png'; },
  createNotification: async () => ({ success: true }), notifyClientPaymentSubmitted: async () => {},
});
const check = (id, pass, observed) => cases.push({ id, pass: Boolean(pass), observed });
function forTwoReads() { let count = 0, release; const gate = new Promise(resolve => { release = resolve; }); return async () => { count++; if (count === 2) release(); await gate; }; }
async function seed(suffix) {
  currentId = `qa190-${suffix}`; ids.push(currentId); barrier = undefined; uploadCalls = 0; uploadFails = false;
  await db.collection('fiestas').doc(currentId).set({ id: currentId, configuracion: { nombreEvento: `Evento ficticio ${currentId}` },
    clientPortalSettings: { enabled: true, accessKey: `key-${currentId}` }, clientPaymentNotifications: [],
    personalAsignado: [{ empleadoId: 'qa190-worker', eventSalary: 3000 }] });
  cookies.set('ak_portal_session', portalSession.createPortalSession(currentId, `key-${currentId}`));
}
let unexpected;
try {
  await seed('sequential');
  check('portal-actual-signed-cookie-accepted', await portalSession.verifyPortalSession(currentId), {});
  const first = await actions.submitClientPayment(currentId, 500), retry = await actions.submitClientPayment(currentId, 500);
  const sequential = await raw(currentId);
  check('sequential-retry-one-notification-sdk', first.success && retry.success && first.notificationId === retry.notificationId && sequential.clientPaymentNotifications.length === 1, { first, retry, notifications: sequential.clientPaymentNotifications });
  check('updater-preserves-key-and-private-staff-sdk', sequential.clientPortalSettings.accessKey === `key-${currentId}` && sequential.personalAsignado[0].eventSalary === 3000, { accessKeyPreserved: sequential.clientPortalSettings.accessKey === `key-${currentId}`, salary: sequential.personalAsignado[0].eventSalary });
  await seed('same-simultaneous'); barrier = forTwoReads();
  const same = await Promise.all([actions.submitClientPayment(currentId, 500), actions.submitClientPayment(currentId, 500)]); barrier = undefined;
  const sameDocument = await raw(currentId);
  check('same-report-concurrent-one-notification-sdk', same.every(item => item.success) && same[0].notificationId === same[1].notificationId && sameDocument.clientPaymentNotifications.length === 1, { results: same, notifications: sameDocument.clientPaymentNotifications });
  await seed('different-simultaneous'); barrier = forTwoReads();
  const different = await Promise.all([actions.submitClientPayment(currentId, 250), actions.submitClientPayment(currentId, 300)]); barrier = undefined;
  const differentDocument = await raw(currentId);
  check('different-reports-retain-both-sdk', different.every(item => item.success) && differentDocument.clientPaymentNotifications.length === 2 && differentDocument.clientPaymentNotifications.reduce((sum,item) => sum + item.monto,0) === 550, { results: different, notifications: differentDocument.clientPaymentNotifications });
  await seed('upload'); uploadFails = true;
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/X1kAAAAASUVORK5CYII=';
  const failedUpload = await actions.submitClientPayment(currentId, 500, png, 'qa190.png'); uploadFails = false;
  const uploadRetry = await actions.submitClientPayment(currentId, 500, png, 'qa190.png'), uploadDocument = await raw(currentId);
  check('failed-attachment-retry-not-silently-lost-sdk', !failedUpload.success || Boolean(failedUpload.warning) || Boolean(uploadDocument.clientPaymentNotifications[0]?.comprobanteUrl), { failedUpload, uploadRetry, notifications: uploadDocument.clientPaymentNotifications, uploadCalls });
  await seed('invalid');
  for (const amount of [0,-1,NaN]) {
    const result = await actions.submitClientPayment(currentId, amount);
    check(`invalid-amount-${String(amount)}-no-notification-sdk`, result.success === false && (await raw(currentId)).clientPaymentNotifications.length === 0, result);
  }
  cookies.set('ak_portal_session', portalSession.createPortalSession('qa190-other-event', 'other-key'));
  const other = await actions.submitClientPayment(currentId, 500);
  check('foreign-event-session-rejected-sdk', other.success === false && (await raw(currentId)).clientPaymentNotifications.length === 0, other);
  await seed('revoked'); await db.collection('fiestas').doc(currentId).update({ 'clientPortalSettings.accessKey': 'rotated-qa190-key' });
  const revoked = await actions.submitClientPayment(currentId, 500);
  check('rotated-key-before-request-rejected-sdk', revoked.success === false && (await raw(currentId)).clientPaymentNotifications.length === 0, revoked);
} catch (error) { unexpected = String(error.stack || error); process.exitCode = 2; }
finally {
  barrier = undefined;
  for (const id of ids) await db.collection('fiestas').doc(id).delete();
  const remaining = (await db.collection('fiestas').get()).size;
  await db.terminate(); await deleteApp(app);
  const receipt = { source, checkedAt: new Date().toISOString(), actualSdk: true, hashes, cases, unexpected,
    summary: { total: cases.length, pass: cases.filter(item => item.pass).length, fail: cases.filter(item => !item.pass).length },
    remainingDocuments: remaining, realServices: false, appEdited: false,
    scope: 'Firestore Admin SDK emulator; actual notification action, portal signatures, access guard, actualizarFiesta, generic transaction and secret preservation. Read adapter applies real client redactor. Anonymous-team predicate, Storage and internal mail/notification adapters controlled. No ledger charge, actual bucket upload, HTTP/browser or all-role permission certification.' };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, remainingDocuments: remaining, unexpected, failures: cases.filter(item => !item.pass) }));
  if (receipt.summary.fail && !unexpected) process.exitCode = 1;
}
