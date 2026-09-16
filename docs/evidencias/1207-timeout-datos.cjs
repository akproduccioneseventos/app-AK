const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const root = process.argv[2];
function extract(file, names) {
  const sf = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const nodes = sf.statements.filter(n => n.name && names.includes(n.name.text));
  if (nodes.length !== names.length) throw Error('Missing symbol');
  return nodes.map(n => n.getText(sf)).join('\n');
}
const source = extract('src/lib/generic-json-store.ts', ['queryWithTimeout','getGenericDocId','unwrapGenericDocument','readGenericJsonFile','syncGenericJsonFile']) + '\n' + extract('src/lib/data-service.ts',['deepMerge','updateDataPartial']);
let data, slow, writes;
const ctx = { exports: {}, GENERIC_JSON_COLLECTION: 'json_documents',
  logger: { shouldSkipFirestoreDuringBuild: () => false, isBuildTime: () => false, isDefaultCredentialError: () => false, warn: () => {}, error: () => {}, compactError: e => e.message },
  isSafeTopLevelJsonFile: () => true, shouldUseLocalJsonOnly: () => false,
  syncToFirestore: async () => {}, writeLocalJsonFallback: async () => {}, scheduleAutoBackupAfterWrite: async () => {},
  // Shorten clock only, retain the real timeout and mutation functions.
  setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 10)), clearTimeout,
  getDbAdmin: async () => ({ collection: () => ({ doc: () => ({
    get: () => slow ? new Promise(() => {}) : Promise.resolve({ exists: true, data: () => ({ _data: data }) }),
    set: async doc => { writes++; data = doc._data; }
  }) }) })
};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,ctx);
(async () => {
  const results = [];
  for (const delayed of [false,true]) {
    data = { nombre: 'Salon de prueba', capacidad: 120 }; writes = 0; slow = delayed;
    let error = null;
    try { await ctx.exports.updateDataPartial('audit-settings.json',{ nombre: 'Nombre nuevo' }); } catch(e) { error = e.message; }
    results.push({ slow: delayed, data, writes, error, preservedCapacity: data.capacidad === 120 });
  }
  console.log(JSON.stringify(results,null,2));
  process.exitCode = results.every(r => r.preservedCapacity) ? 0 : 1;
})().catch(e => { console.error(e); process.exitCode = 2; });

