import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de';
const target = new URL('221-solicitudes-portal-sdk.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve observed receipt');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8085');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ak-producciones');
assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY, 'false');
const req = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = req('typescript');
const { initializeApp, deleteApp } = req('firebase-admin/app');
const { getFirestore } = req('firebase-admin/firestore');
const app = initializeApp({ projectId: 'demo-ak-producciones' }, 'qa221-only');
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
const protectedPayments = load('src/lib/fiesta/reponer-la-plata.ts');
const actualSave = load('src/app/actions/fiesta/fiesta.actions.ts', ['CAMPOS_DE_PLATA_Y_CONTRATO','PAGO_DE_LA_COMPRA','tocaLaPlata','reponerLaPlata','validatePersonalAssignments','saveFiesta'], {
  ...profile, ...redaction, ...protectedPayments, ...guards,
  esEquipoParaFiesta: async () => false,
}, {
  '@/lib/auth/session-token': { verifySession: async () => ({ success: false }) },
  '@/lib/fiesta/get-fiesta-raw': { getFiestaByIdRaw: raw },
  '@/lib/fiesta/recortar-para-afuera': redaction,
  '@/lib/fiesta/actualizar-fiesta': updater,
});
const actions = load('src/app/actions/fiesta/portal.actions.ts', ['createRequestId','normalizeClientPaymentAmount','submitClientMenuChangeRequest','submitClientServiceAddRequest'], {
  ...portalSession, ...actualSave, ...updater, getFiestaById: getEvent, crypto,
  sanitizeActionError: error => error instanceof Error ? error.message : String(error),
  uploadToStorage: async () => { uploadCalls++; if (uploadFails) throw new Error('QA190_UPLOAD_FAILED'); return 'payments/qa190/receipt.png'; },
  createNotification: async () => ({ success: true }), notifyClientPaymentSubmitted: async () => {},
});
const check = (id, pass, observed) => cases.push({ id, pass: Boolean(pass), observed });
function forTwoReads() { let count = 0, release; const gate = new Promise(resolve => { release = resolve; }); return async () => { count++; if (count === 2) release(); await gate; }; }
async function seed(suffix) {
  currentId = `qa221-${suffix}`; ids.push(currentId); barrier = undefined; uploadCalls = 0; uploadFails = false;
  await db.collection('fiestas').doc(currentId).set({ id: currentId, configuracion: { nombreEvento: `Evento ficticio ${currentId}` },
    clientPortalSettings: { enabled: true, accessKey: `key-${currentId}` }, clientPaymentNotifications: [],
    clientMenuChangeRequests: [], clientServiceChangeRequests: [], presupuestoId: 'qa221-untouched-budget',
    personalAsignado: [{ empleadoId: 'qa190-worker', eventSalary: 3000 }] });
  cookies.set('ak_portal_session', portalSession.createPortalSession(currentId, `key-${currentId}`));
}
let unexpected;
try {
  const menu = delta => actions.submitClientMenuChangeRequest(currentId, { adultosDelta: delta, ninosAdolescentesDelta: 0, montoAdicional: delta * 100, nuevoTotalEstimado: 1000 + delta * 100, notaCliente: `QA221-${delta}` });
  const service = id => actions.submitClientServiceAddRequest(currentId, { servicioId: id, nombreServicio: id, cantidad: 1, precioBase: 200, ajustePorcentaje: 0, montoAdicional: 200, nuevoTotalEstimado: 1200 });
  await seed('sequential');
  const first = await menu(1), second = await menu(2), third = await service('qa221-extra-a');
  const sequential = await raw(currentId);
  check('distinct-sequential-requests-persist-sdk', first.success && second.success && third.success && sequential.clientMenuChangeRequests.length === 2 && sequential.clientServiceChangeRequests.length === 1, { results: [first,second,third], menus: sequential.clientMenuChangeRequests, services: sequential.clientServiceChangeRequests });
  check('requests-remain-pending-not-budget-charges-sdk', [...sequential.clientMenuChangeRequests,...sequential.clientServiceChangeRequests].every(item => item.status === 'pendiente') && sequential.presupuestoId === 'qa221-untouched-budget' && (await db.collection('presupuestos').get()).size === 0, {});
  check('actual-save-preserves-portal-key-and-private-salary-sdk', sequential.clientPortalSettings.accessKey === `key-${currentId}` && sequential.personalAsignado[0].eventSalary === 3000, {});
  for (const mode of ['menu','service','mixed']) {
    await seed(mode); barrier = forTwoReads();
    const results = await Promise.all(mode === 'menu' ? [menu(1),menu(2)] : mode === 'service' ? [service('qa221-extra-a'),service('qa221-extra-b')] : [menu(1),service('qa221-extra-a')]);
    barrier = undefined; const stored = await raw(currentId);
    const saved = [...stored.clientMenuChangeRequests,...stored.clientServiceChangeRequests];
    check(`concurrent-${mode}-retains-two-distinct-requests-sdk`, results.every(item => item.success) && saved.length === 2 && results.every(item=>saved.some(row=>row.id===item.requestId)), { results, menus: stored.clientMenuChangeRequests, services: stored.clientServiceChangeRequests });
  }
  await seed('invalid');
  const invalidMenu = await menu(0);
  check('empty-guest-increase-rejected-sdk', invalidMenu.success === false && (await raw(currentId)).clientMenuChangeRequests.length === 0, invalidMenu);
  const invalidService = await service('');
  check('empty-service-rejected-sdk', invalidService.success === false && (await raw(currentId)).clientServiceChangeRequests.length === 0, invalidService);
  cookies.clear(); const denied = await menu(1);
  check('missing-portal-session-no-request-sdk', denied.success === false && (await raw(currentId)).clientMenuChangeRequests.length === 0, denied);
} catch (error) { unexpected = String(error.stack || error); process.exitCode = 2; }
finally {
  barrier = undefined;
  for (const id of ids) await db.collection('fiestas').doc(id).delete();
  const remaining = (await db.collection('fiestas').get()).size;
  await db.terminate(); await deleteApp(app);
  const receipt = { source, checkedAt: new Date().toISOString(), actualSdk: true, hashes, cases, unexpected,
    summary: { total: cases.length, pass: cases.filter(item => item.pass).length, fail: cases.filter(item => !item.pass).length },
    remainingDocuments: remaining, realServices: false, appEdited: false,
    scope: 'Firestore Admin SDK emulator; actual menu/service request actions, real saveFiesta (anonymous signed-portal path), money-field preservation, portal signature/access guard, actualizarFiesta, generic transaction and secret preservation. Read adapter applies real client redactor and synchronizes two pre-save reads. Team predicate false and app session absent; internal notifications controlled. No budget charge, actual provider, HTTP/browser or all-role certification.' };
  fs.writeFileSync(target, JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ source, summary: receipt.summary, remainingDocuments: remaining, unexpected, failures: cases.filter(item => !item.pass) }));
  if (receipt.summary.fail && !unexpected) process.exitCode = 1;
}
