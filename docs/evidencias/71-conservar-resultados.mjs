import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const sha = 'e52c07839563115236652229d73ac5ebf2e4e551';
const application = ['src/app', 'src/lib', 'src/components', 'src/hooks', 'src/types', 'tests', 'scripts', 'package.json', 'package-lock.json'];
if (execFileSync('git', ['diff', '--name-only', sha, '--', ...application], { encoding: 'utf8' }).trim()) {
  throw new Error('La fuente difiere del SHA auditado.');
}
const runtime = path.resolve(root, '../audit-runtime-results-20261002');
const out = path.join(root, 'docs/evidencias/71-resultados');
fs.mkdirSync(out, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--refresh-probes')) {
  const filename = path.join(out, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
  manifest.probes = ['71-sonda-campos-y-compras.cjs', '71-auto-probe.cjs'].map(name => {
    const raw = execFileSync(process.execPath, [path.join(root, 'docs/evidencias', name)], { cwd: root, encoding: 'utf8' });
    return { command: `node docs/evidencias/${name}`, observations: raw.trim().split(/\r?\n/).map(JSON.parse) };
  });
  fs.writeFileSync(filename, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest.probes));
  process.exit(0);
}
if (process.argv.includes('--pending')) {
  const pendingRoot = path.resolve(root, '../.audit-pr1259-20261006');
  const pendingSha = 'f836c128cfad861a55a2352782f18c805b55e13a';
  if (execFileSync('git', ['diff', '--name-only', pendingSha, '--', ...application], { cwd: pendingRoot, encoding: 'utf8' }).trim()) throw new Error('La tanda difiere del SHA.');
  const raw = fs.readFileSync(path.join(runtime, 'jest-mocked.json'));
  const report = JSON.parse(raw);
  if (!report.testResults.every(suite => suite.name.startsWith(pendingRoot))) throw new Error('Resultado no pertenece a la tanda.');
  fs.writeFileSync(path.join(out, 'pr1259-focalizada.json.gz'), gzipSync(raw));
  const filename = path.join(out, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
  manifest.pendingRun = { sourceCommit: pendingSha, started: new Date(report.startTime).toISOString(), artifact: 'pr1259-focalizada.json.gz', sha256Uncompressed: digest(raw),
    suites: report.numTotalTestSuites, passedSuites: report.numPassedTestSuites, tests: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests,
    suiteFiles: report.testResults.map(suite => path.relative(pendingRoot, suite.name).replaceAll('\\', '/')),
    note: 'Cuatro suites unitarias de la rama pendiente; no es build, E2E ni validacion de microfono, camara o proveedor. Primer intento sin junction de dependencias fallo en entorno; se corrigio solo el enlace local y se repitio.',
  };
  fs.writeFileSync(filename, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest.pendingRun));
  process.exit(0);
}
const artifacts = [
  ['principal', path.join(runtime, 'jest-mocked.json')],
  ['focalizada-plata', path.join(runtime, 'archive/1791301419295-jest-mocked.json')],
];
const runs = artifacts.map(([name, filename]) => {
  const raw = fs.readFileSync(filename);
  const report = JSON.parse(raw);
  if (!report.testResults.every(suite => suite.name.startsWith(root))) throw new Error('Resultado de otro checkout.');
  fs.writeFileSync(path.join(out, `${name}.json.gz`), gzipSync(raw));
  return { name, started: new Date(report.startTime).toISOString(), artifact: `${name}.json.gz`, sha256Uncompressed: digest(raw),
    suites: report.numTotalTestSuites, passedSuites: report.numPassedTestSuites,
    tests: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests, pending: report.numPendingTests,
    command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --silent' + (name === 'principal' ? '' : ' --maxWorkers=1 --runTestsByPath (cinco suites consignadas en el informe)'),
  };
});
const probes = ['71-sonda-campos-y-compras.cjs', '71-auto-probe.cjs'].map(name => {
  const raw = execFileSync(process.execPath, [path.join(root, 'docs/evidencias', name)], { cwd: root, encoding: 'utf8' });
  return { command: `node docs/evidencias/${name}`, observations: raw.trim().split(/\r?\n/).map(JSON.parse) };
});
const sourceFiles = ['src/app/actions/fiesta/fiesta.actions.ts', 'src/app/actions/fiesta/catering.actions.ts', 'src/lib/auth/perfiles.ts', 'src/lib/fiesta/recortar-para-afuera.ts', 'src/app/actions/social-media.ts', 'src/lib/generic-json-store.ts', 'src/lib/automatico/al-entrar-a-la-app.ts', 'src/lib/presencia-digital/publicador.ts'];
const manifest = { sourceCommit: sha, recordedAt: new Date().toISOString(), environment: 'isolated fake authentication and storage; no production credentials',
  runs, countsNote: 'Las 56 pruebas focalizadas estan incluidas en las 3490 de la corrida principal; no se suman.', probes,
  sourceBlobs: Object.fromEntries(sourceFiles.map(file => [file, execFileSync('git', ['rev-parse', `${sha}:${file}`], { encoding: 'utf8' }).trim()])),
  browser: { state: 'not-executed', reason: 'Computer Use stopped: could not determine current browser URL on Windows with enough confidence to enforce policy.', target: 'not navigated', applicationDefect: false },
  notVerified: ['latest build and deployment SHA', 'complete role-based browser journeys', 'real Firestore race', 'external providers', '19 imported budgets', 'physical devices'],
};
fs.writeFileSync(path.join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ sourceCommit: sha, runs, probes: probes.map(probe => ({ command: probe.command, observations: probe.observations.length })) }));
