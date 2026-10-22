import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'fa3b492b8f1d6a77433a92f4d63b665cfea3747c';
const prior = '09ea4138f5146cd2dfa6b792eda31cc04c30843f';
const claude = '6e67caa14e4131a14234e1dea53bff37223becd9';
const gemini = '512881c2534da6d633bc7cc8840bd197c46db3b9';
const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const reports = ['193-portal-cliente-version-nueva.json','194-portal-controles-version-nueva.json','195-portal-operaciones-contrato.json','196-proveedor-corregido-dom-final.json','197-voz-meta-correcciones.json'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const git = args => { const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 }); assert.equal(r.status, 0, r.stderr); return r.stdout; };
const symbol = (sha, file, name) => {
  const text = git(['show', `${sha}:${file}`]), ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, `${sha}:${file}:${name}`); return node.getText(ast);
};
const selected = [
  ['src/app/actions/fiesta/portal.actions.ts','submitClientPayment'],
  ['src/app/actions/fiesta/portal.actions.ts','normalizeClientPaymentAmount'],
  ['src/app/actions/fiesta/portal.actions.ts','getFiestaByAccessKey'],
  ['src/app/actions/presupuestos.ts','getPresupuestoById'],
];
const equivalence = selected.map(([file,name]) => ({ file, name,
  currentHash: hash(symbol(source,file,name)),
  historicalSdkBodyIdentical: symbol(prior,file,name) === symbol(source,file,name),
  claudeBodyIdentical: symbol(claude,file,name) === symbol(source,file,name),
  geminiBodyIdentical: symbol(gemini,file,name) === symbol(source,file,name),
}));
const sdkDependencies = ['src/lib/security/portal-session.ts','src/lib/fiesta/recortar-para-afuera.ts','src/lib/fiesta/actualizar-fiesta.ts','src/lib/fiesta/get-fiesta-raw.ts','src/lib/generic-json-store.ts'];
const dependencyEquivalence = sdkDependencies.map(file => ({ file, identical: git(['show',`${prior}:${file}`]) === git(['show',`${source}:${file}`]) }));
const results = reports.map(name => {
  const raw = fs.readFileSync(new URL(name,import.meta.url)), report = JSON.parse(raw);
  assert.equal(report.source, source, name); assert.ok(!report.unexpected, `${name}: ${report.unexpected}`);
  assert.ok(!report.observedErrors?.some(item=>item.startsWith('QA_HARNESS')), name);
  const cases = report.cases;
  return { file: name, sha256: hash(raw), total: cases.length, pass: cases.filter(c=>c.pass).length, fail: cases.filter(c=>!c.pass).length, failedIds: cases.filter(c=>!c.pass).map(c=>c.id||c.name) };
});
assert.deepEqual(results.map(r=>[r.total,r.pass,r.fail]), [[15,10,5],[16,13,3],[15,13,2],[13,13,0],[8,8,0]]);
assert.ok(equivalence.every(item=>item.historicalSdkBodyIdentical && item.claudeBodyIdentical && item.geminiBodyIdentical));
const lock = JSON.parse(git(['show',`${source}:package-lock.json`]));
const removedChain = Object.keys(lock.packages).filter(name=>/node_modules\/(mind-ar|canvas|@mapbox\/node-pre-gyp)(\/|$)/.test(name));
assert.deepEqual(removedChain, []);
const receipt = { source, prior, claude, gemini, checkedAt: new Date().toISOString(), results,
  summary: results.reduce((a,r)=>({ total:a.total+r.total, pass:a.pass+r.pass, fail:a.fail+r.fail }),{total:0,pass:0,fail:0}),
  uniqueNewDefects: 8, separateUxFriction: 1, equivalence, dependencyEquivalence,
  dependencyChainRemoved: true, rootTar: lock.packages['node_modules/tar']?.version,
  claudeRuntimeDiff: git(['diff','--name-only',source,claude,'--','src','package.json','package-lock.json','next.config.ts']),
  historicalSdkScope: '190 remains executed on09ea. Selected action bodies and listed dependencies contrasted separately; never a new SDK execution for the entire current app.',
  manualOwnerWorkExcluded: true, appEdited: false, fullAppAccepted: false,
  limits: '67 focused criteria at one source, not all controls/roles. SDK190 historical corroboration not added to current count. Provider DOM and voice/Meta protocol scopes only. No current-source build/native, real integrations, model/voice, Hosting, hardware or exhaustive release certificate.' };
fs.writeFileSync(new URL('198-consolidado.json',import.meta.url), JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
