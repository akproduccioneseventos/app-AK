import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import net from 'node:net';
import { gzipSync, gunzipSync } from 'node:zlib';

const dir = new URL('./', import.meta.url);
const read = (name) => fs.existsSync(new URL(name, dir)) ? fs.readFileSync(new URL(name, dir))
  : gunzipSync(fs.readFileSync(new URL(name + '.gz', dir)));
const json = (name) => JSON.parse(read(name));
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const source = '17d26a631f500a263c48c4973d9c6f57d56ba421';
const runs = [];
for (const [prefix, testFile] of [['143', '143-fecha-padding-inicial.spec.ts'],
  ['143-civil', '../../tests/e2e/143-cocina-fecha-local.spec.ts']]) {
  const execution = json(`${prefix}-execution.json`);
  const bytes = read(`${prefix}-date-results.json`);
  const result = JSON.parse(bytes);
  assert.equal(execution.source, source); assert.equal(execution.sourceDiff, '');
  assert.ok(execution.finished); assert.ok(!execution.error);
  assert.ok(execution.health.version.startsWith(source));
  assert.ok(Object.values(execution.health.services).every((value) => value === false));
  assert.equal(execution.tests[0].sha256, sha(read(testFile)));
  assert.equal(result.stats.skipped, 0); assert.equal(result.stats.flaky, 0);
  const checkpoints = [];
  function walk(suite) {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      assert.equal(test.results.length, 1);
      const run = test.results[0];
      const attachment = run.attachments.find((a) => a.name === 'fecha.json');
      const date = JSON.parse(Buffer.from(attachment.body, 'base64').toString('utf8'));
      assert.equal(date.fixtureDate, '2027-08-08');
      const screenshot = `${prefix}-${test.projectName}.jpeg`;
      fs.writeFileSync(new URL(screenshot, dir), Buffer.from(run.attachments.find((a) => a.name === 'cabecera.jpeg').body, 'base64'));
      checkpoints.push({ project: test.projectName, status: run.status, durationMs: run.duration, date, screenshot });
    }
    for (const child of suite.suites || []) walk(child);
  }
  for (const suite of result.suites) walk(suite);
  assert.equal(checkpoints.length, 2);
  fs.writeFileSync(new URL(`${prefix}-date-results.json.gz`, dir), gzipSync(bytes));
  runs.push({ prefix, execution, stats: result.stats, checkpoints,
    archive: { file: `${prefix}-date-results.json.gz`, sha256Uncompressed: sha(bytes) } });
}
const final = runs[1];
assert.equal(final.checkpoints.find((c) => c.project === 'chromium-utc').status, 'passed');
const uruguay = final.checkpoints.find((c) => c.project === 'chromium-uy');
assert.equal(uruguay.status, 'failed');
assert.ok(uruguay.date.screen.includes('7/8/2027'));
assert.equal(uruguay.date.screen, uruguay.date.printed);
for (const port of [3300, 8085]) await new Promise((resolve, reject) => {
  const socket = net.connect({ host: '127.0.0.1', port }); socket.setTimeout(1000);
  socket.on('connect', () => { socket.destroy(); reject(new Error(`Still listening: ${port}`)); });
  socket.on('error', resolve);
  socket.on('timeout', () => { socket.destroy(); reject(new Error(`Cleanup uncertain: ${port}`)); });
});
const output = { source, candidatePR: 1327, runs,
  finding: 'Civil date2027-08-08 displays7/8/2027 in Uruguay,8/8/2027 in UTC',
  initialQAError: 'The initial control required zero padding; corrected ONLY the audit test to compare numeric civil parts. Initial test and both failures archived.',
  appEdited: false, fixed: false, allAppAccepted: false, cleanup: { portsListening: [], trackedSourceDiff: '' } };
fs.writeFileSync(new URL('143-consolidado.json', dir), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ finding: output.finding, final: final.stats, fixed: false }));
