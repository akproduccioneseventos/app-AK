import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'docs/evidencias/109-inventario-cobertura.json');
const areasFile = path.join(root, 'docs/codex/areas.json');
const areaDefinitions = JSON.parse(fs.readFileSync(areasFile, 'utf8')).areas;
const relevantDocs = [
  'docs/evidencias/84-recuento-y-pendientes.md',
  'docs/evidencias/102-recuento-correcciones-directas.md',
  'docs/evidencias/105-react19-salon-y-regresiones.md',
  'docs/evidencias/106-salon-recorrido-y-parches.md',
  'docs/evidencias/107-conexiones-google.md',
  'docs/evidencias/108-conexiones-redes-y-sesion.md',
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /^(page|route)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function routeFor(file) {
  const relative = path.relative(path.join(root, 'src/app'), path.dirname(file));
  const segments = relative === '.' ? [] : relative.split(path.sep);
  const visible = segments.filter((part) => !/^\([^)]*\)$/.test(part) && !part.startsWith('@'));
  return `/${visible.map((part) => part.replace(/^\[\.\.\.(.+)\]$/, ':$1*').replace(/^\[\[(.+)\]\]$/, ':$1?').replace(/^\[(.+)\]$/, ':$1')).join('/')}`.replace(/\/$/, '') || '/';
}

function areaFor(rel) {
  const matches = areaDefinitions.flatMap((area) => area.carpetas
    .filter((folder) => rel === folder || rel.startsWith(`${folder}/`))
    .map((folder) => ({ id: area.id, length: folder.length })));
  return matches.sort((a, b) => b.length - a.length)[0]?.id ?? 'sin-clasificar';
}

function parseSource(source, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const symbols = [], methods = [], controls = [];
  const visit = (node) => {
    const exported = node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
    if (ts.isFunctionDeclaration(node) && exported && node.name) {
      const name = node.name.text;
      if (/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(name)) methods.push(name);
      else if (!/^(Page|Layout|default|GET|POST)$/.test(name)) symbols.push(name);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (/^(button|Button|a|Link|input|Input|select|Select|Switch|Checkbox|DialogTrigger|DropdownMenuItem)$/.test(tag)) {
        const attributes = node.attributes.properties.filter(ts.isJsxAttribute).map(attr =>
          ({ name: attr.name.getText(ast), value: attr.initializer?.getText(ast).slice(0,180) }));
        controls.push({ tag, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, attributes });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return { symbols, methods, controls };
}

const refs = relevantDocs.filter((name) => fs.existsSync(path.join(root, name))).map((name) => ({
  file: name,
  text: fs.readFileSync(path.join(root, name), 'utf8'),
}));
const e2eDir = path.join(root, 'tests/e2e');
const e2eFiles = fs.existsSync(e2eDir) ? walkAll(e2eDir).filter((f) => /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(f)) : [];
function walkAll(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walkAll(full) : [full];
  });
}
const e2eSources = e2eFiles.map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return { file, text, identifiers: new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? []) };
});

const inventory = walk(path.join(root, 'src/app')).sort().map((file) => {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const route = routeFor(file);
  const source = fs.readFileSync(file, 'utf8');
  const { symbols, methods, controls } = parseSource(source, rel);
  const directMatches = [];
  for (const { file: testFile, text, identifiers } of e2eSources) {
    const routeHit = text.includes(`'${route}'`) || text.includes(`"${route}"`) || text.includes('`' + route + '`');
    const sourceFileHit = text.includes(rel) || text.includes(rel.replace(/^src\//, '@/'));
    const symbolHits = symbols.filter((symbol) => identifiers.has(symbol));
    if (routeHit || sourceFileHit || symbolHits.length) directMatches.push({
      file: path.relative(root, testFile).split(path.sep).join('/'),
      exactRouteReference: routeHit,
      sourceFileReference: sourceFileHit,
      exactSymbols: symbolHits,
    });
  }
  const docMatches = [];
  for (const doc of refs) {
    const routeMention = doc.text.includes(route) && route !== '/';
    const symbolHits = symbols.filter((symbol) => doc.text.includes(symbol));
    if (routeMention || symbolHits.length) docMatches.push({
      file: doc.file,
      exactRouteReference: routeMention,
      exactSymbols: symbolHits,
      evidenceClass: 'REFERENCIA_DOCUMENTAL_NO_APROBACION',
      note: 'Coincidencia documental; no constituye aprobación del consumidor.'
    });
  }
  return {
    file: rel,
    route,
    kind: path.basename(file).startsWith('route.') ? 'route-handler' : 'page',
    area: areaFor(rel),
    symbols,
    methods,
    controlsDeclaredInThisFile: controls,
    controlScope: 'Direct JSX only; does not include child components or prove clicks/permissions/persistence.',
    e2e: directMatches.length ? { status: 'REFERENCIA_E2E', matches: directMatches } : { status: 'SIN_EVIDENCIA', matches: [] },
    documents: docMatches,
  };
});

const counts = {
  total: inventory.length,
  pages: inventory.filter((item) => item.kind === 'page').length,
  routeHandlers: inventory.filter((item) => item.kind === 'route-handler').length,
  byArea: Object.fromEntries([...new Set(inventory.map((item) => item.area))].sort().map((area) => [area, inventory.filter((item) => item.area === area).length])),
  e2eReference: inventory.filter((item) => item.e2e.status === 'REFERENCIA_E2E').length,
  noE2eEvidence: inventory.filter((item) => item.e2e.status === 'SIN_EVIDENCIA').length,
  documentReferences: inventory.reduce((n, item) => n + item.documents.length, 0),
  controlsDeclaredInPageFiles: inventory.reduce((n, item) => n + item.controlsDeclaredInThisFile.length, 0),
};

const componentControls = walkAll(path.join(root, 'src/components'))
  .filter(file => /\.tsx$/.test(file) && !/(?:__tests__|\.test\.|\.spec\.)/.test(file))
  .map(file => ({ file: path.relative(root,file).replaceAll('\\','/'),
    ...parseSource(fs.readFileSync(file,'utf8'),file) }))
  .filter(item => item.controls.length > 0);
counts.componentFilesWithControls = componentControls.length;
counts.controlsDeclaredInComponents = componentControls.reduce((sum,item) => sum + item.controls.length,0);

fs.writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceHead: execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(), sourceApp: '8fa5b56a2833938541a657dcd15ef88130d24b0e', classificationRule: 'References only, never PASS or complete coverage. Generic identifiers excluded; source AST gives exported symbols and direct controls. Dynamic URL absence is not absence of tests. Components listed separately; JSX declarations are not rendered instances.', inputEvidence: relevantDocs.filter((name) => fs.existsSync(path.join(root, name))), counts, inventory, componentControls }, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, output), counts }, null, 2));
