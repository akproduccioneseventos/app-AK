import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHA = 'e8cd2c2b114bcda21d153cb406318cc1119d1dc5';
const MATRIX = 'docs/evidencias/128-matriz-areas.json';
const OUTPUT = 'docs/evidencias/131-inventario-cierre.json';
const REFS = ['docs/evidencias/130-resumen-final.json', 'docs/evidencias/129-registro-ejecucion.json', MATRIX];
const PRESERVED_PRIOR = {
  file: 'docs/evidencias/131-inventario-antes-alias.json.gz',
  originalJsonSha256: 'cf9380dd314e1303ba115e3726b30ab4dbe5b5ab33b3da521e7b6224fd7912f2',
};

function git(args, encoding = 'utf8') {
  return execFileSync('git', args, { cwd: ROOT, encoding, maxBuffer: 64 * 1024 * 1024 });
}

const tree = git(['ls-tree', '-r', '--name-only', SHA]).split(/\r?\n/).filter(Boolean);
const treeSet = new Set(tree);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-131-source-'));
function cleanupTemp() {
  const resolvedTemp = path.resolve(temp);
  const resolvedOsTemp = path.resolve(os.tmpdir());
  const relative = path.relative(resolvedOsTemp, resolvedTemp);
  if (!path.basename(resolvedTemp).startsWith('ak-131-source-') || !relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Se rehúsa limpiar una ruta temporal fuera del directorio esperado: ${resolvedTemp}`);
  }
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
try {
const archive = path.join(temp, 'src.tar');
fs.writeFileSync(archive, git(['archive', '--format=tar', SHA, 'src'], null));
const unpack = spawnSync('tar', ['-xf', archive, '-C', temp], { encoding: 'utf8' });
if (unpack.status !== 0) throw new Error(`No se pudo abrir el archivo temporal de fuente: ${unpack.stderr}`);
const contentCache = new Map();
function source(file) {
  if (contentCache.has(file)) return contentCache.get(file);
  if (!treeSet.has(file)) return null;
  const archivedPath = path.join(temp, ...file.split('/'));
  const content = fs.existsSync(archivedPath) ? fs.readFileSync(archivedPath, 'utf8') : git(['show', `${SHA}:${file}`]);
  contentCache.set(file, content);
  return content;
}
function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}
function lineAt(sf, pos) {
  return sf.getLineAndCharacterOfPosition(pos).line + 1;
}
function resolveLocal(from, spec) {
  const base = spec.startsWith('@/') ? path.posix.join('src', spec.slice(2)) : path.posix.join(path.posix.dirname(from), spec);
  const candidates = path.posix.extname(base)
    ? [base]
    : ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'].map(ext => `${base}${ext}`);
  return candidates.find(candidate => treeSet.has(candidate)) ?? null;
}
function imports(sf, from) {
  const found = [];
  const visit = node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const spec = node.moduleSpecifier.text;
      if (spec.startsWith('.') || spec.startsWith('@/')) {
        const resolved = resolveLocal(from, spec);
        if (resolved) found.push(resolved);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return [...new Set(found)];
}
function expressionText(node) {
  return node.getText().replace(/\s+/g, ' ').slice(0, 500);
}
function sourceCategory(file) {
  if (/(?:^|\/)(?:__tests__|tests)(?:\/|$)/.test(file) || /\.(?:test|spec)\.[^.]+$/.test(file)) return 'test-source';
  if (/(?:^|\/)(?:data|fixtures?)(?:\/|$)/i.test(file) || /\.(?:json|ya?ml|csv|svg|png|jpe?g|webp)$/.test(file)) return 'data-or-asset-source';
  if (/\.[jt]sx$/.test(file)) return 'jsx-capable-source-not-render-proof';
  return 'other-static-local-source';
}
function inspectComponent(file, ownerRoute, seen, records) {
  if (seen.has(file)) return;
  seen.add(file);
  const text = source(file);
  if (text === null) return;
  const kind = file.endsWith('.tsx') || file.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const controls = [];
  function walk(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const attrs = [];
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr)) continue;
        const name = attr.name.getText(sf);
        if (/^(onClick|onSubmit|onChange)$/.test(name)) {
          attrs.push({ event: name, expression: attr.initializer ? expressionText(attr.initializer) : null, line: lineAt(sf, attr.getStart(sf)) });
        }
      }
      const declaredControl = /^(?:button|input|select|textarea|Button|Input|Select|SelectTrigger|Textarea|Checkbox|Switch|RadioGroup|Slider|Form|form)$/i.test(tag);
      if (declaredControl || attrs.length) controls.push({ tag, line: lineAt(sf, node.getStart(sf)), declaredControl, handlers: attrs });
    }
    ts.forEachChild(node, walk);
  }
  walk(sf);
  records.push({ file, sha256: sha256(text), sourceCategory: file === ownerRoute ? 'route-entry' : sourceCategory(file), controls });
  for (const dependency of imports(sf, file)) inspectComponent(dependency, ownerRoute, seen, records);
}

const matrixText = source(MATRIX);
if (!matrixText) throw new Error(`No existe ${MATRIX} en ${SHA}`);
const matrix = JSON.parse(matrixText);
const routeFiles = [...new Set(matrix.rows.flatMap(row => row.routeFiles ?? []))].sort();
const actualRoutes = tree.filter(file => file.startsWith('src/app/') && /\/(?:page|route)\.(?:tsx?|jsx?)$/.test(file)).sort();
const routeSet = new Set(routeFiles);
const actualSet = new Set(actualRoutes);
const unmapped = actualRoutes.filter(file => !routeSet.has(file));
const stale = routeFiles.filter(file => !actualSet.has(file));
if (unmapped.length || stale.length || matrix.routeCount !== routeFiles.length) {
  throw new Error(`Mapa inconsistente: actual=${actualRoutes.length}, mapeadas=${routeFiles.length}, sinMapa=${unmapped.length}, obsoletas=${stale.length}, declaradas=${matrix.routeCount}`);
}

const roleDefinitionCandidates = tree.filter(file => /\.(?:ts|tsx|js|jsx)$/.test(file) && /(?:role|rol|auth|permission|permiso)/i.test(file));
const targetedRoleCandidate = 'src/app/evento/staff/[fiestaId]/cronograma/page.tsx';
if (treeSet.has(targetedRoleCandidate) && !roleDefinitionCandidates.includes(targetedRoleCandidate)) roleDefinitionCandidates.push(targetedRoleCandidate);
const roleHits = [];
for (const file of roleDefinitionCandidates) {
  const text = source(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function find(node) {
    if ((ts.isVariableDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node) || ts.isInterfaceDeclaration(node)) && /^(ROLES?|ROLES|Rol|Role|UserRole|AppRole)$/.test(node.name?.getText(sf) ?? '')) {
      roleHits.push({ file, symbol: node.name.getText(sf), line: lineAt(sf, node.getStart(sf)), declarationKind: ts.SyntaxKind[node.kind] });
    }
    ts.forEachChild(node, find);
  }
  find(sf);
}

const rawRoutes = [];
let routeFileOccurrences = 0;
let routeControlOccurrences = 0;
let routeHandlerOccurrences = 0;
for (const file of routeFiles) {
  const content = source(file);
  if (content === null) throw new Error(`Ruta no presente en SHA: ${file}`);
  const area = matrix.rows.find(row => (row.routeFiles ?? []).includes(file));
  const files = [];
  inspectComponent(file, file, new Set(), files);
  for (const entry of files) {
    routeFileOccurrences++;
    routeControlOccurrences += entry.controls.length;
    routeHandlerOccurrences += entry.controls.reduce((n, control) => n + control.handlers.length, 0);
  }
  rawRoutes.push({
    pageOrRoute: file,
    area: { id: area.id, name: area.name },
    methods: [...new Set([...content.matchAll(/^\s*export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/gm)].map(match => match[1]))],
    acceptance: 'NOT_CLOSED_BY_THIS_INVENTORY',
    localFiles: files,
  });
}

const globalFileMap = new Map();
for (const route of rawRoutes) {
  for (const record of route.localFiles) {
    if (!globalFileMap.has(record.file)) globalFileMap.set(record.file, record);
  }
}
const filePaths = [...globalFileMap.keys()].sort();
const fileIds = new Map(filePaths.map((file, index) => [file, `F${String(index + 1).padStart(4, '0')}`]));
const files = filePaths.map(file => {
  const entry = globalFileMap.get(file);
  return {
    id: fileIds.get(file),
    path: file,
    sha256: entry.sha256,
    sourceCategory: routeSet.has(file) ? 'route-entry' : entry.sourceCategory,
    relation: 'static-import-closure-membership-not-render-proof',
    controls: entry.controls,
  };
});
const routes = rawRoutes.map(({ localFiles, ...route }) => ({
  ...route,
  fileIds: localFiles.map(entry => fileIds.get(entry.file)),
}));
const uniqueControlLocations = new Set(files.flatMap(file => file.controls.map(control => `${file.path}:${control.line}:${control.tag}`)));
const uniqueHandlerLocations = new Set(files.flatMap(file => file.controls.flatMap(control => control.handlers.map(handler => `${file.path}:${handler.line}:${handler.event}:${handler.expression}`))));

const result = {
  artifact: '131-cierre-inventario',
  purpose: 'AST inventory only; not behavioral acceptance, runtime evidence, or closure.',
  source: { commit: SHA, branchAtCapture: 'codex/131-cierre-inventario-20261015', matrixSourceSha: matrix.applicationSourceSha },
  method: {
    parser: `typescript ${ts.version}`,
    sourceRead: `git blobs at ${SHA}; working tree ignored`,
    routeMap: MATRIX,
    localImportResolution: ['@/', 'relative'],
    exclusions: ['node_modules', 'dynamic imports not traversed', 'layout ancestors not included', 'runtime behavior/auth policies not inferred'],
    importSemantics: 'Static import-closure membership does not establish that a module or component is rendered at runtime.',
    schemaCaveat: 'The AST inventory records JSX control-like elements plus only onClick, onSubmit, and onChange expressions. It is not comprehensive control or interaction coverage.',
  },
  referencesOnly: REFS.map(file => ({ file, presentAtSourceCommit: treeSet.has(file) })),
  roleSymbolCandidatesOnly: {
    status: roleHits.length ? 'candidates-found; authorization-role-coverage-not-checked' : 'no-candidates-found-by-targeted-symbol-search',
    candidates: roleHits,
    caveat: 'A symbol named Rol/ROLES is not evidence of application authorization roles; coverage was not checked.',
  },
  priorArtifactPreservation: PRESERVED_PRIOR,
  counts: {
    mappedAreas: matrix.rows.length,
    routeCount: routes.length,
    actualAppPageAndRouteCount: actualRoutes.length,
    unmappedRouteCount: unmapped.length,
    staleMappedRouteCount: stale.length,
    uniqueRouteFileCount: new Set(routes.map(route => route.pageOrRoute)).size,
    uniqueFilesInStaticImportClosures: files.length,
    routeFileOccurrencesIncludingSharedImports: routeFileOccurrences,
    uniqueAstMatchedControlLocations: uniqueControlLocations.size,
    routeControlOccurrencesIncludingSharedImports: routeControlOccurrences,
    uniqueHandlerLocations: uniqueHandlerLocations.size,
    routeHandlerOccurrencesIncludingSharedImports: routeHandlerOccurrences,
    testSourceFiles: files.filter(file => file.sourceCategory === 'test-source').length,
    dataOrAssetSourceFiles: files.filter(file => file.sourceCategory === 'data-or-asset-source').length,
  },
  areaRouteCounts: matrix.rows.map(row => ({ id: row.id, name: row.name, routeCount: row.routeFiles.length })),
  mappingCheck: { passed: unmapped.length === 0 && stale.length === 0, unmappedRoutes: unmapped, staleMappedRoutes: stale },
  routes,
  files,
};
const json = Buffer.from(`${JSON.stringify(result, null, 2)}\n`, 'utf8');
if (json.length > 2_000_000) {
  const compressedFile = `${OUTPUT}.gz`;
  fs.writeFileSync(path.join(ROOT, compressedFile), zlib.gzipSync(json, { level: 9 }));
  const manifest = {
    artifact: result.artifact,
    format: 'gzip-compressed-json',
    compressedFile,
    uncompressedBytes: json.length,
    compressedBytes: fs.statSync(path.join(ROOT, compressedFile)).size,
    uncompressedSha256: sha256(json),
    source: result.source,
    counts: result.counts,
    note: 'Full inventory is in the compressed artifact; this manifest prevents a multi-megabyte plain JSON file in the change.',
  };
  fs.writeFileSync(path.join(ROOT, OUTPUT), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
} else {
  fs.writeFileSync(path.join(ROOT, OUTPUT), json);
}
process.stdout.write(`${JSON.stringify(result.counts)}\n`);
} finally {
  cleanupTemp();
}
