import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const dir = new URL('./', import.meta.url);
const read = (file) => fs.existsSync(new URL(file, dir)) ? fs.readFileSync(new URL(file, dir))
  : gunzipSync(fs.readFileSync(new URL(file + '.gz', dir)));
const json = (file) => JSON.parse(read(file));
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const source = '17d26a631f500a263c48c4973d9c6f57d56ba421';
const build = json('142-entorno.json');
const execution = json('142-execution.json');
assert.equal(build.sourceSha, source); assert.equal(build.buildExit, 0);
assert.equal(execution.source, source); assert.equal(execution.sourceDiff, '');
assert.ok(execution.finished); assert.ok(!execution.error);
assert.ok(execution.health.version.startsWith(source));
assert.ok(Object.values(execution.health.services).every((value) => value === false));
for (const test of execution.tests) assert.equal(test.sha256,
  sha(fs.readFileSync(new URL(`../../tests/e2e/${test.file}`, dir))));
const checkpoints = [];
const archives = [];
for (const prefix of ['142-kitchen', '142-mobile']) {
  const bytes = read(`${prefix}-results.json`);
  const result = JSON.parse(bytes);
  assert.equal(result.stats.skipped, 0);
  assert.equal(result.stats.flaky, 0);
  assert.equal(result.stats.expected + result.stats.unexpected, 2);
  function walk(suite) {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      assert.equal(test.results.length, 1);
      const run = test.results[0];
      const attachments = [];
      for (const item of run.attachments || []) {
        if (item.body && item.contentType === 'application/pdf') {
          const file = `${prefix}-${test.projectName}.pdf`;
          fs.writeFileSync(new URL(file, dir), Buffer.from(item.body, 'base64'));
          attachments.push({ name: item.name, file });
        } else if (item.body && item.contentType === 'application/json') {
          attachments.push({ name: item.name, value: JSON.parse(Buffer.from(item.body, 'base64').toString('utf8')) });
        } else if (item.path) attachments.push({ name: item.name, file: path.relative(fileURLToPath(dir), item.path).replaceAll('\\', '/') });
      }
      const metrics = (run.stdout || []).filter((item) => item.text?.startsWith('QA135_')).map((item) => {
        const text = item.text.trim(); const split = text.indexOf(' ');
        return { name: text.slice(0, split), value: JSON.parse(text.slice(split + 1)) };
      });
      checkpoints.push({ prefix, title: spec.title, project: test.projectName, status: run.status,
        durationMs: run.duration, errors: run.errors.map((error) => error.message?.replace(/\u001b\[[0-9;]*m/g, '')),
        attachments, metrics });
    }
    for (const child of suite.suites || []) walk(child);
  }
  for (const suite of result.suites) walk(suite);
  fs.writeFileSync(new URL(`${prefix}-results.json.gz`, dir), gzipSync(bytes));
  archives.push({ file: `${prefix}-results.json.gz`, sha256Uncompressed: sha(bytes), stats: result.stats });
}
assert.equal(checkpoints.length, 4);
for (const port of [3300, 8085]) await new Promise((resolve, reject) => {
  const socket = net.connect({ host: '127.0.0.1', port }); socket.setTimeout(1000);
  socket.on('connect', () => { socket.destroy(); reject(new Error(`Still listening: ${port}`)); });
  socket.on('error', resolve);
  socket.on('timeout', () => { socket.destroy(); reject(new Error(`Cleanup uncertain: ${port}`)); });
});
const kitchen = checkpoints.filter((item) => item.prefix === '142-kitchen');
const mobile = checkpoints.filter((item) => item.prefix === '142-mobile');
const output = { source, candidatePR: 1327, build, execution, checkpoints, archives,
  acceptance: { kitchen2Native: kitchen.every((item) => item.status === 'passed'),
    mobile171And172: mobile.every((item) => item.status === 'passed'),
    completeApp: false, physicalHardware: false, productionDeployment: false },
  cleanup: { portsListening: [], trackedSourceDiff: '' } };
fs.writeFileSync(new URL('142-consolidado.json', dir), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ acceptance: output.acceptance,
  cases: checkpoints.map(({ title, project, status, durationMs }) => ({ title, project, status, durationMs })) }));
