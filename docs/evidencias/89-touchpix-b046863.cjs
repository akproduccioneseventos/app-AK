// Audit probe: runs real extracted callbacks with mocked I/O, not React/E2E/hardware.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const root = path.resolve(process.argv[2] || '.');
const results = [];
function extract(file, names) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const parts = [];
  function visit(n) {
    if (ts.isVariableDeclaration(n) && names.includes(n.name.getText(source))) parts.push('const ' + n.getText(source) + ';');
    if (ts.isFunctionDeclaration(n) && names.includes(n.name?.text)) parts.push(n.getText(source).replace(/^export\s+/, ''));
    ts.forEachChild(n, visit);
  }
  visit(source);
  if (parts.length !== names.length) throw Error('Missing or ambiguous symbol: ' + names);
  return parts.join('\n');
}
function evaluate(code, scope, expression) {
  return vm.runInNewContext(ts.transpileModule(code + '\n' + expression, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText, scope);
}
const file = 'src/app/evento/touchpix/[fiestaId]/page.tsx';
const code = extract(file, ['handleCapture', 'procesarTrabajoIA']);
const policy = evaluate(extract('src/lib/offline/offline-upload-policy.ts', [
  'DUPLICATE_UPLOAD_ERROR', 'PERMANENT_UPLOAD_ERROR', 'classifyOfflineUploadError'
]), {}, 'classifyOfflineUploadError');
function setup({ uploadError = '', quotaError = false } = {}) {
  const state = { jobs: [], saves: [], uploads: [], themes: [], completion: null, consent: true, resets: 0 };
  let id = 0;
  const scope = {
    useCallback: fn => fn, crypto: { randomUUID: () => 'capture-' + (++id) },
    FormData, Date, Set, Promise,
    activeTab: 'ai_themes', selectedTheme: 'original', selectedCharacter: 'hero', selectedAiTheme: 'caricatura',
    fiestaId: 'fixture', accessToken: 'fixture-access', guestId: 'fixture-guest', guestAccessToken: 'fixture-guest-token',
    photoSessionId: 'session-shared', consentAccepted: true,
    TOUCHPIX_THEMES: [{ id: 'caricatura', label: 'Caricatura', cssFilter: 'none' }],
    FACE_SWAP_CHARACTERS: [{ id: 'hero', label: 'Hero', filter: 'none' }],
    captureRawPhoto: () => 'data:image/jpeg;base64,b3JpZ2luYWw=', stopCamera() {},
    setRawCapturedImage() {}, setProcessingResult() {}, setCapturedImage() {}, setUltimoAvisoIA() {},
    setTrabajosIA: update => { state.jobs = update(state.jobs); },
    setAvisoFinalizado: value => { state.completion = value; },
    setConsentAccepted: value => { state.consent = value; },
    setPhotoSessionId: () => { state.resets++; },
    applyFilterToCanvas: (image, _filter, done) => done(image),
    dataUrlToFile: async (_url, name) => new File(['fixture-media'], name, { type: 'image/jpeg' }),
    applyFaceSwap: async () => ({ success: true, faceSwapApplied: true, imageBase64: 'ZmFrZQ==' }),
    applyTouchpixTheme: async form => {
      state.themes.push(form.get('photoSessionId'));
      return { success: true, themeApplied: true, imageBase64: 'ZmFrZQ==' };
    },
    uploadTouchpixPhoto: async form => {
      state.uploads.push(form.get('file').name);
      return uploadError ? { success: false, error: uploadError } : { success: true, post: { imageUrl: '/fixture.jpg' } };
    },
    saveOfflineMedia: async entry => { if (quotaError) throw Error('QuotaExceededError'); state.saves.push(entry); },
    classifyOfflineUploadError: policy,
    updateEntertainmentSessionStatus: async () => {},
    subidosRef: { current: new Set() }, procesandoRef: { current: new Set() },
  };
  return { state, callbacks: evaluate(code, scope, '({handleCapture, procesarTrabajoIA})') };
}
(async () => {
  for (const scenario of [
    { name: 'upload-success' },
    { name: 'upload-offline-queued', uploadError: 'Failed to fetch' },
    { name: 'upload-rejected-permanent', uploadError: 'Contenido bloqueado' },
    { name: 'upload-offline-and-storage-full', uploadError: 'Failed to fetch', quotaError: true },
  ]) {
    const { state, callbacks } = setup(scenario);
    await callbacks.handleCapture();
    const localOriginalBeforeAI = state.saves.length;
    await callbacks.procesarTrabajoIA(state.jobs[0]);
    const completed = state.jobs[0].estado === 'completado' && !!state.completion;
    results.push({ case: scenario.name, expected: scenario.uploadError ? 'not-announced-in-gallery' : 'completed',
      observed: { estado: state.jobs[0].estado, announcement: state.completion, queued: state.saves.length,
        originalSavedBeforeAI: localOriginalBeforeAI },
      passed: scenario.uploadError ? !completed : completed });
  }
  const { state, callbacks } = setup();
  for (let i = 0; i < 4; i++) await callbacks.handleCapture();
  results.push({ case: 'original-durable-before-provider', originals: state.saves.length,
    jobs: state.jobs.length, passed: state.saves.length === 4 });
  for (const job of [...state.jobs]) await callbacks.procesarTrabajoIA(job);
  results.push({ case: 'distinct-capture-identity-for-provider-limit', submittedSessionIds: state.themes,
    captures: state.jobs.map(x => x.id), passed: new Set(state.themes).size === 4 });
  const testSource = fs.readFileSync(path.join(root, 'tests/e2e/89-ia-no-frena-la-fila.spec.ts'), 'utf8');
  const report = { sourceSHA: cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    scope: 'Real AST callbacks; provider, upload, local storage, React setters and canvas mocked. No E2E, compile, hardware or deployment claim.',
    results, testObservation: { uploadAssertionAllowsDuplicates: testSource.includes('expect(llamadasUpload).toBeGreaterThanOrEqual(1)') } };
  const output = JSON.stringify(report, null, 2) + '\n';
  if (process.argv[3]) fs.writeFileSync(process.argv[3], output);
  process.stdout.write(output);
})().catch(error => { console.error(error); process.exitCode = 1; });
