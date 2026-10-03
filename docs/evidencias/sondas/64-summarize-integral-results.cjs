const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const [root, results, destination] = process.argv.slice(2);
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const runs = [];
for (const name of ['jest.json', 'jest-mocked.json', 'public-simulator-e2e.json',
  'e2e-desktop-second.json', 'e2e-desktop-retry.json', 'roles-core.json', 'roles-core-retry.json']) {
  const file = path.join(results, name);
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const run = { file: name, sha256: digest(file) };
  if (name.startsWith('jest')) {
    Object.assign(run, { environment: name === 'jest.json' ? 'isolated-local-json' : 'suite-provided-mocks',
      totalSuites: data.numTotalTestSuites, passedSuites: data.numPassedTestSuites, failedSuites: data.numFailedTestSuites,
      totalTests: data.numTotalTests, passedTests: data.numPassedTests, failedTests: data.numFailedTests,
      startTime: new Date(data.startTime).toISOString(),
      suites: data.testResults.map(s => ({ file: path.relative(root, s.name).replace(/\\/g, '/'), status: s.status,
        passed: s.assertionResults.filter(t => t.status === 'passed').length,
        failed: s.assertionResults.filter(t => t.status === 'failed').map(t => t.fullName) })) });
  } else {
    const tests = [];
    const walk = suites => { for (const suite of suites || []) {
      for (const spec of suite.specs || []) for (const t of spec.tests || []) {
        tests.push({ file: spec.file, line: spec.line, title: spec.title, project: t.projectName, status: t.status,
          attempts: t.results.map(r => ({ status: r.status, duration: r.duration, errors: r.errors?.map(e => e.message) || [] })) });
      }
      walk(suite.suites);
    } };
    walk(data.suites);
    Object.assign(run, { environment: 'isolated-windows-next-dev', stats: data.stats, tests });
  }
  runs.push(run);
}
const movement = JSON.parse(fs.readFileSync(path.join(results, 'movement-trace.json'), 'utf8'));
const testKey = test => JSON.stringify([test.file, test.line, test.title, test.project]);
const baseline = runs.find(run => run.file === 'e2e-desktop-second.json');
const latest = new Map();
for (const run of runs) for (const test of run.tests || []) {
  if (test.attempts.some(attempt => attempt.status !== 'skipped')) latest.set(testKey(test), test);
}
const selected = new Set(baseline.tests.map(testKey));
const coverage = { selectedDesktop: selected.size, uniqueExecutedDesktop: [...selected].filter(key => latest.has(key)).length,
  notExecutedDesktop: [...selected].filter(key => !latest.has(key)).length,
  latestFailures: [...latest.values()].filter(test => test.status === 'unexpected').map(({file,line,title}) => ({file,line,title})) };
const evidence = { sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  generatedAt: new Date().toISOString(), fullBuildExecuted: false, realFirebaseVerified: false,
  realHardwareVerified: false, note: 'Different environments and overlapping retries are not a single full release approval.',
  coverage, runs, movement };
fs.writeFileSync(destination, JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ destination, coverage, runs: runs.map(({file,stats,totalTests,passedTests,failedTests}) => ({file,stats,totalTests,passedTests,failedTests})) }));
