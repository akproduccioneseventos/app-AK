const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const root = process.argv[2];
function extract(file, names) {
  const s = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = {};
  function visit(n) {
    if (ts.isFunctionDeclaration(n) && n.name && names.includes(n.name.text)) found[n.name.text] = n.getText(s).replace(/^export\s+/, '');
    if (ts.isVariableDeclaration(n) && names.includes(n.name.getText(s))) found[n.name.getText(s)] = 'const ' + n.getText(s) + ';';
    ts.forEachChild(n, visit);
  }
  visit(s);
  if (names.some(n => !found[n])) throw Error('Missing production symbol');
  return names.map(n => found[n]).join('\n');
}
function evaluate(code, scope, expression) {
  return vm.runInNewContext(ts.transpileModule(code + '\n' + expression, {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText, scope);
}
async function backup(failRead, realReader = false) {
  let manifest;
  const ref = { collection: () => ({ doc: () => ({}) }), set: async x => { manifest = x; } };
  const scope = {
    BACKUP_COLLECTIONS: [{file:'customers.json',defaultValue:[]},{file:'presupuestos.json',defaultValue:[]}],
    readData: async file => { if (failRead && file === 'presupuestos.json') throw Error('synthetic read failure'); return [{id:'synthetic'}]; },
    console: {warn:()=>{}}, getBackupDb: async()=>({collection:()=>({doc:()=>ref})}), SNAPSHOTS_COLLECTION:'test',
    encodeSnapshotValue: value => [{index:0,content:JSON.stringify(value)}], getBackupValueCount: value=>value.length,
    commitWrites:async()=>{}, pruneV2Snapshots:async()=>{}, deleteV2Snapshot:async()=>{}, toRestorePoint:x=>x,
  };
  if (realReader) {
    scope.readData = evaluate(extract('data-service.ts',['readData']), {
      shouldUseLocalJsonOnly:()=>false,
      readFromFirestore:async()=>{throw Error('synthetic unavailable database');},
      readGenericJsonFile:async()=>null,
      readLocalJsonFallback:async()=>null,
      logger:{isBuildTime:()=>false,isDefaultCredentialError:()=>false,error:()=>{},compactError:e=>e.message},
    }, 'readData');
  }
  const result = await evaluate(extract('backup.ts',['readAllBackupData','createRestorePointInternal']),scope,'createRestorePointInternal(false)');
  if (realReader) return {case:'real-readData-loses-read-failure',success:result.success,status:manifest?.status,files:manifest?.files,passed:!result.success};
  return {case:failRead?'partial-source':'complete-source',success:result.success,status:manifest?.status,collections:manifest?.collections,passed:failRead?!result.success:result.success&&manifest.collections===2};
}
async function deletion(loggedIn, role) {
  let deleted = false;
  const scope={ PERMISOS:{ADMINISTRACION:'administracion'}, NOMBRE_DEL_PERFIL:{operador:'Operador'}, perfilDe:()=> 'operador', puede:user=>user?.role==='admin', verifySession:async()=>({success:loggedIn,user:{role,perfil:role==='admin'?'dueno':'operador'}}),
    getBackupDb:async()=>({collection:()=>({doc:()=>({get:async()=>({exists:true})})})}), SNAPSHOTS_COLLECTION:'test',
    deleteV2Snapshot:async()=>{deleted=true;} };
  let result;
  try { result=await evaluate(extract('require-session.ts',['hasAppSession','requireAppSession','requirePermiso'])+'\n'+extract('backup.ts',['deleteRestorePoint']),scope,"deleteRestorePoint('synthetic')"); }
  catch(e){result={success:false};}
  return {case:'delete-'+(loggedIn?role:'anonymous'),deleted,success:result.success,passed:loggedIn&&role==='admin'?deleted:!deleted};
}
async function restoreUi(partial) {
  const notices=[];let reloads=0;
  const scope={file:{},toast:x=>notices.push(x),setIsRestoringZip:()=>{},setFile:()=>{},
    FormData:class{append(){}},fetch:async()=>({ok:true,json:async()=>({success:true,errors:partial?['presupuestos.json']:[],message:partial?'Restauracion parcial':'Completa'})}),
    setTimeout:fn=>fn(),window:{location:{reload:()=>reloads++}}};
  await evaluate(extract('restore.ts',['comoSalioLaRestauracion','queSeLeDice'])+'\n'+extract('backup-page.tsx',['handleRestoreFromZip']),scope,'handleRestoreFromZip()');
  const complete=notices.some(x=>/Completa/.test(x.title));
  return {case:partial?'partial-restore-ui':'complete-restore-ui',complete,reloads,passed:partial?!complete:complete};
}
(async()=>{
  const results=[await backup(false),await backup(true),await deletion(false,'user'),await deletion(true,'admin'),await deletion(true,'user'),await restoreUi(false),await restoreUi(true),await backup(false,true)];
  const state = evaluate(extract('state.ts',['comoEstaElRespaldo']), {}, "comoEstaElRespaldo");
  results.push({case:'unknown-status',passed:state({cargando:false,backupStatus:null})==='no-se-pudo-saber'});
  results.push({case:'loading-status',passed:state({cargando:true,backupStatus:null})==='cargando'});
  console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;
})();


