import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const sourceCommit = 'feb90f4d40906029d6d31ba2e2abbed64461a2ad';
const sourcePaths = ['src/app', 'src/lib', 'src/components', 'src/hooks', 'src/types', 'src/middleware.ts', 'tests', 'scripts', 'package.json', 'package-lock.json', 'next.config.ts', 'next.config.mjs', 'apphosting.yaml', 'tailwind.config.ts', 'tsconfig.json'];
for (const args of [
  ['diff', '--name-only', sourceCommit, 'HEAD', '--', ...sourcePaths],
  ['diff', '--name-only', 'HEAD', '--', ...sourcePaths],
  ['ls-files', '--others', '--exclude-standard', '--', ...sourcePaths],
]) {
  if (execFileSync('git', args, { encoding: 'utf8' }).trim()) throw new Error('Application or test source differs from the audited SHA.');
}
const input = path.resolve(root, '..', 'audit-runtime-results-20261002');
const output = path.join(root, 'docs', 'evidencias', '69-resultados');
fs.mkdirSync(output, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = { sourceCommit, environment: 'isolated-local-json-no-production-credentials', generated: new Date().toISOString(), runs: [] };
const devLog = path.join(input, 'dev.log');
if (fs.existsSync(devLog)) {
  const restarts = fs.readFileSync(devLog, 'utf8').split('\n').flatMap((line, index) => line.includes('Server is approaching the used memory threshold, restarting') ? [{ line: index + 1, message: line.trim() }] : []);
  manifest.developmentDiagnostics = { mode: 'Next development, NOT production', heapLimitMB: 3072, restarts, meaning: 'Development server instability invalidates broad browser acceptance; no production memory conclusion.' };
}
const suiteSets = [];
for (const name of ['jest', 'jest-mocked']) {
  const raw = fs.readFileSync(path.join(input, `${name}.json`));
  const result = JSON.parse(raw.toString('utf8'));
  fs.writeFileSync(path.join(output, `${name}.json.gz`), gzipSync(raw));
  const suites = result.testResults.map(suite => ({
    file: path.relative(root, suite.name).replaceAll('\\', '/'), status: suite.status,
    tests: suite.assertionResults.map(test => ({ name: test.fullName, status: test.status })),
  }));
  suiteSets.push(suites);
  const args = ['node', 'docs/evidencias/sondas/64-isolated-audit-runner.mjs', '.', name, '--silent'];
  if (name === 'jest-mocked') args.push('--maxWorkers=1', '--runTestsByPath', ...suites.map(suite => suite.file));
  const failures = suites.filter(suite => suite.status !== 'passed').map(suite => ({ file: suite.file, failedTests: suite.tests.filter(test => test.status === 'failed') }));
  manifest.runs.push({ name, command: args, started: new Date(result.startTime).toISOString(), artifact: `${name}.json.gz`, sha256Uncompressed: digest(raw), reported: { suites: result.numTotalTestSuites, passedSuites: result.numPassedTestSuites, tests: result.numTotalTests, passed: result.numPassedTests, failed: result.numFailedTests }, failures });
}
// The second run replaces only matching suites; it is not additional coverage.
const combined = new Map(suiteSets[0].map(suite => [suite.file, suite]));
for (const suite of suiteSets[1]) {
  if (!combined.has(suite.file)) throw new Error(`Retest is not part of the original run: ${suite.file}`);
  combined.set(suite.file, suite);
}
const suites = [...combined.values()];
manifest.combined = { suites: suites.length, passedSuites: suites.filter(s => s.status === 'passed').length, tests: suites.reduce((n, s) => n + s.tests.length, 0), passed: suites.reduce((n, s) => n + s.tests.filter(t => t.status === 'passed').length, 0), failed: suites.reduce((n, s) => n + s.tests.filter(t => t.status === 'failed').length, 0) };
const probe = execFileSync(process.execPath, ['docs/evidencias/69-sonda-puertas-generales-fiesta.cjs'], { encoding: 'utf8' });
manifest.securityProbe = { command: 'node docs/evidencias/69-sonda-puertas-generales-fiesta.cjs', meaning: 'reproduces faults, NOT acceptance', observations: probe.trim().split('\n').map(line => JSON.parse(line)) };
const dateProbe = execFileSync(process.execPath, ['docs/evidencias/69-sonda-fecha-portal.cjs'], { encoding: 'utf8' });
manifest.portalDateProbe = { command: 'node docs/evidencias/69-sonda-fecha-portal.cjs', meaning: 'reproduces fault, NOT acceptance', observation: JSON.parse(dateProbe) };
manifest.manualBrowser = {
  transport: 'CUA in-app browser', target: 'http://127.0.0.1:3311', fixture: 'ak_audit69_portal',
  passed: ['client valid login', 'client tabs Progreso/Invitados/Pagos', 'synthetic balance 335000 - 0 = 335000', 'guest personalized link and table/QR visible', 'guest date displays today', 'drink menu and ingredients opens', 'guest social wall opens', 'photo/video and dedication forms accessible'],
  notConfirmed: ['QR download', 'upload', 'dedication persistence: local JSON mode disables Firestore', 'bar order/queue/delivery', 'check-in', 'real external integrations', 'physical devices'],
  floatingOverlap: { assistant: { x: 374, y: 500, width: 206, height: 56 }, help: { x: 468, y: 512, width: 176, height: 44 }, intersection: { width: 112, height: 44 } },
};
const browserPath = path.join(input, 'e2e.log');
try {
  const raw = fs.readFileSync(browserPath);
  const result = JSON.parse(raw.toString('utf8'));
  fs.writeFileSync(path.join(output, 'e2e.json.gz'), gzipSync(raw));
  manifest.browser = { state: 'completed', artifact: 'e2e.json.gz', sha256Uncompressed: digest(raw), stats: result.stats };
} catch {
  const testResults = path.join(root, 'test-results');
  const previousErrors = path.join(output, 'browser-incomplete-errors.json');
  const errors = fs.existsSync(previousErrors) ? JSON.parse(fs.readFileSync(previousErrors, 'utf8')) : [];
  if (fs.existsSync(testResults)) {
    for (const folder of fs.readdirSync(testResults)) {
      const context = path.join(testResults, folder, 'error-context.md');
      if (!fs.existsSync(context)) continue;
      if (!errors.some(error => error.folder === folder)) errors.push({ folder, context: fs.readFileSync(context, 'utf8') });
    }
  }
  fs.writeFileSync(path.join(output, 'browser-incomplete-errors.json'), `${JSON.stringify(errors, null, 2)}\n`);
  manifest.browser = { state: 'interrupted', started: '2026-10-05T22:46:10Z', stopped: '2026-10-05T23:15:36Z', command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . e2e --reporter=json', artifact: 'browser-incomplete-errors.json', reason: 'Repeated 90-second timeouts and cold route compilation; no complete browser JSON report. NOT passing, not yet attributed to product bugs.' };
}
fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ sourceCommit, combined: manifest.combined, browser: manifest.browser }));
