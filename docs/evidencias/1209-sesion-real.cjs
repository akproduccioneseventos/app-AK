const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const source = ts.createSourceFile('page.tsx', fs.readFileSync(process.argv[2], 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const callbacks = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['handleUpload', 'retake'].includes(node.name.getText(source))) {
    callbacks[node.name.getText(source)] = node.initializer.arguments[0].getText(source);
  }
  ts.forEachChild(node, visit);
}
visit(source);
async function probe(changeSession) {
  let resolveUpload;
  let uploading = false, success = false, queued = false;
  const pending = new Promise(resolve => { resolveUpload = resolve; });
  const scope = {
    capturedImage: 'synthetic', photoSessionId: 'A', fiestaId: 'audit', activeTab: 'foto',
    accessToken: '', guestId: '', guestAccessToken: '', console,
    currentPhotoSessionIdRef: { current: 'A' }, activeUploadSessionIdRef: { current: null }, resetTimerRef: { current: null },
    setIsUploading: value => { uploading = value; }, setShowSuccess: value => { success = value; },
    setQueuedOffline: value => { queued = value; },
    dataUrlToFile: async () => ({}), navigator: { onLine: true }, FormData: class { append() {} },
    uploadTouchpixPhoto: () => pending, updateEntertainmentSessionStatus: async () => {},
    completeEntertainmentSessionCycle: async () => {}, startCamera: () => {},
    setTimeout: () => 1, clearTimeout: () => {}, classifyOfflineUploadError: () => 'permanent', alert: () => {},
  };
  for (const name of callbacks.retake.match(/\bset[A-Z]\w+/g) || []) if (!(name in scope)) scope[name] = () => {};
  const context = vm.createContext(scope);
  const compile = code => ts.transpileModule('(' + code + ')', { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  scope.retake = vm.runInContext(compile(callbacks.retake), context);
  const run = vm.runInContext(compile(callbacks.handleUpload), context);
  const task = run();
  await Promise.resolve(); await Promise.resolve();
  if (changeSession) {
    scope.retake();
    // Model the next participant's independently queued photo before A returns.
    queued = true;
  }
  resolveUpload({ success: true, post: { imageUrl: 'synthetic' } });
  await task;
  return { changeSession, uploading, success, queued, passed: !uploading && (changeSession ? !success && queued : success) };
}
(async () => {
  const results = [await probe(false), await probe(true)];
  console.log(JSON.stringify(results, null, 2));
  process.exitCode = results.every(result => result.passed) ? 0 : 1;
})();

