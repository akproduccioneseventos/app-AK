import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import ts from 'typescript';

const inventoryPath = 'docs/evidencias/109-inventario-cobertura.json';
const inventory = JSON.parse(fs.existsSync(inventoryPath) ? fs.readFileSync(inventoryPath,'utf8')
  : zlib.gunzipSync(fs.readFileSync(inventoryPath+'.gz')).toString('utf8'));
const summary = JSON.parse(fs.readFileSync('docs/evidencias/106-jest-resumen.json','utf8'));
const archived = fs.readFileSync('docs/evidencias/106-jest.json.gz');
if (crypto.createHash('sha256').update(archived).digest('hex') !== summary.archiveSha256) throw new Error('Archive hash mismatch');
const raw = zlib.gunzipSync(archived);
if (crypto.createHash('sha256').update(raw).digest('hex') !== summary.rawSha256) throw new Error('Raw result hash mismatch');
const results = JSON.parse(raw.toString('utf8'));
const unitReferences = new Map();
const normalize = file => file.replaceAll('\\','/');
const resolveModule = (file, name) => {
  if (!name.startsWith('@/') && !name.startsWith('.')) return null;
  const base = name.startsWith('@/') ? path.resolve('src',name.slice(2)) : path.resolve(path.dirname(file),name);
  const found = [base,...['.ts','.tsx','.js','/index.ts','/index.tsx'].map(extension => base + extension)]
    .find(item => fs.existsSync(item) && fs.statSync(item).isFile());
  return found ? normalize(path.relative(process.cwd(),found)) : null;
};
function imports(file) {
  const source = fs.readFileSync(file,'utf8');
  const ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const names = [];
  for (const node of ast.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly)
      names.push(node.moduleSpecifier.text);
  }
  return [...new Set(names.map(name=>resolveModule(file,name)).filter(Boolean))];
}
for (const suite of results.testResults) {
  const name = normalize(suite.name);
  const offset = name.indexOf('/src/');
  const local = offset >= 0 ? name.slice(offset+1) : name.replace(normalize(process.cwd())+'/', '');
  if (!fs.existsSync(local)) continue;
  const record = { suite:local, passed:suite.assertionResults.filter(test=>test.status==='passed').length,
    failed:suite.assertionResults.filter(test=>test.status==='failed').length,
    assertions:suite.assertionResults.map(test=>({title:test.fullName,status:test.status})),
    mocksPresent:/jest\.mock\(|jest\.spyOn\(/.test(fs.readFileSync(local,'utf8')) };
  for (const module of imports(local)) {
    const existing = unitReferences.get(module) || [];
    existing.push(record);
    unitReferences.set(module,existing);
  }
}
const newExecuted = [
  'docs/evidencias/109-permisos-documentos.json','docs/evidencias/109-permisos-documentos-extra.json'
].flatMap(file=>JSON.parse(fs.readFileSync(file,'utf8')).results.filter(row=>row.target)
  .map(row=>({file,route:`/api/${row.target}/:filename`,profile:row.profile,status:row.status,fixtureReturned:row.identicalFixture})));
const matrix = inventory.inventory.map(route => {
  const deps = imports(route.file);
  const direct = unitReferences.get(route.file) || [];
  const dependencyTests = deps.flatMap(file=>(unitReferences.get(file)||[]).map(suite=>({module:file,suite:suite.suite,
    passed:suite.passed,failed:suite.failed,mocksPresent:suite.mocksPresent})));
  return {file:route.file,route:route.route,area:route.area,
    directUnitEvidence:direct,dependencyUnitReferences:dependencyTests,
    e2eReferences:route.e2e.matches,documentReferences:route.documents,
    executed109:newExecuted.filter(row=>row.route===route.route),
    acceptance: 'NOT_GLOBALLY_ACCEPTED',
    interpretation:'A passing dependency test is not proof of this page, its controls or all profiles. Absence of a direct reference is not proof of no previous audit.'};
});
const counts = {routes:matrix.length,directUnitRoutes:matrix.filter(row=>row.directUnitEvidence.length).length,
  dependencyUnitRoutes:matrix.filter(row=>row.dependencyUnitReferences.length).length,
  e2eReferenceRoutes:matrix.filter(row=>row.e2eReferences.length).length,
  explicit109Endpoints:matrix.filter(row=>row.executed109.length).length,
  noAutomaticTestReference:matrix.filter(row=>!row.directUnitEvidence.length && !row.dependencyUnitReferences.length && !row.e2eReferences.length).length};
fs.writeFileSync('docs/evidencias/109-matriz-conciliada.json',JSON.stringify({sourceApp:summary.sourceSha,
  historicJest:{suites:summary.suites,tests:summary.tests,passed:summary.passed,archiveSha256:summary.archiveSha256,reexecuted:false},
  sourceHead:inventory.sourceHead,counts,matrix},null,2)+'\n');
console.log(JSON.stringify(counts));
