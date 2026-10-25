import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReport, mergeHistories } from './276-normalizar-casos.mjs';

function reportFor(specs) {
  return { suites: [{ title: 'suite', specs }] };
}

function spec(title, options = {}) {
  return {
    id: options.id,
    title,
    file: options.file ?? 'ak207-src/a.spec.ts',
    line: options.line ?? 12,
    column: options.column ?? 3,
    tests: [{ projectName: options.project ?? 'chromium', status: options.outcome ?? 'expected', annotations: options.annotations ?? [], results: options.results ?? [{ status: options.status ?? 'passed' }] }],
  };
}

test('different generated titles at the same file and line remain separate', () => {
  const cases = normalizeReport(reportFor([spec('generated A'), spec('generated B')]), 'run');
  assert.equal(cases.length, 2);
  assert.notEqual(cases[0].identity, cases[1].identity);
});

test('projects distinguish cases', () => {
  const cases = normalizeReport(reportFor([spec('same', { project: 'chromium' }), spec('same', { project: 'firefox' })]), 'run');
  assert.equal(cases.length, 2);
  assert.notEqual(cases[0].identity, cases[1].identity);
});

test('declared skip and fixme are distinct and never executed', () => {
  const cases = normalizeReport(reportFor([
    spec('skip', { status: 'skipped', annotations: [{ type: 'skip', description: 'conditional' }] }),
    spec('fixme', { status: 'skipped', annotations: [{ type: 'fixme', description: 'known issue' }] }),
  ]), 'run');
  assert.deepEqual(cases.map(({ kind, executed }) => [kind, executed]), [['skip', false], ['fixme', false]]);
  assert.ok(cases.every((item) => item.acceptance === false));
});

test('interrupted and missing statuses are not executed', () => {
  const interrupted = spec('interrupted', { status: 'interrupted' });
  const missing = spec('missing');
  missing.tests[0].results = [];
  const cases = normalizeReport(reportFor([interrupted, missing]), 'run');
  assert.deepEqual(cases.map(({ kind, executed }) => [kind, executed]), [['interrupted', false], ['not-run', false]]);
});

test('same case merges attempts and retains earlier failure after pass', () => {
  const failed = normalizeReport(reportFor([spec('case', { id: 'stable', status: 'failed', results: [{ status: 'failed', errors: [{ message: 'boom' }] }] })]), 'r1');
  const passed = normalizeReport(reportFor([spec('case', { id: 'stable', status: 'passed' })]), 'r2');
  const [merged] = mergeHistories(failed, passed);
  assert.equal(merged.history.length, 2);
  assert.equal(merged.history[0].status, 'failed');
  assert.equal(merged.history[1].status, 'passed');
  assert.equal(merged.history[0].errors[0].message, 'boom');
  assert.equal(merged.acceptance, false);
});

test('strips ak207 prefix and does not mutate source report', () => {
  const input = reportFor([spec('case')]);
  const before = structuredClone(input);
  const [item] = normalizeReport(input, 'run');
  assert.equal(item.sourceFile, 'src/a.spec.ts');
  assert.deepEqual(input, before);
});

test('actual Playwright schema: project and result status are on each test', () => {
  const input = reportFor([{ id: 'shared-spec', file: 'ak207-real.spec.ts', title: 'same source', tests: [
    { projectName: 'desktop', status: 'expected', results: [{ status: 'passed' }] },
    { projectName: 'mobile', status: 'unexpected', results: [{ status: 'failed', error: { message: 'real error field' } }] },
  ] }]);
  const cases = normalizeReport(input, 'real-shape');
  assert.deepEqual(cases.map(c => [c.project,c.status,c.executed]), [['desktop','passed',true],['mobile','failed',true]]);
  assert.notEqual(cases[0].identity,cases[1].identity);
  assert.equal(cases[1].errors[0].message,'real error field');
});

test('an expected outcome without results is not an executed case', () => {
  const [item] = normalizeReport(reportFor([spec('not started', { results: [] })]), 'run');
  assert.equal(item.executed,false);
  assert.equal(item.kind,'not-run');
});
