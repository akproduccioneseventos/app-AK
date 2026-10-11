import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve('docs/evidencias');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8').replace(/^\uFEFF/, ''));
const build = read('105-build-execution.json');
const types = read('105-types-execution.json');
const jest = read('105-jest-resumen.json');
const sha = build.sha;
if (build.exitCode !== 0 || build.status !== 'finished' || types.exitCode !== 0 || types.sha !== sha ||
    !jest.success || jest.sha !== sha || jest.failed !== 0 || jest.pending !== 0 || jest.passed !== 4135) throw new Error('Incomplete build/types/Jest acceptance');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (hash(fs.readFileSync(path.join(root, jest.archive))) !== jest.archiveSha256) throw new Error('Jest archive changed');
const browser = {};
for (const [name, expected] of [['3d', 4], ['compat', 8], ['sdk', 10]]) {
  const result = read(`105-${name}-resumen.json`);
  const execution = read(`105-${name}-execution.json`);
  if (result.sourceSha !== sha || result.stats.expected !== expected || result.stats.unexpected !== 0 ||
      result.stats.skipped !== 0 || result.stats.flaky !== 0 || result.results.length !== expected ||
      result.results.some(test => test.status !== 'passed') || execution.exitCode !== 0 || execution.applicationSourceSha !== sha) throw new Error(`Browser acceptance failed: ${name}`);
  const diff = execFileSync('git', ['diff', '--name-only', sha, execution.sha], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  if (diff.some(file => !file.startsWith('tests/e2e/'))) throw new Error('Browser harness changed application code');
  browser[name] = { passed: expected, failed: 0, sourceSha: sha, harnessSha: execution.sha, evidence: `105-${name}-resumen.json` };
}
const health = read('105-health.json');
if (!health.version.startsWith(sha)) throw new Error('Health is not the compiled source');
const server = read('105-runtime-detenido.json'), emulator = read('105-emulator-detenido.json');
if (!server.stopped || !emulator.stopped || !emulator.verifiedNoListener) throw new Error('Own runtime not stopped');
const audit = read('105-npm-audit.json');
const graphify = read('105-graphify.json');
if (graphify.exitCode !== 0 || graphify.applicationSourceSha !== sha) throw new Error('Graph evidence is not this application source');
const advisories = new Set(Object.values(audit.vulnerabilities).flatMap(item => item.via.filter(via => typeof via === 'object').map(via => via.url)));
const artifacts = fs.readdirSync(path.join(root, '105-artifactos')).sort().map(name => {
  const bytes = fs.readFileSync(path.join(root, '105-artifactos', name));
  return { file: `105-artifactos/${name}`, bytes: bytes.length, sha256: hash(bytes) };
});
const output = {
  applicationSourceSha: sha, baseMainSha: '99faf4eb061fa46341cfdde6f81b93b3bfb9c73c',
  build: { exitCode: 0, log: '105-build.log', lintAndTypesSkipped: false, pwaEnabled: true, standaloneDisabledForLocalQA: true },
  types: { exitCode: 0, evidence: '105-types-execution.json' },
  jest: { suites: jest.suites, passed: jest.passed, failed: 0, pending: 0, evidence: '105-jest-resumen.json' },
  browser, artifacts,
  graphify,
  security: { counts: audit.metadata.vulnerabilities, uniqueAdvisories: advisories.size, evidence: '105-npm-audit.json', allResolved: false },
  runtime: { isolated: true, realBusinessWrites: 0, stopped: true, cleanup: '105-limpieza.json' },
  notCertified: ['Every button, permission and variant', 'Mobile 3D help overlaps floating controls', 'Remaining dependency advisories', '19 original manual budgets', 'Live provider accounts and paid AI', 'Firebase packaging and production deployment', 'Physical event hardware'],
};
fs.writeFileSync(path.join(root, '105-validacion.json'), JSON.stringify(output, null, 2));
console.log(JSON.stringify({ sha, jest: output.jest, browserPassed: 22, uniqueAdvisories: advisories.size, artifacts: artifacts.length }, null, 2));
