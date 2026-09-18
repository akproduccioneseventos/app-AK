const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
function extract(file, name, scope) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(process.argv[2], file), 'utf8'), ts.ScriptTarget.Latest, true);
  const node = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  if (!node) throw Error('Missing symbol: ' + name);
  const js = ts.transpileModule(node.getText(source).replace(/^export\s+/, '') + '\n' + name, {compilerOptions:{target:ts.ScriptTarget.ES2020, module:ts.ModuleKind.CommonJS}}).outputText;
  return vm.runInNewContext(js, scope);
}
(async () => {
  const results = [];
  const check = extract('load.ts', 'checkAssetConflicts', {
    requireAppSession: async () => {}, getFiestas: async () => [],
    getActivosFijos: async () => [{id:'asset', cantidadDisponible:10}]
  });
  for (const amounts of [[6], [11], [6,6]]) {
    const out = await check('party', '2026-10-10', amounts.map((q,i) => ({id:String(i), origenId:'asset', cantidad:String(q)})));
    const expected = amounts.reduce((a,b)=>a+b,0)>10;
    results.push({case:'stock-'+amounts.join('+'), conflicts:out.map(x=>x.hasConflict), passed:out.some(x=>x.hasConflict)===expected});
  }
  for (const renamed of [false,true]) {
    let deleted = false;
    const remove = extract('assets.ts', 'deleteActivoFijo', {
      requireAppSession: async () => {}, getActivoFijoById: async () => ({id:'asset',nombre:renamed?'Nombre nuevo':'Nombre original'}),
      require: () => ({getFiestas: async () => [{listaDeCargaOperativa:{categorias:[{items:[{id:'gen_asset',origenId:'asset',nombre:'Nombre original'}]}]}}]}),
      deleteDataItem: async () => {deleted=true;return true;}, ACTIVOS_FIJOS_FILE:'unused',ACTIVOS_FIJOS_COLLECTION:'unused'
    });
    const result = await remove('asset');
    results.push({case:renamed?'delete-assigned-renamed':'delete-assigned-original', result, deleted, passed:!deleted&&!result.success});
  }
  console.log(JSON.stringify(results,null,2));
  process.exitCode = results.every(x=>x.passed)?0:1;
})();

