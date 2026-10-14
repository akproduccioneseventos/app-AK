import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = path.join(root, 'docs/evidencias');
const provider = 'LOCAL_PROTOCOL_DOUBLE_NO_EXTERNAL_CALLS';

function argument(name) {
  const index = process.argv.indexOf(name);
  assert(index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--'), 'Required argument: ' + name);
  return process.argv[index + 1];
}

function readJson(name) {
  const file = path.join(evidence, name);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (fs.existsSync(file + '.gz')) return JSON.parse(zlib.gunzipSync(fs.readFileSync(file + '.gz')).toString('utf8'));
  throw new Error('Missing final evidence: docs/evidencias/' + name);
}

function sameSource(record, sourceSha, file) {
  assert.equal(record.applicationSourceSha, sourceSha, file + ': applicationSourceSha mismatch');
  if (record.sourceSha !== undefined) assert.equal(record.sourceSha, sourceSha, file + ': sourceSha mismatch');
}

function nativeReceipt(name, expectedCases, sourceSha, requiresProvider) {
  const record = readJson(name);
  sameSource(record, sourceSha, name);
  assert(Array.isArray(record.results), name + ': missing results');
  assert.equal(record.results.length, expectedCases, name + ': wrong case count');
  assert(record.results.every(row => row.status === 'PASS'), name + ': not all cases PASS');
  for (const viewport of ['desktop', 'mobile']) {
    assert.equal(record.results.filter(row => row.viewport === viewport).length, expectedCases / 2, name + ': incomplete viewport');
  }
  if (requiresProvider) assert.equal(record.provider, provider, name + ': real provider not certified by local-double evidence');
  if (record.cleanup) assert.equal(record.cleanup.bytesRestored, true, name + ': cleanup not accepted');
  return {file: 'docs/evidencias/' + name, record};
}

function historyIndex() {
  const result = [];
  const walk = (folder, relative = '') => {
    for (const entry of fs.readdirSync(folder, {withFileTypes: true})) {
      const rel = relative ? relative + '/' + entry.name : entry.name;
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full, rel);
      else {
        const prefix = rel.match(/(?:^|\/)(\d+)[-_]/)?.[1];
        if (prefix && !/^123-cobertura-recuento\.(?:json(?:\.gz)?|md)$/.test(rel)) {
          result.push({auditPrefix: Number(prefix), file: 'docs/evidencias/' + rel, bytes: fs.statSync(full).size, type: path.extname(entry.name)});
        }
      }
    }
  };
  walk(evidence);
  return result.sort((a, b) => a.file.localeCompare(b.file));
}

function main() {
  const sourceSha = argument('--source-sha');
  const mainSha = argument('--main-sha');
  for (const [name, sha] of [['source', sourceSha], ['main', mainSha]]) {
    assert.match(sha, /^[0-9a-f]{40}$/i, name + ': require a full exact SHA');
  }

  // Final receipts gate every current-runtime claim. Historical page hashes cannot replace this gate.
  const acceptance = readJson('123-aceptacion.json');
  sameSource(acceptance, sourceSha, '123-aceptacion.json');
  assert(/^PASS(?:_|$)/.test(acceptance.status), '123 acceptance is not PASS');
  assert.equal(acceptance.jestEvidence?.originalAssertionsPreserved,true,'Wide run with focused tooling repair must remain explicit');
  assert.equal(acceptance.nativeCases, 52, '123 acceptance must contain 52 native cases');
  if (acceptance.provider !== undefined) assert.equal(acceptance.provider, provider);
  const chat = nativeReceipt('123-chat-aceptacion-resultados.json', 16, sourceSha, true);
  const ia = nativeReceipt('123-ia-final-resultados.json', 34, sourceSha, true);
  const position = nativeReceipt('123-posicion-resultados.json', 2, sourceSha, false);
  assert.equal(chat.record.results.length + ia.record.results.length + position.record.results.length, 52);
  assert(position.record.results.every(row => row.route === '/empresa/configurador-reunion'));
  const visibleDocuments = chat.record.results.filter(row => row.name === 'saved-budget-document-visible-and-persistent-after-reload');
  assert.equal(visibleDocuments.length, 2);
  assert(visibleDocuments.every(row => row.details?.documentVisible === true && row.details?.persistentAfterReload === true));

  const jestExecution = readJson('123-unit-execution.json');
  sameSource(jestExecution, sourceSha, '123-unit-execution.json');
  assert.equal(jestExecution.status, 'finished', 'Final Jest is still running or interrupted');
  assert.equal(jestExecution.exitCode, 0, 'Final Jest failed');
  const jest = readJson('123-jest-consolidado.json');
  sameSource(jest,sourceSha,'123-jest-consolidado.json');
  assert.equal(jest.status,'PASS_COMPOSITE_SAME_APP_SHA');
  assert.equal(jest.success, true, 'Final Jest did not succeed');
  assert(jest.numTotalTestSuites > 0 && jest.numTotalTests > 0, 'Empty Jest execution');
  assert.equal(jest.numPassedTestSuites, jest.numTotalTestSuites);
  assert.equal(jest.numPassedTests, jest.numTotalTests);
  for (const key of ['numFailedTestSuites', 'numPendingTestSuites', 'numFailedTests', 'numPendingTests', 'numTodoTests']) {
    assert.equal(jest[key], 0, 'Jest: ' + key);
  }
  assert.equal(jest.testResults.length, jest.numTotalTestSuites);
  assert(jest.testResults.every(suite => suite.status === 'passed' && suite.assertionResults.every(test => test.status === 'passed')));
  const executedSuites = new Set(jest.testResults.map(suite => path.relative(root, suite.name).replaceAll('\\', '/')));

  const inventory = readJson('109-inventario-cobertura.json');
  const prior = readJson('109-matriz-conciliada.json');
  assert.equal(inventory.inventory.length, 421, 'Unexpected inventory109 size');
  const currentPaths = execFileSync('git', ['ls-tree', '-r', '--name-only', sourceSha, '--', 'src/app'], {cwd: root, encoding: 'utf8'})
    .trim().split(/\r?\n/).filter(file => /(^|\/)(page|route)\.tsx?$/.test(file));
  const inventoryPaths = new Set(inventory.inventory.map(row => row.file));
  assert.equal(currentPaths.length, 421, 'Source route count differs from inventory109');
  assert.deepEqual(currentPaths.filter(file => !inventoryPaths.has(file)), [], 'Source has unindexed routes');
  assert.deepEqual([...inventoryPaths].filter(file => !currentPaths.includes(file)), [], 'Inventory has stale routes');

  const probeFiles = {
    chat: 'docs/evidencias/123-chat-regresiones-probe.mjs',
    ia: 'docs/evidencias/123-ia-final-probe.mjs',
    position: 'docs/evidencias/123-posicion-probe.mjs',
  };
  const probeText = Object.fromEntries(Object.entries(probeFiles).map(([key, file]) => [key, fs.readFileSync(path.join(root, file), 'utf8')]));
  assert(probeText.chat.includes("root+'/empresa/dashboard'"));
  assert(probeText.chat.includes("root+'/api/multiagent/message'"));
  assert(probeText.chat.includes("root+'/presupuestos/'+doc.id+'/ver'"));
  assert(probeText.ia.includes("root+'/empresa/dashboard'") && probeText.ia.includes('/api/multiagent/message'));
  assert(probeText.position.includes("root+'/empresa/configurador-reunion'"));

  const documentCase = 'saved-budget-document-visible-and-persistent-after-reload';
  const mappedCases = (receipt, predicate) => receipt.record.results.filter(predicate).map(row => ({
    resultFile: receipt.file, viewport: row.viewport, name: row.name ?? 'configurator-position-canvas-camera',
    status: row.status, details: row.details ?? row,
  }));
  const budgetCases = mappedCases(chat, row => row.name !== documentCase);
  const runtimeMap = {
    '/empresa/dashboard': {
      probes: [probeFiles.chat, probeFiles.ia],
      cases: [...budgetCases, ...mappedCases(ia, row => !row.name.startsWith('role-') && !row.name.startsWith('voice-'))],
    },
    '/api/multiagent/message': {
      probes: [probeFiles.chat, probeFiles.ia],
      cases: [...budgetCases, ...mappedCases(ia, row => !row.name.startsWith('voice-'))],
    },
    '/presupuestos/:id/ver': {probes: [probeFiles.chat], cases: mappedCases(chat, row => row.name === documentCase)},
    '/empresa/configurador-reunion': {probes: [probeFiles.position], cases: mappedCases(position, () => true)},
    '/presupuestos': {probes: [probeFiles.ia], cases: mappedCases(ia, row => row.name.startsWith('role-') && row.details?.route === '/presupuestos')},
    '/api/asistente/voz-en-vivo': {probes: [probeFiles.ia], cases: mappedCases(ia, row => row.name.startsWith('voice-'))},
  };
  assert(Object.keys(runtimeMap).every(route => inventory.inventory.some(row => row.route === route)));
  const priorByFile = new Map(prior.matrix.map(row => [row.file, row]));
  const rows = inventory.inventory.map(item => {
    const old = priorByFile.get(item.file) ?? {};
    const unitReferences = [...(old.directUnitEvidence ?? []), ...(old.dependencyUnitReferences ?? [])];
    const e2eReferences = old.e2eReferences ?? [];
    const runtime = runtimeMap[item.route];
    const recordedExecution = old.executed109 ?? [];
    const classification = runtime ? 'runtime_proved_current_same_sha_receipts'
      : recordedExecution.length ? 'historic_execution_known_sha'
      : unitReferences.some(ref => executedSuites.has(ref.suite)) ? 'reference_in_executed_unit_suite'
      : unitReferences.length || e2eReferences.length || old.documentReferences?.length ? 'reference_only' : 'not_proved';
    return {
      file: item.file, route: item.route, kind: item.kind, area: item.area, sourceSha, classification,
      directRuntimeProof: runtime ? {sourceSha, acceptanceFile: 'docs/evidencias/123-aceptacion.json',
        provider, probes: runtime.probes, mappedCases: runtime.cases, scope: 'Named observed scenarios only; not full route or area acceptance.'} : null,
      unitReferences: unitReferences.map(ref => ({suite: ref.suite, module: ref.module,
        executedSourceSha: executedSuites.has(ref.suite) ? sourceSha : null, functionalRouteAcceptance: false})),
      historicE2eReferences: e2eReferences,
      documentReferences: old.documentReferences ?? [],
      historicalExecutionEvidence: recordedExecution.length ? {sourceSha: prior.sourceApp, rows: recordedExecution} : null,
      interpretation: 'Missing evidence does not imply a defect or no earlier audit. A suite reference is not functional route acceptance.',
    };
  });
  const areaDefs = JSON.parse(fs.readFileSync(path.join(root, 'docs/codex/areas.json'), 'utf8')).areas;
  assert.equal(areaDefs.length, 14);
  const classes = ['runtime_proved_current_same_sha_receipts', 'reference_in_executed_unit_suite', 'historic_execution_known_sha', 'reference_only', 'not_proved'];
  const counts = Object.fromEntries(classes.map(name => [name, rows.filter(row => row.classification === name).length]));
  assert.equal(counts.runtime_proved_current_same_sha_receipts, Object.keys(runtimeMap).length);
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 421);
  const areas = areaDefs.map(area => ({
    id: area.id, name: area.nombre, routes: rows.filter(row => row.area === area.id).length,
    classifications: Object.fromEntries(classes.map(name => [name, rows.filter(row => row.area === area.id && row.classification === name).length])),
    historicRecordedState: area.estado ?? null, historicReview: area.ultimaRevision ?? null, globallyAccepted: false,
  }));
  assert.equal(areas.reduce((sum, area) => sum + area.routes, 0), 421);
  const sourceDocuments = ['docs/YA-RESUELTO.md', 'ESTADO-AUDITORIA.md', 'docs/COBERTURA-AUDITORIA.md', 'docs/PRUEBAS-Y-AUDITORIA.md'];
  const sharedHeadings = sourceDocuments.filter(file => fs.existsSync(path.join(root, file))).flatMap(file =>
    fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/).flatMap((text, index) =>
      /^#{1,4}\s/.test(text) ? [{file, line: index + 1, title: text.replace(/^#+\s*/, '')}] : []));
  const followups = rows.filter(row => ['reference_only', 'not_proved'].includes(row.classification)).map(row => ({
    file: row.file, route: row.route, area: row.area, classification: row.classification,
    unitReferences: row.unitReferences.map(ref => ref.suite), e2eReferences: row.historicE2eReferences,
    action: 'Reconcile exact consumer with indexed shared history; record a specific execution or observed risk before proposing programming.',
    confirmedDefect: false, neverAuditedClaim: false,
  }));
  const externalAndHardware = [
    {id: 'hosting', status: 'not-certified', scope: 'Deployment on real Hosting'},
    {id: 'oauth', status: 'not-certified', scope: 'External OAuth integrations'},
    {id: 'originals-19', status: 'not-certified', scope: '19 original assets'},
    {id: 'hardware', status: 'not-certified', scope: 'Physical equipment'},
    {id: 'external-model-voice', status: 'not-certified', scope: 'Real external model and voice provider; current native provider is local double'},
  ];
  const ownerPolicies = [
    {id: 'Caja-saldos-semantics', status: 'preserve-owner-policy', scope: 'Preserve owner semantics for Caja, balances, bases, edits and permissions; no monetary policy changes from this ledger.'},
    {id: 'indicator-control', status: 'preserve-owner-policy', scope: 'Movable/minimizable control; configurator evidence covers only the two observed viewport scenarios.'},
    {id: 'single-server-create-from-budget', status: 'previously-accepted-limit', scope: 'Single-server creation lock'},
    {id: 'simultaneous-gifts', status: 'previously-accepted-limit', scope: 'Gift concurrency from another screen; do not reissue as a new defect'},
  ];
  const historicalFiles = historyIndex();
  const result = {
    ledger: 123, status: 'PASS_FINITE_COVERAGE_RECONCILIATION_ONLY', applicationSourceSha: sourceSha,
    documentaryHead: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
    latestMain: {sha: mainSha, status: 'INTEGRATED_BY_PRINCIPAL_REPORT', gamesMissionsVotes: 'CORRECTED_BY_CLAUDE',
      prPreparationOwner: 'director', mergeOwner: 'Claude'},
    acceptance: {file: 'docs/evidencias/123-aceptacion.json', sourceSha, status: acceptance.status, nativeCases: 52, provider},
    jestExecution: {file: 'docs/evidencias/123-jest-consolidado.json.gz', sourceSha, executionHead: jestExecution.sha ?? null, status: jest.status, evidence: jest.evidence,
      suites: jest.numTotalTestSuites, tests: jest.numTotalTests, passedSuites: jest.numPassedTestSuites, passedTests: jest.numPassedTests},
    inventoryCounts: {routes: 421, pages: rows.filter(row => row.kind === 'page').length, routeHandlers: rows.filter(row => row.kind === 'route-handler').length,
      areas: 14, areasWithRoutes: areas.filter(area => area.routes > 0).length,
      priorNoE2eReferenceRoutes: inventory.counts.noE2eEvidence, priorNoAutomaticReferenceRoutes: prior.counts.noAutomaticTestReference},
    classificationCounts: counts, areas, routes: rows, routeCoverageFollowups: followups,
    sharedHistoryIndex: {auditPrefixes: [...new Set(historicalFiles.map(file => file.auditPrefix))].sort((a, b) => a - b),
      files: historicalFiles, sharedHeadings, note: 'Index includes all numbered audit prefixes and archived interrupted prototypes; indexing is not execution acceptance.'},
    historicalEvidence: [
      {id: '122', sourceSha: '5dc197e5c831d8dbd75dec268efa5806eca957d8', status: 'HISTORICAL_ONLY',
        records: ['122-aceptacion.json', '122-jest-execution.json', '122-chat-aceptacion-resultados.json', '122-indicador-resultados.json'],
        rule: 'Never promote 122 to current runtime from unchanged route/page hash; dependencies and consumers changed.'},
      {id: '109', sourceSha: prior.sourceApp, status: 'HISTORICAL_ONLY', record: '109-matriz-conciliada.json'},
      {id: '123-interrupted-prototypes', status: 'HISTORICAL_NOT_ACCEPTED', archivePattern: '123-prototipo-*.gz'},
    ],
    externalAndHardware, ownerPolicies, allRoutesAccepted: false, allAreasAccepted: false,
    scope: {runtimeRoutes: Object.keys(runtimeMap), nativeCaseCount: 52, routeMappingsOverlap: true,
      giftsPostEventCheckin: 'Keep historical tests and proof; no new defects inferred.',
      missingEvidenceMeaning: 'Neither a bug nor a claim that the route was never audited.'},
  };
  const lines = [
    '# Recuento finito de cobertura 123', '',
    '- Fuente app: `' + sourceSha + '`. HEAD documental: `' + result.documentaryHead + '`.',
    '- Main `' + mainSha + '` integrado; juegos, votos y misiones corregidos por Claude. Director prepara PR; Claude fusiona.',
    '- Aceptacion123 y los 52 resultados nativos PASS comparten el SHA de fuente. Proveedor: doble local; proveedor externo sin certificado.',
    '- Jest comprobado COMPUESTO: ' + jest.numPassedTestSuites + '/' + jest.numTotalTestSuites + ' suites y ' + jest.numPassedTests + '/' + jest.numTotalTests + ' tests. 739 suites de la amplia y una focal tras completar ResizeObserver de jsdom; no una sola corrida verde. El fallo original queda archivado.',
    '- 421 rutas reconciliadas; 14 areas, ' + result.inventoryCounts.areasWithRoutes + ' con rutas. Cuatro rutas con escenarios runtime actuales; ninguna area tiene aceptacion global.',
    '- Las referencias a suites ejecutadas no certifican funcionalmente la ruta. Evidencia122 permanece historica, aunque coincida un page.tsx.',
    '', '| Clasificacion | Rutas |', '|---|---:|',
    ...Object.entries(counts).map(([name, count]) => '| `' + name + '` | ' + count + ' |'),
    '', '## Escenarios actuales', '',
    ...Object.entries(runtimeMap).map(([route, mapped]) => '- `' + route + '`: ' + mapped.cases.length + ' resultados mapeados; consultar detalles y scripts en JSON. Los conjuntos pueden solaparse.'),
    '', '## Areas', '', '| Area | Rutas | Aceptacion global |', '|---|---:|---|',
    ...areas.map(area => '| ' + area.id + ' | ' + area.routes + ' | No |'),
    '', '## Seguimiento de evidencia', '',
    '- ' + followups.length + ' rutas en seguimiento, enumeradas por archivo/ruta en JSON. No son un recuento de defectos ni de rutas nunca auditadas.',
    '- Historico: ' + historicalFiles.length + ' archivos de todos los prefijos de auditoria, incluidas corridas prototipo archivadas. El indice no declara ejecucion.',
    '- Externos/hardware y politicas del dueno (incluida semantica Caja/saldos) tienen entradas separadas.',
    '', '```comprobar',
    'archivo: docs/evidencias/123-aceptacion.json; 123-jest-execution.json; 123-jest.json; los tres resultados nativos123',
    'usa: recibos con applicationSourceSha exacto y resultados PASS; seis rutas con escenarios concretos, no rutas completas',
    'prueba: node docs/evidencias/123-cobertura-recuento.mjs --source-sha <SHA-exacto> --main-sha <SHA-exacto>',
    '```', '',
  ];
  if (!process.argv.includes('--dry-run')) {
    fs.writeFileSync(path.join(evidence, '123-cobertura-recuento.json.gz'), zlib.gzipSync(Buffer.from(JSON.stringify(result, null, 2) + '\n')));
    fs.writeFileSync(path.join(evidence, '123-cobertura-recuento.md'), lines.join('\n'));
  }
  console.log(JSON.stringify({status: result.status, sourceSha, routes: 421, classificationCounts: counts,
    nativeCases: 52, suites: jest.numTotalTestSuites, tests: jest.numTotalTests, followups: followups.length,
    generated: !process.argv.includes('--dry-run')}, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({status: 'NOT_ACCEPTED', generated: false, reason: error.message}));
  process.exitCode = 1;
}
