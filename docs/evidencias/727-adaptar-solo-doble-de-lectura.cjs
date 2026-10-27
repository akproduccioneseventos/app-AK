const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const qa = process.argv[2];
if (!qa || !path.basename(qa).startsWith('ak-qa-725-contabilidad-')) throw Error('QA aislado requerido');
const ts = require(path.join(qa, 'node_modules/typescript'));
const files = ['dos-cobros-a-la-vez-no-se-pisan', 'una-sena-de-contrato-es-una-por-presupuesto'];
const records = [];
function assertions(text) {
  const source = ts.createSourceFile('qa.ts', text, ts.ScriptTarget.Latest, true);
  const found = [];
  function visit(n) {
    if (ts.isCallExpression(n) && n.expression.getText(source) === 'expect') found.push(n.parent.getText(source));
    ts.forEachChild(n, visit);
  }
  visit(source);
  return found;
}
for (const name of files) {
  const original = path.join(qa, 'src/__tests__', `${name}.test.ts`);
  const text = fs.readFileSync(original, 'utf8');
  const source = ts.createSourceFile(original, text, ts.ScriptTarget.Latest, true);
  let object;
  function visit(n) {
    if (ts.isCallExpression(n) && n.expression.getText(source) === 'jest.mock'
      && ts.isStringLiteral(n.arguments[0]) && n.arguments[0].text === '@/lib/data-service') {
      const body = n.arguments[1].body;
      object = ts.isParenthesizedExpression(body) ? body.expression : body;
    }
    ts.forEachChild(n, visit);
  }
  visit(source);
  if (!object || !ts.isObjectLiteralExpression(object)) throw Error('Factory no encontrada');
  if (object.properties.some(p => p.name?.getText(source) === 'readDataConDetalle')) throw Error('Ya adaptada');
  const pos = object.properties[0].getFullStart();
  const adapter = '\n  readDataConDetalle: jest.fn(async (...args: any[]) => ({ valor: await require(\'@/lib/data-service\').readData(...args), huboFalla: false })),\n';
  const adapted = text.slice(0, pos) + adapter + text.slice(pos);
  if (JSON.stringify(assertions(text)) !== JSON.stringify(assertions(adapted))) throw Error('Aserciones cambiadas');
  const target = path.join(qa, 'src/__tests__', `qa-727-${name}.test.ts`);
  fs.writeFileSync(target, adapted);
  records.push({ original, target, sha256: crypto.createHash('sha256').update(adapted).digest('hex'), assertionsUnchanged: assertions(text).length });
}
fs.writeFileSync(path.join(__dirname, '727-adaptacion.json'), JSON.stringify({ records, limits: 'SOLO diagnostico de fixtures; no sustituye recibo original725 ni es suite canonica sin cambios' }, null, 2));
console.log(JSON.stringify(records));
