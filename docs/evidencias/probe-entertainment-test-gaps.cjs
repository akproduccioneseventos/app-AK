const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2]);
const ts = require(path.join(root, 'node_modules/typescript'));
const file = 'tests/e2e/la-fotocabina-tiene-todo.spec.ts';
const source = fs.readFileSync(path.join(root, file), 'utf8');
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
let statements;
function visit(node) {
  if (ts.isBlock(node)) {
    const index = node.statements.findIndex((s) => ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => d.name.getText(ast) === 'avisoDuracion'));
    if (index >= 0) statements = node.statements.slice(index).map((s) => s.getText(ast)).join('\n');
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(statements, 'Target result assertions must exist');
const js = ts.transpileModule('(async () => {\n' + statements + '\n})()', { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
async function run(visible) {
  let durationChecks = 0;
  const locator = { isVisible: async () => visible, getAttribute: async () => null };
  await vm.runInNewContext(js, {
    page: { locator: () => locator },
    expect: (actual) => ({
      toBeVisible: async () => { if (!visible) throw new Error('No final video'); },
      toContainText: async () => {},
      toBeGreaterThan: (other) => { durationChecks++; assert.ok(actual > other); },
    }),
  });
  return { scenario: visible ? 'visible notice but both duration attributes missing' : 'final notice/video absent', testBlockAccepted: true, durationChecks };
}
(async () => {
  console.log(JSON.stringify({ file, scope: 'Negative control of existing assertion block; no browser, no app execution', cases: [await run(false), await run(true)] }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });

