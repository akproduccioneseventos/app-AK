import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = 'ef0e9402e90d149d4a8ba8aa4a7399282dfaf039';
const require = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json');
const ts = require('typescript');
const sources = {};
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
};
const read = (file) => {
  const text = git('show', `${source}:${file}`);
  sources[file] = crypto.createHash('sha256').update(text).digest('hex');
  return text;
};
const evaluate = (text, extra = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, ...extra }, { timeout: 3000 });
  return exports;
};
const initializer = (text, file, name) => {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name && node.initializer) found.push(node.initializer.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast); assert.equal(found.length, 1, `${file}:${name}`); return found[0];
};
const cases = [];
const check = (name, run) => { run(); cases.push({ name, status: 'PASS' }); };
const profiles = evaluate(read('src/lib/auth/perfiles.ts'));
for (const profile of ['constructor', 'toString', '__proto__', 'inventado']) check(`reject ${profile}`, () => {
  assert.equal(profiles.esPerfilValido(profile), false);
  assert.equal(profiles.perfilDe({ perfil: profile, role: 'user' }), 'secretaria');
  assert.equal(profiles.puede({ perfil: profile, role: 'user' }, profiles.PERMISOS.ORGANIZACION), true);
});
const valid = Object.keys(profiles.PERMISOS_POR_PERFIL); assert.equal(valid.length, 7);
for (const profile of valid) check(`preserve profile ${profile}`, () => assert.equal(profiles.esPerfilValido(profile), true));
const contact = evaluate(read('src/lib/commercial/contact.ts'));
const template = evaluate(read('src/lib/whatsapp/plantilla-mensaje.ts'));
const agendaFile = 'src/app/(app)/contabilidad/crm/agenda/page.tsx';
const agenda = read(agendaFile);
const reminder = evaluate(`exports.build = ${initializer(agenda, agendaFile, 'buildReminderUrl')}`, {
  toWhatsAppDigits: contact.toWhatsAppDigits, rellenarPlantilla: template.rellenarPlantilla,
  format: require('date-fns').format, es: require('date-fns/locale').es, waSettings: undefined,
}).build;
for (const [phone, digits] of [['099000080', '59899000080'], ['99000080', '59899000080'],
  ['+598 99 000 080', '59899000080'], ['+54 9 11 1234 5678', '5491112345678'], ['23551234', '23551234'], ['', '']]) {
  check(`actual reminder URL ${phone || 'empty'}`, () => {
    const meeting = { phone, name: 'Ana & Peña', followUpDate: '2027-08-08T15:00:00Z' };
    const before = JSON.stringify(meeting);
    const url = new URL(reminder(meeting));
    assert.equal(url.hostname, 'wa.me'); assert.equal(url.pathname, `/${digits}`);
    assert.ok(url.searchParams.get('text').includes(meeting.name));
    assert.equal(JSON.stringify(meeting), before);
  });
}
const kitchenFile = 'src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx';
const kitchen = read(kitchenFile);
const date = evaluate(`exports.format = (hoja) => (${initializer(kitchen, kitchenFile, 'fecha')});`, { Date, Number }).format;
const priorTimezone = process.env.TZ;
try {
  for (const timezone of ['UTC', 'America/Montevideo']) {
    process.env.TZ = timezone;
    assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, timezone);
    for (const [input, expected] of [['2027-08-08', '8/8/2027'], ['2028-02-29', '29/2/2028'],
      ['2027-12-31', '31/12/2027'], ['2028-01-01', '1/1/2028'], ['', ''], [null, ''], [undefined, ''], ['not-a-date', '']]) {
      check(`civil date ${input} ${timezone}`, () => assert.equal(date({ fecha: input }), expected));
    }
  }
} finally {
  if (priorTimezone === undefined) delete process.env.TZ; else process.env.TZ = priorTimezone;
}
const catalog = read('src/app/(app)/empresa/servicios/page.tsx');
check('catalog local text-white class present', () => assert.match(catalog,
  /<CardTitle className="[^"]*text-white[^"]*">[\s\S]{0,120}Ajuste de Costos Global/));
const related = ['src/app/portal/[fiestaId]/contrato/page.tsx', 'src/app/(app)/empresa/red-social-eventos/page.tsx', kitchenFile];
const branchComparisons = [];
for (const candidate of ['b8491bda3f25aadc71f36f42d5878a47261bb1bf', 'c7f9e3e6f960add2f970676819ec87b65b1af7c8']) {
  branchComparisons.push({ candidate, files: related.map((file) => {
    const text = git('show', `${candidate}:${file}`);
    const baseText = git('show', `a98a4b25009f9994d7a9cbd3025972a4142634c2:${file}`);
    return { file, sameAsFailedBaseA98: text === baseText,
      literalOldDateExpression: text.includes("new Date(hoja.fecha).toLocaleDateString('es-UY')") };
  }) });
}
const output = { source, pr: 1328, sources, cases, pass: cases.length, fail: 0, branchComparisons,
  scope: 'Actual Git source pure modules and AST-extracted page expressions, no browser/build/live services',
  limits: ['No native layout, production authorization or HTTP retest', 'Title class is structural only',
    'PR1329/1330 comparison is direct consumers only, not whole-PR approval',
    'Low RAM380272KiB observed; no new browser/build started; no other processes stopped'] };
fs.writeFileSync(path.join(root, 'docs/evidencias/146-regresiones-ligeras.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ source, pass: output.pass, fail: 0, branchComparisons }));
