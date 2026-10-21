import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'daefbdc00b7a43f4f252dcca6e7d9565d4d30d10';
const target = new URL('173-retest-proveedor-sdk.json', import.meta.url);
assert.equal(fs.existsSync(target), false, 'Preserve receipts');
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
assert.equal(process.env.AK_ENTORNO_AISLADO,'true');
assert.equal(process.env.AK_USE_LOCAL_JSON_ONLY,'false');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
assert.match(process.cwd().replaceAll(String.fromCharCode(92),'/'),/\/ak-qa-166-[^/]+$/);
const sdkReq=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const {initializeApp,deleteApp}=sdkReq('firebase-admin/app');
const {getFirestore}=sdkReq('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-ak-producciones'},'qa168-provider');
const db=getFirestore(app),collection=db.collection('proveedor_portal');
assert.equal((await collection.get()).empty,true,'Fresh own emulator collection required');
const hashes = {}, symbols = {}, cases = [];
const copy = value => structuredClone(value);
const read = (file, sha = source) => {
  const p = spawnSync('git', ['show', `${sha}:${file}`], { cwd: root, encoding: 'utf8' }); assert.equal(p.status, 0, p.stderr); return p.stdout;
};
const load = (file, names, context = {}) => {
  const text = read(file); hashes[file] = crypto.createHash('sha256').update(text).digest('hex');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const nodes = ast.statements.filter(n => !ts.isImportDeclaration(n) && !ts.isExportDeclaration(n) &&
    (!names || ts.isFunctionDeclaration(n) && names.includes(n.name?.text) || ts.isVariableStatement(n) && n.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))));
  if (names) for (const name of names) assert.ok(nodes.some(n => ts.isFunctionDeclaration(n) && n.name?.text === name ||
    ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(ast) === name)), name);
  const code = ts.transpileModule(nodes.map(n => n.getText(ast)).join('\n'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText + (names ? `\nexports.__qa = {${names.join(',')}};` : '');
  const exports = {};
  vm.runInNewContext(code, { exports, Date, Math, JSON, Object, Array, console: { log() {}, warn() {}, error() {} },
    require: id => { throw new Error(`Unexpected dependency: ${id}`); }, ...context }, { filename: file, timeout: 3000 });
  return names ? exports.__qa : exports;
};
const marks = load('src/lib/marca-de-lectura.ts', null);
const initial = id => ({ id, token: `qa163-token-${id}`, activo: true, venceEl: '2099-01-01T00:00:00Z',
  fiestaId: `qa163-event-${id}`, nombreProveedor: 'Proveedor ficticio', estadoActual: 'Pendiente', notas: '',
  tareas: [{ id: 'task-a', texto: 'Montaje ficticio A', completada: false }, { id: 'task-b', texto: 'Montaje ficticio B', completada: false }] });
let hook,commits,readCount,barrier,readArrivals,releaseReads;
const originalTransaction=db.runTransaction.bind(db);
db.runTransaction=async fn=>{
  if(hook){const once=hook;hook=null;await once();}
  let wrote=false;
  const result=await originalTransaction(async t=>{
    wrote=false;
    return fn({get:r=>t.get(r),set:(r,item)=>{wrote=true;t.set(r,item);}});
  });
  if(wrote)commits++;
  return result;
};
const dbAdmin=db;
const reset=async()=>{
  for(const d of (await collection.get()).docs)await d.ref.delete();
  for(const id of ['a','b'])await collection.doc(id).set(initial(id));
  hook=null;commits=0;readCount=0;readArrivals=0;releaseReads=null;barrier=null;
};
const data = load('src/lib/data-service.ts', ['shouldUseLocalJsonOnly','validateCollectionMutationInput','cleanCollectionItem','updateDataItem','mutateDataItem'], {
  process: { env: {} }, ...marks, refreshCollectionFallback: async () => {},
  require: id => { assert.equal(id, './firebase/server'); return { dbAdmin }; },
});
const portal = load('src/app/actions/provider-portal.ts', null, { ...data,
  readData:async name=>{
  assert.equal(name,'proveedor-portal.json');
  const rows=(await collection.get()).docs.map(d=>d.data());readCount++;
  if(barrier){readArrivals++;if(readArrivals===2)releaseReads();await barrier;}
  return rows;
},
  randomUUID: crypto.randomUUID,
});
const run = async (name, action, predicate) => {
  await reset();
  if(name.startsWith('concurrent-')||name.startsWith('arrival-and-note-'))barrier=new Promise(r=>{releaseReads=r;});
  try { const responses = await action(); const persisted=(await collection.get()).docs.map(d=>d.data());
    cases.push({ name, pass: Boolean(predicate(responses, persisted)), responses, persisted, commits, readCount });
  } catch (e) { cases.push({ name, pass: false, error: String(e.message || e), commits, readCount }); }
};
const token = 'qa163-token-a';
await run('sequential-two-tasks-both-survive', async () => [await portal.toggleTareaProveedor(token,'task-a'), await portal.toggleTareaProveedor(token,'task-b')],
  (r, docs) => r.every(x => x.success) && docs[0].tareas.every(t => t.completada) && JSON.stringify(docs[1]) === JSON.stringify(initial('b')));
for (const order of [['task-a','task-b'],['task-b','task-a']]) {
  await run(`concurrent-two-tasks-${order.join('-')}`, () => Promise.all(order.map(id => portal.toggleTareaProveedor(token,id))),
    (r, docs) => r.every(x => x.success) && docs[0].tareas.every(t => t.completada) && JSON.stringify(docs[1]) === JSON.stringify(initial('b')));
}
for (const noteFirst of [true,false]) {
  await run(`arrival-and-note-${noteFirst ? 'note-first' : 'arrival-first'}`, () => {
    const ops = [() => portal.addNotaProveedor(token,'Nota ficticia QA163'), () => portal.confirmarLlegada(token)];
    if (!noteFirst) ops.reverse(); return Promise.all(ops.map(fn => fn()));
  }, (r, docs) => r.every(x => x.success) && docs[0].notas === 'Nota ficticia QA163' && docs[0].estadoActual === 'Llegó' && Boolean(docs[0].llegadaConfirmadaEn));
}
await run('revocation-between-read-and-commit-is-not-undone', () => {
  hook = () => collection.doc('a').update({activo:false});
  return portal.toggleTareaProveedor(token,'task-a');
}, (r, docs) => !r.success && docs[0].activo === false);
await run('token-rotation-between-read-and-commit-is-not-undone', () => {
  hook = () => collection.doc('a').update({token:'qa163-new-token'});
  return portal.addNotaProveedor(token,'Nota de intento viejo');
}, (r, docs) => !r.success && docs[0].token === 'qa163-new-token');
await run('revoked-before-read-denied', async () => { await collection.doc('a').update({activo:false}); return portal.toggleTareaProveedor(token,'task-a'); },
  r => !r.success && commits === 0);
await run('missing-document-at-commit-not-recreated', () => { hook = () => collection.doc('a').delete(); return portal.confirmarLlegada(token); },
  (r, docs) => !r.success && !docs.some(d => d.id === 'a') && commits === 0);
await run('positive-control-real-mutator-composes-current-fields', () => Promise.all(['task-a','task-b'].map(taskId =>
  data.mutateDataItem('proveedor-portal.json','proveedor_portal','a', actual => ({ ...actual, tareas: actual.tareas.map(t => t.id === taskId ? { ...t, completada: true } : t) })))),
  (_r, docs) => docs[0].tareas.every(t => t.completada) && commits === 2);
const selected = {
  'src/app/actions/provider-portal.ts': ['getProveedorByToken','motivoDeRechazo','cambiarAccesoDelProveedor','confirmarLlegada','toggleTareaProveedor','addNotaProveedor'],
  'src/lib/data-service.ts': ['updateDataItem','mutateDataItem'],
};
for (const [file, names] of Object.entries(selected)) for (const name of names) {
  const get = sha => { const ast = ts.createSourceFile(file,read(file,sha),ts.ScriptTarget.Latest,true);
    const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name); return fn ? fn.getText(ast) : null; };
  const current = get(source);
  symbols[`${file}:${name}`] = { sha256: crypto.createHash('sha256').update(current).digest('hex'),
    sameClaude108e: get('108e17b4387237fc921ea12e8d1eb65b20f62ac9') === current,
    sameGemini45a: get('45a0b1d4783ad58846c2e2d07ad8f318287024bf') === current };
}
for(const doc of (await collection.get()).docs)await doc.ref.delete();
const remaining=(await collection.get()).size;
await db.terminate();
await deleteApp(app);
assert.equal(remaining,0);
const result = { actualSdk:true,remainingDemoDocuments:remaining,source, testSha256: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), hashes, symbols, cases,
  summary: { total: cases.length, pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
  scope: 'Actual provider actions and data-service transaction bodies with actual Firestore Admin SDK against own demo emulator, two fictitious documents',
  limits: ['Firestore SDK/transactions real against own emulator, coordinated read barriers; no production timing or HTTP/native UI',
    'QA166 directory supplies isolated HOME/rules only; no old Next build is executed; application bodies loaded from exact daef Git objects',
    'Revocation/rotation use SDK updates at controlled boundary, not a separate admin HTTP/UI action; fallback backup intentionally adapted',
    'No payment/salary/cost, external account, real supplier, message or hardware'], appEdited: false };
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ source, summary: result.summary, failed: cases.filter(c => !c.pass).map(c => ({ name: c.name, responses: c.responses, persistedA: c.persisted?.[0], error: c.error })) }));
if (result.summary.fail) process.exitCode = 1;
