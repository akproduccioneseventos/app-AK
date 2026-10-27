const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const repo = path.resolve(__dirname, '../..');
const sha = '092906d666d73d3e895f8d3126e9f51bc18d72b1';
const qa = process.argv[2];
if (!qa) throw new Error('Pass isolated QA export directory');
const files = [
  'src/components/portal/AsistenteDelCliente.tsx',
  'src/lib/asistente/sesion-voz-en-vivo.ts',
  'src/lib/asistente/voz-en-vivo.ts',
  'src/app/api/asistente/voz-en-vivo/cliente/route.ts',
  'src/app/(app)/fiestas/nueva/pagina-web/page.tsx',
  'src/app/actions/fiesta/armar-web-con-ia.actions.ts',
  'src/__tests__/la-voz-del-cliente-habla-de-verdad.test.ts',
  'src/__tests__/la-ia-arma-la-web-sin-inventar.test.ts',
  'jest.config.js', 'jest.setup.js', 'package.json', 'tsconfig.json', 'next.config.js',
];
const source = files.map(file => {
  const git = cp.execFileSync('git', ['show', `${sha}:${file}`], { cwd: repo });
  const disk = fs.readFileSync(path.join(qa, file));
  const sameAfterCRLF = git.toString('utf8').replace(/\r\n/g, '\n') === disk.toString('utf8').replace(/\r\n/g, '\n');
  return { file, exact: git.equals(disk), sameAfterCRLF, sha256: crypto.createHash('sha256').update(git).digest('hex'), qaSha256: crypto.createHash('sha256').update(disk).digest('hex') };
});
const resultFiles = ['709-pr1368-jest-resultados.json', '711-pr1368-regresiones-voz-resultados.json', '712-pr1368-portal-ciclo-resultados-inicial.json'];
const tests = resultFiles.map(file => {
  const r = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
  return { file, suites: r.numPassedTestSuites, pass: r.numPassedTests, fail: r.numFailedTests, pending: r.numPendingTests, success: r.success };
});
const extraTestExact = fs.readFileSync(path.join(qa, 'src/__tests__/qa-712-portal-ciclo.test.tsx')).equals(fs.readFileSync(path.join(__dirname, '712-pr1368-portal-ciclo.test.tsx')));
const report = { sha, qa, node: process.version, source, extraTestExact, tests, dependencies: 'Reused node_modules junction; not clean npm ci', scope: 'Focused Jest, ReactDOM and AST/action probes only; no build/native browser/external provider acceptance' };
fs.writeFileSync(path.join(__dirname, '714-pr1368-procedencia.json'), JSON.stringify(report, null, 2) + '\n');
const ok = source.every(s => s.sameAfterCRLF) && extraTestExact && tests.every(t => t.success && !t.fail && !t.pending);
console.log(JSON.stringify({ sha, sourceExact: source.every(s => s.exact), sourceSameAfterCRLF: source.every(s => s.sameAfterCRLF), extraTestExact, tests, ok }));
process.exitCode = ok ? 0 : 1;
