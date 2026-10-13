import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const root = path.resolve('docs/evidencias');
const sourceSha = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(sourceSha ?? '')) throw new Error('Exact source SHA required');
execFileSync('git', ['cat-file', '-e', `${sourceSha}^{commit}`]);
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8').replace(/^\uFEFF/, ''));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const checks = {};
for (const name of ['types', 'acentos', 'unit', 'jest', 'build']) {
  const execution = read(`106-${name}-execution.json`);
  if (execution.sha !== sourceSha || execution.exitCode !== 0 || execution.status !== 'finished') throw new Error(`Incomplete ${name}`);
  checks[name] = execution;
}
const bytes = fs.readFileSync(path.join(root, '106-jest.json'));
const jest = JSON.parse(bytes);
if (!jest.success || jest.numPassedTests !== 4139 || jest.numFailedTests !== 0 || jest.numPendingTests !== 0) throw new Error('Full Jest incomplete');
const archive = gzipSync(bytes);
fs.writeFileSync(path.join(root, '106-jest.json.gz'), archive);
const jestSummary = { sourceSha, suites: jest.numTotalTestSuites, tests: jest.numTotalTests, passed: jest.numPassedTests,
  failed: jest.numFailedTests, pending: jest.numPendingTests, success: jest.success, rawSha256: hash(bytes), archiveSha256: hash(archive) };
fs.writeFileSync(path.join(root, '106-jest-resumen.json'), JSON.stringify(jestSummary, null, 2));

const dir = path.join(root, '106-artifactos');
fs.mkdirSync(dir, { recursive: true });
const browser = {};
for (const name of ['3d-baseline', '3d-pre-framebuffer', '3d']) {
  const raw = read(`106-${name}.json`);
  const execution = read(`106-${name}-execution.json`);
  const results = []; let index = 0;
  function visit(suites) {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) for (const test of spec.tests || []) for (const result of test.results || []) {
        const files = [];
        for (const attachment of result.attachments || []) {
          const ext = { 'image/png': '.png', 'application/json': '.json', 'text/plain': '.txt' }[attachment.contentType] || '.bin';
          const file = `106-${name}-${String(index++).padStart(3, '0')}${ext}`;
          const archived = path.join(dir, file);
          const data = attachment.path && fs.existsSync(attachment.path) ? fs.readFileSync(attachment.path) : attachment.body ? Buffer.from(attachment.body, 'base64') : fs.existsSync(archived) ? fs.readFileSync(archived) : null;
          if (!data) continue;
          fs.writeFileSync(path.join(dir, file), data);
          files.push({ name: attachment.name, file: '106-artifactos/' + file, sha256: hash(data) });
        }
        results.push({ title: spec.title, project: test.projectName, status: result.status, duration: result.duration, errors: result.errors, files });
      }
      visit(suite.suites);
    }
  }
  visit(raw.suites);
  if (name !== '3d-baseline' && execution.applicationSourceSha !== sourceSha) throw new Error('Browser source mismatch');
  if (name === '3d-pre-framebuffer' && (raw.stats.expected !== 11 || raw.stats.unexpected !== 1 || raw.stats.skipped !== 0 || raw.stats.flaky !== 0)) throw new Error('Previous browser evidence mismatch');
  if (name === '3d' && (execution.exitCode !== 0 || raw.stats.expected !== 2 || raw.stats.unexpected !== 0 || raw.stats.skipped !== 0 || raw.stats.flaky !== 0)) throw new Error('Camera retest incomplete');
  browser[name] = { sourceSha: execution.applicationSourceSha, harnessSha: execution.sha, stats: raw.stats, results };
  fs.writeFileSync(path.join(root, `106-${name}-resumen.json`), JSON.stringify(browser[name], null, 2));
}
const selected = new Map();
for (const name of ['3d-pre-framebuffer', '3d']) for (const result of browser[name].results) selected.set(`${result.project}:${result.title}`, { ...result, run: name });
const accepted = [...selected.values()];
if (accepted.length !== 12 || accepted.some(result => result.status !== 'passed')) throw new Error('Acceptance matrix incomplete');
browser.acceptance = { sourceSha, uniqueCases: accepted.length, passed: accepted.length, results: accepted,
  strategy: 'Reuse 11 passed cases from the same application SHA; repeat both camera cases after fixing only the test probe. Preserve original timeout.' };
const audit = read('106-npm-audit.json');
const urls = result => [...new Set(Object.values(result.vulnerabilities).flatMap(item => item.via.filter(via => typeof via === 'object').map(via => via.url)))];
const previous = urls(read('105-npm-audit.json')), current = urls(audit);
const validation = { sourceSha, checks, jest: jestSummary, browser, audit: { metadata: audit.metadata.vulnerabilities,
  uniqueAdvisories: current.length, removed: previous.filter(url => !current.includes(url)), added: current.filter(url => !previous.includes(url)) },
  limits: ['27 avisos remanentes requieren evaluacion, no seguridad total', 'No acredita todos los botones/variantes de toda la app', 'No cuentas externas, datos originales, despliegue Firebase ni hardware fisico'] };
fs.writeFileSync(path.join(root, '106-validacion.json'), JSON.stringify(validation, null, 2));
console.log(JSON.stringify({ sourceSha, tests: jestSummary.passed, browser: { uniqueCases: browser.acceptance.uniqueCases, passed: browser.acceptance.passed, cameraRetest: browser['3d'].stats }, audit: validation.audit }, null, 2));
