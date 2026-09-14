const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const source = ts.createSourceFile('page.tsx', fs.readFileSync(process.argv[2], 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(n) {
  if (ts.isVariableDeclaration(n) && n.name.getText(source) === 'handleUpload') callback = n.initializer.arguments[0].getText(source);
  ts.forEachChild(n, visit);
}
visit(source);
if (!callback) throw Error('Missing handleUpload');
async function probe(changeSession) {
  let finish, resets = 0, success = 0, liveSession = 'A';
  const timers = [];
  const upload = new Promise(resolve => { finish = resolve; });
  const scope = { capturedImage: 'synthetic', photoSessionId: 'A', fiestaId: 'audit', activeTab: 'foto',
    accessToken: '', guestId: '', guestAccessToken: '',
    setIsUploading: () => {}, dataUrlToFile: async () => ({}), navigator: { onLine: true },
    FormData: class { append() {} }, uploadTouchpixPhoto: () => upload,
    updateEntertainmentSessionStatus: async () => {}, setQueuedOffline: () => {},
    setShowSuccess: value => { if (value) success++; },
    setTimeout: fn => { timers.push(fn); }, retake: () => { resets++; },
    classifyOfflineUploadError: () => 'permanent', alert: () => {}, console
  };
  // React callbacks retain the lexical values of the render that created them.
  const code = ts.transpileModule('const run = ' + callback + '; run;', {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
  const run = vm.runInNewContext(code, scope);
  const pending = run();
  await Promise.resolve(); await Promise.resolve();
  if (changeSession) liveSession = 'B';
  finish({ success:true, post:{imageUrl:'synthetic'} });
  await pending;
  timers.forEach(fn => fn());
  return {liveSession, resets, success, passed: changeSession ? resets === 0 && success === 0 : resets === 1 && success === 1};
}
(async () => { const results = [await probe(false),await probe(true)]; console.log(JSON.stringify(results,null,2)); process.exitCode = results.every(r=>r.passed)?0:1; })();

