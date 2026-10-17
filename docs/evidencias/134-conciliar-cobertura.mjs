import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const option = (name) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
const sourceSha = option('--source') || '7230f9d02b32805952a185f704a0208bd5d643e6';
const documentarySha = option('--documents') || '7230f9d02b32805952a185f704a0208bd5d643e6';
const ts = createRequire(path.join(path.resolve(option('--tools-root') || root), 'package.json'))('typescript');
const out = 'docs/evidencias/';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const git = (args, extra = {}) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...extra });
const load = (file) => {
  const p = path.join(root, file);
  const data = fs.existsSync(p) ? fs.readFileSync(p) : zlib.gunzipSync(fs.readFileSync(`${p}.gz`));
  const obj = JSON.parse(data);
  return obj.format === 'gzip-compressed-json' ? JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, obj.compressedFile)))) : obj;
};
const write = (file, value) => fs.writeFileSync(path.join(root, out, file), `${JSON.stringify(value, null, 2)}\n`);
const zip = (file, value) => {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  fs.writeFileSync(path.join(root, out, file), zlib.gzipSync(bytes, { level: 9 }));
  return { file: `${out}${file}`, jsonSha256: hash(bytes), bytes: bytes.length };
};

// Preserve original receipts and available exact test sources before interpreting their scope.
const capture = option('--capture-native');
if (capture) {
  const evidenceRoot = path.join(path.resolve(capture), out);
  const runs = [];
  for (const name of fs.readdirSync(evidenceRoot).filter((n) => /^133-.*-execution\.json$/.test(n)).sort()) {
    const executionBytes = fs.readFileSync(path.join(evidenceRoot, name));
    const execution = JSON.parse(executionBytes);
    const resultsName = name.replace('-execution.json', '-results.json');
    if (!fs.existsSync(path.join(evidenceRoot, resultsName))) continue;
    const resultBytes = fs.readFileSync(path.join(evidenceRoot, resultsName));
    const sources = (execution.testResult?.testSources || []).map((record) => {
      const file = path.join(path.resolve(capture), record.file);
      const bytes = fs.existsSync(file) ? fs.readFileSync(file) : null;
      const matches = Boolean(bytes && hash(bytes) === record.sha256);
      return { ...record, availableSourceMatches: matches, content: matches ? bytes.toString('utf8') : null };
    });
    runs.push({ id: name.replace('-execution.json', ''), executionFile: `${out}${name}`,
      resultsFile: `${out}${resultsName}`, executionSha256: hash(executionBytes), resultsSha256: hash(resultBytes),
      execution, results: JSON.parse(resultBytes), sources });
  }
  zip('134-recibos-nativos.json.gz', { capturedFrom: path.resolve(capture), runs });
}

const treeCache = new Map();
function tree(sha) {
  if (!treeCache.has(sha)) {
    const entries = git(['ls-tree', '-r', '-z', sha]).split('\0').filter(Boolean).map((entry) => {
      const match = entry.match(/^\d+ \S+ ([a-f0-9]+)\t([\s\S]+)$/);
      assert(match, `Invalid git tree entry: ${entry}`);
      return [match[2], match[1]];
    });
    treeCache.set(sha, new Map(entries));
  }
  return treeCache.get(sha);
}
const target = tree(sourceSha);
const paths = [...target.keys()];
const codeFiles = paths.filter((file) => /^src\//.test(file) && /\.[cm]?[jt]sx?$/.test(file) && !/(?:__tests__|\.(?:spec|test)\.)/.test(file));
const batch = git(['cat-file', '--batch'], { encoding: null, input: `${codeFiles.map((file) => `${sourceSha}:${file}`).join('\n')}\n` });
const code = new Map();
let offset = 0;
for (const file of codeFiles) {
  const end = batch.indexOf(10, offset);
  const header = batch.subarray(offset, end).toString('utf8');
  const size = Number(header.split(' ').at(-1));
  assert(Number.isSafeInteger(size), `Invalid blob: ${file}`);
  code.set(file, batch.subarray(end + 1, end + 1 + size).toString('utf8'));
  offset = end + 1 + size + 1;
}
assert.equal(offset, batch.length);

const definitions = load('docs/codex/areas.json').areas;
const baseline = load('docs/evidencias/128-matriz-areas.json');
const history = load('docs/evidencias/124-cobertura-recuento.json');
const oldInventory = load('docs/evidencias/131-inventario-cierre.json');
const recent = load('docs/evidencias/134-recibos-recientes.json');
const native = load('docs/evidencias/134-recibos-nativos.json');
const ownerByFile = new Map();
const declaredAreasByFile = new Map();
for (const area of baseline.rows) for (const file of area.routeFiles) {
  if (!declaredAreasByFile.has(file)) declaredAreasByFile.set(file, []);
  declaredAreasByFile.get(file).push(area.id);
}
for (const file of declaredAreasByFile.keys()) {
  const matches = definitions.flatMap((area, position) => area.carpetas.filter((prefix) => file === prefix || file.startsWith(`${prefix}/`)).map((prefix) => ({ id: area.id, length: prefix.length, position })));
  matches.sort((a, b) => b.length - a.length || a.position - b.position);
  ownerByFile.set(file, matches[0]?.id || declaredAreasByFile.get(file)[0]);
}
const routeFiles = paths.filter((file) => /^src\/app\//.test(file) && /\/(page|route)\.[jt]sx?$/.test(file));
assert.equal(definitions.length, 14);
assert.equal(new Set(routeFiles).size, routeFiles.length);
const unmapped = routeFiles.filter((file) => !ownerByFile.has(file));
const stale = [...ownerByFile.keys()].filter((file) => !target.has(file));

const resolved = (from, spec) => {
  if (!spec.startsWith('@/') && !spec.startsWith('.')) return null;
  const base = spec.startsWith('@/') ? `src/${spec.slice(2)}` : path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  const choices = [base, ...['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json', '.css', '/index.tsx', '/index.ts', '/index.js'].map((ext) => base + ext)];
  if (/\.js$/.test(base)) choices.push(base.slice(0, -3) + '.ts', base.slice(0, -3) + '.tsx');
  return choices.find((candidate) => target.has(candidate)) || null;
};
const parsed = new Map();
function parse(file) {
  if (parsed.has(file)) return parsed.get(file);
  const text = code.get(file);
  const record = { file, blob: target.get(file) || null, imports: [], unresolvedLocalImports: [], nonliteralImports: [], controls: [], methods: [] };
  parsed.set(file, record);
  if (!text) return record;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const line = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const addImport = (spec, node) => {
    if (!spec.startsWith('.') && !spec.startsWith('@/')) return;
    const destination = resolved(file, spec);
    if (destination) record.imports.push(destination);
    else record.unresolvedLocalImports.push({ specifier: spec, line: line(node) });
  };
  const walk = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) addImport(node.moduleSpecifier.text, node);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(sf) === 'require')) {
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) addImport(node.arguments[0].text, node);
      else record.nonliteralImports.push({ line: line(node), expression: node.getText(sf).slice(0, 200) });
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
      const events = attributes.filter((attr) => /^on[A-Z]/.test(attr.name.getText(sf))).map((attr) => ({ name: attr.name.getText(sf), expression: attr.initializer?.getText(sf).slice(0, 240) || null }));
      if (/^(button|a|input|select|textarea|form|Button|Link|Input|Select|SelectTrigger|Textarea|Checkbox|Switch|RadioGroup|Slider|Form|TabsTrigger|DialogTrigger|DropdownMenuItem)$/.test(tag) || events.length) {
        record.controls.push({ line: line(node), tag, events,
          identifiers: attributes.filter((attr) => /^(id|name|title|aria-label|data-testid|href|type)$/.test(attr.name.getText(sf))).map((attr) => ({ name: attr.name.getText(sf), expression: attr.initializer?.getText(sf).slice(0, 180) || null })),
          individuallyAccepted: false, scope: 'AST location; no automatic interaction proof' });
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name && /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)$/.test(node.name.text)) record.methods.push(node.name.text);
    ts.forEachChild(node, walk);
  };
  walk(sf);
  record.imports = [...new Set(record.imports)];
  return record;
}
const closure = (entries) => {
  const seen = new Set();
  const visit = (file) => { if (seen.has(file)) return; seen.add(file); for (const next of parse(file).imports) visit(next); };
  entries.forEach(visit);
  return [...seen].sort();
};
function boundaries(file) {
  if (!/\/page\./.test(file)) return [];
  const found = [];
  let dir = path.posix.dirname(file);
  while (dir.startsWith('src/app')) {
    for (const name of ['layout', 'template', 'error', 'loading', 'not-found']) {
      for (const ext of ['tsx', 'ts', 'jsx', 'js']) if (target.has(`${dir}/${name}.${ext}`)) found.push(`${dir}/${name}.${ext}`);
    }
    dir = path.posix.dirname(dir);
  }
  if (target.has('src/middleware.ts')) found.push('src/middleware.ts');
  return found;
}
function urlFor(file) {
  const segments = path.posix.dirname(file).slice('src/app'.length).split('/').filter((part) => part && !/^\(.*\)$/.test(part) && !part.startsWith('@'));
  return '/' + segments.map((part) => part.replace(/^\[\[\.\.\.(.+)\]\]$/, ':$1*?').replace(/^\[\.\.\.(.+)\]$/, ':$1*').replace(/^\[(.+)\]$/, ':$1')).join('/');
}
const routePatterns = new Map();
const routeMatch = (pattern, navigation) => {
  if (routePatterns.has(pattern)) return routePatterns.get(pattern).test(navigation.split(/[?#]/)[0]);
  const parts = pattern.split('/').slice(1);
  const escaped = parts.map((part) => part.startsWith(':') ? (part.includes('*') ? '.*' : '[^/]+') : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const compiled = new RegExp(`^/${escaped.join('/')}/?$`);
  routePatterns.set(pattern, compiled);
  return compiled.test(navigation.split(/[?#]/)[0]);
};
const rows = routeFiles.map((file) => {
  const ownClosure = closure([file]);
  const boundaryFiles = boundaries(file);
  const allFiles = closure([file, ...boundaryFiles]);
  const area = ownerByFile.get(file) || 'UNMAPPED';
  const structuralAreas = definitions.filter((definition) => ownClosure.some((dependency) => definition.carpetas.some((prefix) => dependency === prefix || dependency.startsWith(`${prefix}/`)))).map((item) => item.id);
  return { file, route: urlFor(file), kind: /\/route\./.test(file) ? 'api' : 'page', ownerArea: area, declaredAreas: declaredAreasByFile.get(file) || [],
    structuralAreaReferences: structuralAreas, ownStaticClosure: ownClosure, boundaryFiles, allStaticClosure: allFiles,
    methods: parse(file).methods, nativeCaseIds: [], historicalNativeCaseIds: [], history: null, references128: [],
    fullRouteAccepted: false, remainingAcceptance: 'Check primary workflow, intended actors, error/retry and persistence not explicitly covered by linked scenarios.' };
});
const rowByFile = new Map(rows.map((row) => [row.file, row]));
const runtimePath = (file) => /^(src\/|public\/)/.test(file) || /^(package(?:-lock)?\.json|next\.config\.[cm]?[jt]s|tsconfig\.json|tailwind\.config\.[jt]s|postcss\.config\.[cm]?js|firestore\.rules|storage\.rules|firebase\.json)$/.test(file);
const changedCache = new Map();
function changed(sha) {
  if (!sha) return null;
  if (changedCache.has(sha)) return changedCache.get(sha);
  try {
    const old = tree(sha);
    const delta = [...new Set([...old.keys(), ...target.keys()])].filter((file) => old.get(file) !== target.get(file));
    const result = { sourceSha: sha, runtimeDifferences: delta.filter(runtimePath), allDifferences: delta.length };
    changedCache.set(sha, result);
    return result;
  } catch { changedCache.set(sha, null); return null; }
}
for (const row of rows) {
  const old = history.routes.find((candidate) => candidate.file === row.file);
  if (old) {
    const sha = history.applicationSourceSha;
    const delta = changed(sha);
    row.history = { ledger: 'docs/evidencias/124-cobertura-recuento.json.gz', sourceSha: sha,
      classificationAtCapture: old.classification, directRuntimeProof: old.directRuntimeProof,
      currentStaticConsumerDifferences: delta ? delta.runtimeDifferences.filter((file) => row.allStaticClosure.includes(file)) : null,
      e2eReferences: old.historicE2eReferences || [], documentReferences: old.documentReferences || [], unitReferences: old.unitReferences || [],
      fullRouteAccepted: false };
  }
  row.references128 = baseline.rows.flatMap((area) => area.testsWithDirectSourceReferences.filter((test) => test.directImports.includes(row.file)).map((test) => ({ suite: test.test, assertionsAtCapture: test.assertions, statusAtCapture: test.status, sourceSha: baseline.applicationSourceSha, meaning: 'direct import in executed unit suite; not UI journey acceptance' })));
}

function navigationDefinitions(source, file) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const tests = [];
  const variables = new Map();
  const collect = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (!variables.has(node.name.text)) variables.set(node.name.text, []);
      variables.get(node.name.text).push(node.initializer);
    }
    ts.forEachChild(node, collect);
  };
  collect(sf);
  const literal = (node, depth = 0) => {
    if (!node || depth > 8) return null;
    if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression, depth + 1);
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isIdentifier(node) && variables.get(node.text)?.length === 1) return literal(variables.get(node.text)[0], depth + 1);
    if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((span) => (literal(span.expression, depth + 1) || ':dynamic') + span.literal.text).join('');
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const a = literal(node.left, depth + 1), b = literal(node.right, depth + 1);
      return a !== null && b !== null ? a + b : null;
    }
    return null;
  };
  const arrayValues = (node) => {
    if (ts.isIdentifier(node) && variables.get(node.text)?.length === 1) node = variables.get(node.text)[0];
    if (ts.isAsExpression(node)) node = node.expression;
    return ts.isArrayLiteralExpression(node) ? node.elements : [];
  };
  const visit = (node) => {
    if (ts.isCallExpression(node) && /^(test|test\.(?:only|skip|fixme))$/.test(node.expression.getText(sf)) && node.arguments.length >= 2) {
      const title = literal(node.arguments[0]);
      const callback = node.arguments.find((argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument));
      if (title && callback) {
        const navigations = [], unresolvedNavigations = [];
        const walk = (child, bindings = new Map()) => {
          if (ts.isForOfStatement(child) && ts.isVariableDeclarationList(child.initializer)) {
            const declaration = child.initializer.declarations[0];
            if (ts.isIdentifier(declaration.name)) {
              const next = new Map(bindings); next.set(declaration.name.text, arrayValues(child.expression));
              walk(child.statement, next); return;
            }
          }
          if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression)
            && (child.expression.name.text === 'goto' || (/^(get|post|put|patch|delete)$/.test(child.expression.name.text) && /(?:^|\.)request$/.test(child.expression.expression.getText(sf))))) {
            const arg = child.arguments[0];
            let values = arg ? [literal(arg)] : [];
            if (arg && ts.isIdentifier(arg) && bindings.has(arg.text)) values = bindings.get(arg.text).map((entry) => literal(entry));
            if (arg && ts.isPropertyAccessExpression(arg) && ts.isIdentifier(arg.expression) && bindings.has(arg.expression.text)) {
              values = bindings.get(arg.expression.text).flatMap((entry) => ts.isObjectLiteralExpression(entry) ? entry.properties.filter((property) => ts.isPropertyAssignment(property) && property.name.getText(sf) === arg.name.text).map((property) => literal(property.initializer)) : []);
            }
            const paths = values.filter((value) => value?.startsWith('/'));
            navigations.push(...paths);
            if (!paths.length) unresolvedNavigations.push(child.getText(sf).slice(0, 240));
          }
          ts.forEachChild(child, (next) => walk(next, bindings));
        };
        walk(callback);
        tests.push({ title, navigations: [...new Set(navigations)], unresolvedNavigations });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return tests;
}
const canonicalTest = (file) => file.replace('133-invitado-con-red-local.spec.ts', 'viaje-invitado.spec.ts').replace('133-qr-descarga-lector-local.spec.ts', 'qr-descargado-lector-real.spec.ts');
const cases = [];
for (const run of native.runs) {
  const sha = run.execution.sourceSha;
  const delta = changed(sha);
  const equivalent = Boolean(delta && delta.runtimeDifferences.length === 0);
  const definitionsByFile = new Map(run.sources.filter((source) => source.content).map((source) => [source.file, navigationDefinitions(source.content, source.file)]));
  const suites = (suite, project = null) => {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      const results = test.results || [];
      const result = results.at(-1) || {};
      const file = spec.file?.startsWith('tests/') ? spec.file : `tests/e2e/${spec.file || suite.file || ''}`;
      const sourceRecord = run.sources.find((source) => source.file === file || source.file.endsWith('/' + path.posix.basename(file)));
      const definitions = sourceRecord ? definitionsByFile.get(sourceRecord.file) || [] : [];
      const def = definitions.find((definition) => {
        const expression = definition.title.split(':dynamic').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        return new RegExp(`^${expression}$`).test(spec.title);
      });
      const navigation = [...(def?.navigations || [])];
      if (def?.unresolvedNavigations.length) {
        const explicitPath = spec.title.match(/^(\/[^\s]*)\s/);
        if (explicitPath) navigation.push(explicitPath[1]);
      }
      const candidates = rows.filter((row) => navigation.some((url) => routeMatch(row.route, url))).map((row) => row.file);
      const linked = equivalent ? candidates : [];
      const record = { id: `N${String(cases.length + 1).padStart(4, '0')}`, runId: run.id, sourceSha: sha, runtimeSourceEquivalent: equivalent,
        testFile: sourceRecord?.file || file, canonicalTestFile: canonicalTest(sourceRecord?.file || file), testSourceHash: sourceRecord?.sha256 || null,
        exactTestSourceAvailable: Boolean(sourceRecord?.availableSourceMatches), title: spec.title, project: test.projectName || project,
        status: result.status || test.status, duration: result.duration, errors: (result.errors || []).map((error) => (error.message || '').slice(0, 1600)),
        navigationDeclarations: navigation, unresolvedNavigationDeclarations: def?.unresolvedNavigations || [], routeFiles: linked,
        historicalRouteFiles: equivalent ? [] : candidates,
        consumerDifferences: candidates.map((file) => ({ file, changedDependencies: delta ? delta.runtimeDifferences.filter((dependency) => rowByFile.get(file).allStaticClosure.includes(dependency)) : null })),
        evidenceMeaning: 'Executed named test; navigation declarations link a partial scenario, not every branch, control or role.' };
      cases.push(record);
      for (const file of linked) rowByFile.get(file).nativeCaseIds.push(record.id);
      if (!equivalent) for (const file of candidates) rowByFile.get(file).historicalNativeCaseIds.push(record.id);
    }
    for (const child of suite.suites || []) suites(child, project);
  };
  for (const suite of run.results.suites || []) suites(suite);
}
// Same titles/projects are repeated across QA retries; keep every receipt but count distinct cases once.
const distinct = new Map();
for (const record of cases) {
  const key = `${record.canonicalTestFile}|${record.title}|${record.project}`;
  if (!distinct.has(key)) distinct.set(key, { key, caseIds: [], statuses: new Set() });
  const group = distinct.get(key); group.caseIds.push(record.id); group.statuses.add(record.status);
}
const caseById = new Map(cases.map((record) => [record.id, record]));
for (const run of native.runs) {
  const stats = run.results.stats;
  assert.equal(cases.filter((record) => record.runId === run.id).length, stats.expected + stats.unexpected + stats.skipped, `Case count mismatch: ${run.id}`);
}
for (const row of rows) {
  const linked = row.nativeCaseIds.map((id) => caseById.get(id));
  row.linkedPassedScenarios = linked.filter((record) => record.status === 'passed').map((record) => record.id);
  row.linkedOtherScenarios = linked.filter((record) => record.status !== 'passed').map((record) => record.id);
  row.reconciliationStatus = row.linkedPassedScenarios.length ? 'CURRENT_PARTIAL_SCENARIOS_LINKED'
    : row.linkedOtherScenarios.length ? 'CURRENT_EXECUTION_NOT_ACCEPTED'
      : row.history?.directRuntimeProof ? 'HISTORICAL_SCENARIOS_RECHECK_CONSUMERS'
        : row.references128.length ? 'UNIT_REFERENCE_NO_LINKED_CURRENT_NATIVE_SCENARIO'
          : 'NO_LINKED_CURRENT_NATIVE_SCENARIO';
}

const reportScopes = recent.rows.map((record) => {
  const delta = changed(record.sourceSha);
  return { ...record, currentness: !record.sourceSha ? 'NOT_RUNTIME_EVIDENCE' : !delta ? 'SOURCE_NOT_RESOLVED'
    : delta.runtimeDifferences.length === 0 ? 'RUNTIME_SOURCE_EQUIVALENT_REPORT_SCOPE' : 'HISTORICAL_REVIEW_SELECTED_CONSUMERS',
  runtimeDifferences: delta?.runtimeDifferences || null, fullAreaAccepted: false };
});
const rolesSource = code.get('src/lib/auth/perfiles.ts');
const roleDefinition = rolesSource.match(/export type Perfil\s*=([\s\S]*?);/)[1];
const roles = [...roleDefinition.matchAll(/'([^']+)'/g)].map((match) => ({ id: match[1], definition: 'src/lib/auth/perfiles.ts',
  fullRoleAccepted: false, requiredEvidence: 'Link allowed and denied operations for this actual profile; synthetic generic team session does not identify a profile.',
  doorwayScenarioIds: cases.filter((record) => record.status === 'passed' && record.routeFiles.some((file) => {
    const url = rowByFile.get(file).route;
    return match[1] === 'cliente' ? /^\/(portal|portal-cliente)\//.test(url)
      : match[1] === 'invitado' ? /^\/(invitacion|invitado)\//.test(url)
        : match[1] === 'prospecto' ? /^\/(simulador|catalogo|public)/.test(url) : false;
  })).map((record) => record.id), doorwayAssociationMeaning: 'URL/scenario association only, not an authorization matrix for Perfil' }));

// Search all committed audit artefacts as references; never promote a text hit to a passed test.
const docTree = tree(documentarySha);
const sharedDocuments = ['ESTADO-ACTUAL.md','ESTADO-AUDITORIA.md'];
const docFiles = [...docTree.keys()].filter((file) => sharedDocuments.includes(file)
  || /^docs\/(?!evidencias\/134-)/.test(file) && (/\.(?:md|json|json\.gz)$/.test(file)
    || /^docs\/evidencias\//.test(file) && /\.(?:mjs|cjs|tsx?)$/.test(file)));
const docBatch = git(['cat-file', '--batch'], { encoding: null, input: `${docFiles.map((file) => `${documentarySha}:${file}`).join('\n')}\n` });
const historicalArtifacts = [], historicalReferences = [];
let docOffset = 0;
for (const file of docFiles) {
  const end = docBatch.indexOf(10, docOffset);
  const size = Number(docBatch.subarray(docOffset, end).toString('utf8').split(' ').at(-1));
  assert(Number.isSafeInteger(size));
  const raw = docBatch.subarray(end + 1, end + 1 + size); docOffset = end + 1 + size + 1;
  let bytes, parsedJson = null, skipReason = null;
  try {
    bytes = file.endsWith('.gz') ? zlib.gunzipSync(raw, { maxOutputLength: 16 * 1024 * 1024 }) : raw;
    if (/\.json(?:\.gz)?$/.test(file)) parsedJson = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  } catch (error) { skipReason = String(error.message); }
  const id = `H${String(historicalArtifacts.length + 1).padStart(4, '0')}`;
  const artifact = { id, file, blob: docTree.get(file), sha256: hash(raw), bytes: raw.length,
    category: /inventario|cobertura|matriz|recuento|registro/.test(file) ? 'inventory-or-registry-reference'
      : /\.[cm]?[jt]sx?$/.test(file) ? 'probe-source-reference' : 'historical-document-or-result',
    declaredSourceSha: parsedJson?.applicationSourceSha || parsedJson?.sourceSha || parsedJson?.sourceApp || parsedJson?.source?.commit || null,
    expansionError: skipReason, routeReferenceCount: 0, functionalAcceptance: false };
  historicalArtifacts.push(artifact);
  if (!bytes || skipReason) continue;
  const text = bytes.toString('utf8');
  const candidates = [...new Set((text.replace(/\$\{[^}]+\}/g, ':dynamic').match(/\/[A-Za-z0-9_:\[\].*?=&%/-]+/g) || []).filter((value) => value.length > 1))];
  const candidatesByPrefix = new Map();
  for (const candidate of candidates) {
    const prefix = candidate.split('/')[1];
    if (!candidatesByPrefix.has(prefix)) candidatesByPrefix.set(prefix, []);
    candidatesByPrefix.get(prefix).push(candidate);
  }
  const rootLiteral = /["'`]\/["'`]/.test(text);
  for (const row of rows) {
    const directSource = text.includes(row.file);
    const prefix = row.route.split('/')[1];
    const relevant = prefix.startsWith(':') ? candidates : candidatesByPrefix.get(prefix) || [];
    const navigation = row.route === '/' ? rootLiteral : relevant.some((candidate) => routeMatch(row.route, candidate));
    if (!directSource && !navigation) continue;
    const at = directSource ? text.indexOf(row.file) : -1;
    historicalReferences.push({ artifactId: id, routeFile: row.file, sourceFileMention: directSource, routeStringMention: navigation,
      line: file.endsWith('.md') && at >= 0 ? text.slice(0, at).split('\n').length : null, functionalAcceptance: false });
    artifact.routeReferenceCount++;
  }
}
assert.equal(docOffset, docBatch.length);
for (const row of rows) row.historicalReferenceIds = historicalReferences.filter((reference) => reference.routeFile === row.file).map((reference) => reference.artifactId);

const counts = {
  areas: definitions.length, routes: rows.length, unmappedRoutes: unmapped.length, staleMappedRoutes: stale.length,
  uniqueStructuralFiles: parsed.size, uniqueAstInteractiveLocations: [...parsed.values()].reduce((sum, record) => sum + record.controls.length, 0),
  prior131AstLocations: oldInventory.counts.uniqueAstMatchedControlLocations,
  nativeRunsIndexed: native.runs.length, nativeCaseExecutions: cases.length, distinctNamedNativeCases: distinct.size,
  routesWithLinkedPassingPartialScenarios: rows.filter((row) => row.linkedPassedScenarios.length).length,
  routesWithoutLinkedPassingPartialScenarios: rows.filter((row) => !row.linkedPassedScenarios.length).length,
  routesWithHistoricalNativeScenarioLinks: rows.filter((row) => row.historicalNativeCaseIds.length).length,
  individuallyAcceptedControls: 0, fullRoutesAccepted: 0, fullAreasAccepted: 0, profiles: roles.length,
  historicalArtifactsIndexed: historicalArtifacts.length, historicalArtifactsNotExpanded: historicalArtifacts.filter((item) => item.expansionError).length,
  historicalRouteReferenceLinks: historicalReferences.length, multiplyDeclaredRoutes: rows.filter((row) => row.declaredAreas.length > 1).length,
};
const areas = definitions.map((definition) => {
  const owned = rows.filter((row) => row.ownerArea === definition.id);
  const structural = rows.filter((row) => row.structuralAreaReferences.includes(definition.id));
  return { id: definition.id, name: definition.nombre, ownedRoutes: owned.map((row) => row.file), structuralConsumerRoutes: structural.map((row) => row.file),
    declaredRoutes: rows.filter((row) => row.declaredAreas.includes(definition.id)).map((row) => row.file),
    namedBarUiRoutes: definition.id === 'barra' ? rows.filter((row) => /(?:barra|tragos)/.test(row.route)).map((row) => row.file) : [],
    linkedPartialScenarioRoutes: owned.filter((row) => row.linkedPassedScenarios.length).map((row) => row.file),
    noLinkedPassingScenarioRoutes: owned.filter((row) => !row.linkedPassedScenarios.length).map((row) => row.file),
    reportScopeIds: reportScopes.filter((scope) => scope.areaIds.includes(definition.id)).map((scope) => scope.id),
    registeredState: definition.estado, registeredRevision: definition.ultimaRevision || null, fullAreaAccepted: false,
    closureAction: 'Resolve remaining routes/scenarios and actor boundaries using linked receipts; references or an old registry status are not acceptance.' };
});
assert.equal(areas.reduce((sum, area) => sum + area.ownedRoutes.length, 0), rows.length);
assert.equal(unmapped.length, 0);
assert.equal(stale.length, 0);
assert.equal(roles.length, 7);
const payload = { sourceSha, documentarySha, counts, method: {
  source: 'Immutable git blobs; no app execution or edits', navigationLinking: 'Exact executed test source hash + declared goto in matching named case; unresolved calls stay unlinked',
  inventory: 'JSX interactive candidates, all onX handlers, static/literal dynamic local imports, page layout/error/loading boundaries; neither render proof nor complete runtime interaction inventory',
  areaAssignment: 'Longest declared folder prefix, stable registry order for ties; overlapping declared memberships preserved. Shared dependency membership is not a visible module or permission proof.',
  missingProofMeaning: 'No current linked receipt in this ledger; not a defect and not a claim that nobody audited it',
  currentness: 'Runtime-source fingerprint covers tracked src/public/config/lock/rules files; historical closure differences are listed without upgrading to current acceptance',
  controlAcceptance: 'No per-control observed interaction ledger existed. Locations remain not individually accepted; do not reinterpret this as zero controls used.' },
  sourceComparisons: [...changedCache.values()].filter(Boolean), areas, roles,
  routes: rows, files: [...parsed.values()], nativeCases: cases, historicalArtifacts, historicalReferences,
  repeatedCases: [...distinct.values()].filter((group) => group.caseIds.length > 1).map((group) => ({ ...group, statuses: [...group.statuses] })),
  reportScopes, historicalLedger: 'docs/evidencias/124-cobertura-recuento.json.gz', baseline128: 'docs/evidencias/128-matriz-areas.json',
  prior131: 'docs/evidencias/131-inventario-cierre.json.gz', allAppCertified: false,
};
const compressed = zip('134-conciliacion-completa.json.gz', payload);
write('134-conciliacion.json', { sourceSha, documentarySha, counts, areas: areas.map((area) => ({ id: area.id, name: area.name, ownedRoutes: area.ownedRoutes.length,
  structuralConsumerRoutes: area.structuralConsumerRoutes.length, partialScenarioRoutes: area.linkedPartialScenarioRoutes.length,
  noLinkedPassingScenarioRoutes: area.noLinkedPassingScenarioRoutes.length, reportScopes: area.reportScopeIds, fullAreaAccepted: false })),
  payload: compressed, allAppCertified: false });
const csv = [['area','route','file','status','passedScenarioLinks','otherScenarioLinks','unitReferenceLinks','historicalClassification','fullRouteAccepted'], ...rows.map((row) =>
  [row.ownerArea,row.route,row.file,row.reconciliationStatus,row.linkedPassedScenarios.length,row.linkedOtherScenarios.length,row.references128.length,row.history?.classificationAtCapture || '',false])];
fs.writeFileSync(path.join(root,out,'134-rutas.csv'), csv.map((row) => row.map((value) => `"${String(value).replaceAll('"','""')}"`).join(',')).join('\n')+'\n');
write('134-roles.json', { sourceSha, roles, assistantPersonasAreNotAuthorizationProfiles: ['Caja','Ventas','Marketing','Eventos','Fiesta','Agenda'],
  externalActors: ['cliente-con-clave','invitado-con-enlace','proveedor-con-token','operador-de-estacion-con-token'], fullRoleCoverage: false });
console.log(JSON.stringify({ sourceSha, counts, manifest: compressed.file }));
