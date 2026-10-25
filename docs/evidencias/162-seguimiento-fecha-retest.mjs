import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = '108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const script = fileURLToPath(import.meta.url);
if (process.argv.includes('--child')) {
  const ts = createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
  const hashes = {};
  const body = (file, name) => {
    const p = spawnSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' }); assert.equal(p.status, 0, p.stderr);
    hashes[file] = crypto.createHash('sha256').update(p.stdout).digest('hex');
    const ast = ts.createSourceFile(file, p.stdout, ts.ScriptTarget.Latest, true);
    const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name); assert.ok(fn, name);
    return ts.transpileModule(fn.getText(ast), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  };
  const formatter = {}; vm.runInNewContext(body('src/lib/fechas/formato-fecha-evento.ts','formatearFechaEvento'), { exports: formatter, Date, Number }, { timeout: 3000 });
  const code = body('src/lib/agentes/motor-agentes.ts','ejecutarPerseguidorPresupuestos');
  const cases = [];
  for (const days of [6,15]) for (const date of ['2027-08-08','2027-08-08 de 21 a 04 hs']) {
    const now = new Date('2026-10-21T15:00:00Z'); let drafts = [];
    const budget = { id: `qa162-${days}`, estado: 'Enviado', clienteNombre: 'Cliente ficticio QA162', clienteContacto: '00000000',
      eventoFecha: date, eventoTipo: 'Evento ficticio', timestamp: new Date(now.getTime() - days * 86400000).toISOString() };
    const exports = {}; vm.runInNewContext(code, { exports, Date, Math, isNaN, ...formatter,
      readData: async name => name === 'presupuestos.json' ? [budget] : drafts,
      writeData: async (name, value) => { assert.equal(name, 'scheduled-messages.json'); drafts = structuredClone(value); },
      registrarEjecucionAgente: async () => {},
    }, { timeout: 3000 });
    await exports.ejecutarPerseguidorPresupuestos(now); assert.equal(drafts.length, 1, 'An actual draft must be prepared');
    const text = drafts[0].messageText;
    cases.push({ timezone: process.env.TZ, days, date, pass: text.includes('8 de agosto de 2027') &&
      !text.includes('7 de agosto de 2027') && (!date.includes('de 21') || text.includes('de 21 a 04 hs')), messageText: text });
  }
  console.log(JSON.stringify({ timezone: process.env.TZ, hashes, cases }));
  process.exitCode = cases.some(c => !c.pass) ? 1 : 0;
} else {
  const target = new URL('162-seguimiento-fecha-retest.json', import.meta.url); assert.equal(fs.existsSync(target), false, 'Preserve receipt');
  const env = Object.fromEntries(['PATH','SystemRoot','WINDIR','COMSPEC','TEMP','TMP'].filter(k => process.env[k]).map(k => [k,process.env[k]]));
  const runs = ['UTC','America/Montevideo'].map(TZ => {
    const p = spawnSync(process.execPath, ['--max-old-space-size=192',script,'--child'], { cwd: root, env: { ...env, TZ }, encoding: 'utf8', timeout: 60000 });
    assert.ok(p.status === 0 || p.status === 1, p.stderr || String(p.error)); assert.ok(p.stdout.trim(), 'No zero-case PASS');
    return { exitCode: p.status, stderr: p.stderr, ...JSON.parse(p.stdout) };
  });
  const cases = runs.flatMap(r => r.cases); assert.equal(cases.length, 8);
  const result = { source, testSha256: crypto.createHash('sha256').update(fs.readFileSync(script)).digest('hex'), runs,
    summary: { total: cases.length, pass: cases.filter(c => c.pass).length, fail: cases.filter(c => !c.pass).length },
    scope: 'Actual draft-generator and formatter, 5day/14day branches, UTC/Uruguay, civil date with and without human time suffix',
    limits: ['Fictitious message/budget storage and log; no delivery, HTTP, database, model or production', 'Claude public108e candidate, not main9b7'], appEdited: false };
  fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ source, summary: result.summary }));
  if (result.summary.fail) process.exitCode = 1;
}
