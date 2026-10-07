const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const sha = 'f790a002426aecb6598efa239fa948db57571752';
const read = file => execFileSync('git', ['show', `${sha}:${file}`], { cwd: root }).toString('utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fixturePath = path.resolve(process.argv[2] || '');
assert(fixturePath.startsWith(`${path.resolve(process.env.TEMP)}${path.sep}ak-entorno-aislado-`), 'Only the disposable AK environment is allowed');
assert(fixturePath.endsWith(`${path.sep}data${path.sep}fiestas${path.sep}e2e_entorno_aislado.json`), 'Only the explicitly isolated fixture is allowed');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
assert.equal(fixture.id, 'e2e_entorno_aislado');

const portalPath = 'src/app/portal-cliente/[id]/page.tsx';
const centroPath = 'src/app/(app)/fiestas/[id]/centro/page.tsx';
const leadPath = 'src/lib/crm/public-lead-persistence.ts';
const parse = file => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const portal = parse(portalPath);
const centro = parse(centroPath);
const leads = parse(leadPath);
const expressions = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['confirmed', 'pending', 'checkedIn'].includes(node.name.getText(portal))) {
    assert(!expressions[node.name.getText(portal)], 'Ambiguous portal counter');
    expressions[node.name.getText(portal)] = node.initializer.getText(portal);
  }
  ts.forEachChild(node, visit);
}
visit(portal);
const countFunction = centro.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'contarPersonas');
assert(countFunction);
const buildLead = leads.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'buildLead');
let dateExpression;
function visitLead(node) {
  if (ts.isPropertyAssignment(node) && node.name.getText(leads) === 'followUpDate') dateExpression = node.initializer.getText(leads);
  ts.forEachChild(node, visitLead);
}
visitLead(buildLead);
assert(dateExpression);
const actual = {};
const code = `${countFunction.getText(centro)}
  exports.confirmedRows = (${expressions.confirmed}).length;
  exports.pendingRows = (${expressions.pending}).length;
  exports.confirmedPeople = contarPersonas(invitados, i => i.rsvp === 'Confirmado');
  exports.pendingPeople = contarPersonas(invitados, i => i.rsvp !== 'Confirmado' && i.rsvp !== 'Rechazado');
  exports.dateWithoutMeeting = ${dateExpression};`;
vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports: actual, invitados: fixture.invitados, existing: undefined, input: { eventDate: '2027-01-23T03:00:00.000Z' } });
assert.equal(actual.confirmedRows, 61);
assert.equal(actual.confirmedPeople, 121);
assert.equal(actual.dateWithoutMeeting, '2027-01-23T03:00:00.000Z');
const result = { meaning: 'Passing assertions reproduce count/date mismatches, not acceptance.', sourceCommit: sha,
  portal: { confirmedRows: actual.confirmedRows, confirmedPeople: actual.confirmedPeople,
    pendingRows: actual.pendingRows, pendingPeople: actual.pendingPeople },
  crm: { eventDate: actual.dateWithoutMeeting, followUpDateWithoutBooking: actual.dateWithoutMeeting },
  sourceHashes: { portal: hash(read(portalPath)), centro: hash(read(centroPath)), leadPersistence: hash(read(leadPath)) },
  inputs: ['isolated fixture only; no real data', 'actual extracted filters/count/date expression'],
  limitations: ['not the complete React rendering', 'not the complete lead persistence function', 'no Firebase/provider evidence'] };
fs.writeFileSync(path.join(__dirname, '78-resultados/contadores.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
