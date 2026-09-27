// Isolated audit: actual source, mocked transport/storage. No production writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const ts = require(process.env.AUDIT_TYPESCRIPT);
const root = path.resolve(process.argv[2]);
const results = [];
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const transpile = s => ts.transpileModule(s, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
function load(p, deps = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(transpile(read(p)), { exports, require: n => {
    if (!(n in deps)) throw new Error('Unmocked import: ' + n);
    return deps[n];
  }, console, File, FormData, Blob, Date, ...globals }, { filename: p });
  return exports;
}
function declaration(p, name) {
  const source = ts.createSourceFile(p, read(p), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function walk(n) {
    if (ts.isVariableDeclaration(n) && n.name.getText(source) === name) found = n.getText(source);
    ts.forEachChild(n, walk);
  }
  walk(source);
  if (!found) throw new Error('Missing declaration: ' + name);
  return found;
}
function check(name, passed, observed) { results.push({ name, passed, observed }); }
async function main() {
  const policy = load('src/lib/offline/offline-upload-policy.ts');
  const finish = load('src/lib/touchpix/terminar-trabajo-ia.ts', { '@/lib/offline/offline-upload-policy': policy });
  for (const [name, response, diskFails, expected] of [
    ['accepted', { success: true }, false, 'subida'],
    ['network failure', { success: false, error: 'network unavailable' }, false, 'en-el-equipo'],
    ['rejected', { success: false, error: 'contenido inapropiado' }, false, 'rechazada'],
    ['storage full', { success: false, error: 'network unavailable' }, true, 'no-guardada'],
  ]) {
    const r = await finish.terminarTrabajoIA({ subir: async () => response, guardarEnEquipo: async () => { if (diskFails) throw new Error('QuotaExceededError'); }, soltarOriginal: async () => {} });
    check('Destination: ' + name, r.destino === expected, r.destino);
  }

  // Hold only the session-status request, not IndexedDB or the AI provider.
  let release;
  const status = new Promise(r => { release = r; });
  let writes = 0;
  let jobs = [];
  const g = {
    useCallback: f => f, captureRawPhoto: () => 'data:image/jpeg;base64,AA==',
    updateEntertainmentSessionStatus: () => status,
    fiestaId: 'audit', accessToken: 'fake', session: { captureId: 'capture-a' },
    setRawCapturedImage: () => {}, setProcessingResult: () => {}, stopCamera: () => {},
    activeTab: 'ai_themes', selectedTheme: 'none', selectedCharacter: '', selectedAiTheme: 'theme',
    TOUCHPIX_THEMES: [{ id: 'theme', label: 'Theme' }], applyFilterToCanvas: () => {},
    consentAccepted: true, guestId: 'guest-a', guestAccessToken: 'fake-guest',
    guardarOriginalRetenida: async () => { writes++; return 'original-a'; },
    liberarEstacion: () => {}, setTrabajosIA: f => { jobs = f(jobs); },
    setUltimoAvisoIA: () => {}, crypto: { randomUUID: () => 'job-a' }, Date,
  };
  vm.runInNewContext(transpile('const ' + declaration('src/app/evento/touchpix/[fiestaId]/page.tsx', 'handleCapture') + '; globalThis.capture = handleCapture;'), g);
  const capture = g.capture();
  await Promise.resolve();
  check('Original saved while session request is pending', writes === 1, { writes, queuedJobs: jobs.length });
  release({ success: true, captureId: 'capture-a' });
  await capture;
  check('Original saved after session response', writes === 1 && jobs.length === 1, { writes, queuedJobs: jobs.length });

  // Advance the actual retention constant, while the browser/AI job remain alive.
  const match = read('src/app/evento/touchpix/[fiestaId]/page.tsx').match(/const RETENCION_DE_LA_ORIGINAL_MS = ([^;]+);/);
  const retention = vm.runInNewContext(match[1]);
  const started = Date.parse('2026-09-26T12:00:00Z');
  let now = started;
  class Clock extends Date { static now() { return now; } }
  const sent = [];
  let queue = [{ id: 'original-a', fiestaId: 'audit', moduleId: 'touchpix', fileBlob: new Blob(['original']), fileName: 'original.jpg', mimeType: 'image/jpeg', retenidaHasta: new Date(started + retention).toISOString(), metadata: { selectedTheme: 'Original' } }];
  const sync = load('src/lib/offline/offline-sync-manager.ts', {
    './offline-db': { getPendingOfflineMedia: async () => queue, removeOfflineMedia: async id => { queue = queue.filter(x => x.id !== id); }, updateOfflineMediaAttempt: async () => {} },
    '@/app/actions/fiesta/entretenimiento.actions': {},
    '@/app/actions/touchpix-ai': { uploadTouchpixPhoto: async form => { sent.push(form.get('file').name); return { success: true }; } },
    '@/app/actions/buzon': {}, '@/app/actions/fiesta/video-vida.actions': {},
    './offline-upload-policy': policy,
  }, { window: {}, navigator: { onLine: true }, Date: Clock });
  await sync.processOfflineMediaQueue({ fiestaId: 'audit' });
  check('Original retained before expiry', sent.length === 0, { sent: [...sent] });
  now += retention + 1;
  await sync.processOfflineMediaQueue({ fiestaId: 'audit' });
  await finish.terminarTrabajoIA({ subir: async () => { sent.push('ai-result.jpg'); return { success: true }; }, guardarEnEquipo: async () => {}, soltarOriginal: async () => { queue = []; } });
  check('Only final photo published while AI work remains active past retention', sent.length === 1 && sent[0] === 'ai-result.jpg', { retentionMs: retention, sent });
  const output = { sourceSha: cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), scope: 'Isolated source probes; mocked transport, clock and storage. Not browser, hardware, provider or deployment validation.', results };
  fs.writeFileSync(process.argv[3], JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
