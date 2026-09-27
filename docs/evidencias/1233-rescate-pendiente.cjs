// Actual pure functions, synthetic in-flight queue record, no database or network.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const ts = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
function load(file, dependencies = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(root,file),'utf8');
  const js = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(js,{exports,require:name=>{
    if(!(name in dependencies)) throw new Error('Unknown dependency: '+name);
    return dependencies[name];
  },Date,console});
  return exports;
}
async function main() {
  const db = load('src/lib/offline/offline-db.ts');
  const policy = load('src/lib/offline/offline-upload-policy.ts');
  const helper = load('src/lib/touchpix/terminar-trabajo-ia.ts',{'@/lib/offline/offline-upload-policy':policy});
  const inFlight = {id:'audit-original',subiendoDesde:new Date().toISOString()};
  let resultUploads = 0;
  const result = await helper.terminarTrabajoIA({
    retenerOriginal:async()=>db.sePuedeRetener(inFlight),
    subir:async()=>{ resultUploads++; return {success:true}; },
    guardarEnEquipo:async()=>{}, soltarOriginal:async()=>{},
  });
  const report = {
    sourceSha:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    scope:'Actual sePuedeRetener and terminarTrabajoIA with a synthetic claimed record; upload of original has not completed. Not IndexedDB/browser E2E.',
    observed:{destino:result.destino,message:helper.avisoDelDestino(result.destino,true),resultUploads,confirmedOriginalUploads:0},
    passed:result.destino!=='publicada-la-original',
    expectation:'Claimed/in-flight is not confirmed publication; UI must distinguish them.',
  };
  fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
