// Read-only audit. Real functions, simulated database/provider/browser boundaries.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const cp = require('node:child_process');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const root = path.resolve(process.argv[2] || '.');
const results = [];
function source(file) { return ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true); }
function extract(file, names) {
  const s = source(file), parts = [];
  function visit(n) {
    if (ts.isVariableDeclaration(n) && names.includes(n.name.getText(s))) parts.push('const ' + n.getText(s) + ';');
    if (ts.isFunctionDeclaration(n) && names.includes(n.name?.text)) parts.push(n.getText(s).replace(/^export\s+/, ''));
    ts.forEachChild(n, visit);
  }
  visit(s);
  if (parts.length !== names.length) throw Error('Ambiguous or missing: ' + names);
  return parts.join('\n');
}
function run(code, scope, expression) {
  return vm.runInNewContext(ts.transpileModule(code + '\n' + expression, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, scope);
}
const page = 'src/app/evento/touchpix/[fiestaId]/page.tsx';
function operatorDisabled(status) {
  const s = source(page), expressions = [];
  function visit(n) {
    if (ts.isJsxAttribute(n) && n.name.getText(s) === 'disabled' && n.initializer && ts.isJsxExpression(n.initializer)) {
      const expression = n.initializer.expression?.getText(s) || '';
      if (expression.includes('session?.status') && expression.includes("'idle', 'done'")) expressions.push(expression);
    }
    ts.forEachChild(n, visit);
  }
  visit(s);
  if (expressions.length !== 1) throw Error('Cannot identify operator start control');
  return run('', { session: { status } }, expressions[0]);
}
(async () => {
  let stored = { fiestaId: 'fixture', moduleId: 'espejoMagicoIA', captureId: 'A', status: 'recording', version: 1,
    expiresAt: new Date(Date.now() + 600000).toISOString() };
  const ref = { set: async value => { stored = structuredClone(value); } };
  const db = { collection: () => ({ doc: () => ref }), runTransaction: async fn => fn({
    get: async () => ({ exists: true, data: () => structuredClone(stored) }),
    set: (_ref, value, options) => { stored = options?.merge ? { ...stored, ...structuredClone(value) } : structuredClone(value); }
  }) };
  const sessionFile = 'src/app/actions/fiesta/sesion-entretenimiento.ts';
  const server = run(extract(sessionFile, ['SESIONES_COLLECTION', 'SESSION_MAX_AGE_MS', 'VALID_STATUS_TRANSITIONS',
    'MENSAJE_DE_FALLA', 'boundedText', 'boundedNumber', 'sinClavesVacias', 'sanitizeSessionSettings',
    'sanitizeSessionUpdate', 'startEntertainmentSession', 'resetEntertainmentSession', 'updateEntertainmentSessionStatus']), {
    Date, console, crypto: { randomUUID: () => 'B' }, getDb: async () => db,
    isEntertainmentModuleId: () => true, hasEntertainmentControlAccess: async () => true,
    hasEntertainmentGuestAccess: async () => true, isStationEnabled: async () => true,
  }, '({startEntertainmentSession,resetEntertainmentSession,updateEntertainmentSessionStatus})');

  let resolveProvider, startedProvider;
  const started = new Promise(resolve => { startedProvider = resolve; });
  const provider = new Promise(resolve => { resolveProvider = resolve; });
  const statusUpdates = [], sentConsents = [];
  const scope = {
    useCallback: fn => fn, FormData, Set, Promise, Date,
    fiestaId: 'fixture', accessToken: 'fixture-access', guestId: 'guest-A', guestAccessToken: 'fixture-guest-A',
    consentAccepted: true, photoSessionId: 'photo-A',
    TOUCHPIX_THEMES: [{ id: 'caricatura', cssFilter: 'none' }],
    applyFilterToCanvas: (image, _filter, done) => done(image),
    dataUrlToFile: async (_url, name) => new File(['fixture'], name, { type: 'image/jpeg' }),
    applyFaceSwap: async form => { sentConsents.push(form.get('consentAccepted')); startedProvider(); return provider; },
    applyTouchpixTheme: async form => { sentConsents.push(form.get('consentAccepted')); return { success: false }; },
    uploadTouchpixPhoto: async () => ({ success: true, post: { imageUrl: '/media-A.jpg' } }),
    updateEntertainmentSessionStatus: (...args) => {
      const p = server.updateEntertainmentSessionStatus(...args); statusUpdates.push(p); return p;
    },
    saveOfflineMedia: async () => {}, classifyOfflineUploadError: () => 'retryable',
    subidosRef: { current: new Set() }, procesandoRef: { current: new Set() },
    setTrabajosIA() {}, setAvisoFinalizado() {},
  };
  const processA = run(extract(page, ['procesarTrabajoIA']), scope, 'procesarTrabajoIA');
  const taskA = processA({ id: 'A', tipo: 'faceswap', rawImage: 'fixture', characterId: 'hero' });
  await started;
  results.push({ case: 'operator-start-while-A-processes', status: stored.status,
    disabled: operatorDisabled(stored.status), passed: !operatorDisabled(stored.status) });
  // Operator presses Restart then Start for B, the same actions exposed in the UI.
  await server.resetEntertainmentSession('fixture', 'espejoMagicoIA', 'fixture-access');
  await server.startEntertainmentSession('fixture', 'espejoMagicoIA', {}, 'fixture-access');
  await server.updateEntertainmentSessionStatus('fixture', 'espejoMagicoIA', 'recording', {}, 'fixture-access');
  const before = structuredClone(stored);
  resolveProvider({ success: true, faceSwapApplied: true, imageBase64: 'ZmFrZQ==' });
  await taskA;
  await Promise.all(statusUpdates);
  results.push({ case: 'late-A-completion-does-not-overwrite-B', before: { captureId: before.captureId, status: before.status },
    after: { captureId: stored.captureId, status: stored.status, mediaUrl: stored.mediaUrl },
    passed: stored.status === before.status && stored.mediaUrl !== '/media-A.jpg' });

  // Job captured earlier carries no consent snapshot; a later render cleared current consent.
  const laterScope = { ...scope, consentAccepted: false, subidosRef: { current: new Set() },
    updateEntertainmentSessionStatus: async () => {}, applyTouchpixTheme: async form => {
      sentConsents.push(form.get('consentAccepted')); return { success: false };
    } };
  const pendingEarlierJob = { id: 'C', tipo: 'ai_themes', rawImage: 'fixture', themeId: 'caricatura' };
  const processAfterReset = run(extract(page, ['procesarTrabajoIA']), laterScope, 'procesarTrabajoIA');
  await processAfterReset(pendingEarlierJob);
  results.push({ case: 'queued-consented-job-context-after-reset', expectedConsentSnapshot: 'true',
    submittedConsent: sentConsents.at(-1), passed: sentConsents.at(-1) === 'true',
    limit: 'Callback evaluated with later-render context; not a React browser navigation reproduction.' });

  const fixtures = [{ id: 'zero', stockDisponible: 0 }, { id: 'yes', stockDisponible: 2 },
    { id: 'negative', stockDisponible: -1 }, { id: 'unknown' }];
  const mini = run(extract('src/app/invitacion/[fiestaId]/invitado/[guestId]/MiniQuiosco.tsx',
    ['rawDrinks', 'drinks', 'availableDrinks']), { dashboard: { drinks: fixtures } }, '({drinks,availableDrinks})');
  results.push({ case: 'bar-mini-excludes-exhausted-from-suggestions',
    available: mini.availableDrinks.map(x => x.id), order: mini.drinks.map(x => x.id),
    passed: mini.availableDrinks.map(x => x.id).join() === 'yes,unknown' && mini.drinks.slice(-2).map(x => x.id).join() === 'zero,negative' });
  const bar = run(extract('src/app/evento/barra/[fiestaId]/page.tsx', ['rawDrinks', 'drinks', 'visibleDrinks']),
    { dashboard: { drinks: fixtures }, activeCategory: 'fixture-tag', getDrinkTags: () => ['fixture-tag'] }, 'visibleDrinks');
  results.push({ case: 'bar-category-preserves-exhausted-last', order: bar.map(x => x.id),
    passed: bar.slice(-2).map(x => x.id).join() === 'zero,negative' });
  const out = JSON.stringify({ sourceAppSHA: cp.execFileSync('git', ['rev-parse', 'origin/main'], { cwd: root, encoding: 'utf8' }).trim(),
    scope: 'Real AST callbacks and session transaction function; I/O and authorization mocked. No E2E, Firestore, compile, production or hardware verification.', results }, null, 2) + '\n';
  if (process.argv[3]) fs.writeFileSync(process.argv[3], out);
  process.stdout.write(out);
})().catch(error => { console.error(error); process.exitCode = 1; });
