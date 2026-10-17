import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const prefix = 'docs/evidencias/';
const manifest = JSON.parse(fs.readFileSync(`${prefix}134-conciliacion.json`, 'utf8'));
const bytes = zlib.gunzipSync(fs.readFileSync(manifest.payload.file));
const report = JSON.parse(bytes);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), manifest.payload.jsonSha256);
assert.equal(bytes.length, manifest.payload.bytes);
assert.deepEqual(report.counts, manifest.counts);
assert.equal(report.sourceSha, manifest.sourceSha);
assert.equal(report.documentarySha, manifest.documentarySha);
const tree = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', report.sourceSha], { encoding: 'utf8' }).trim().split('\n'));
const routes = new Map(report.routes.map((row) => [row.file, row]));
assert.equal(routes.size, 421);
assert.equal(report.areas.length, 14);
assert.equal(report.roles.length, 7);
assert.equal(report.historicalArtifacts.filter((item) => item.expansionError).length, 0);
const owners = report.areas.flatMap((area) => area.ownedRoutes);
assert.equal(new Set(owners).size, routes.size);
assert.equal(owners.length, routes.size);
const cases = new Map(report.nativeCases.map((row) => [row.id, row]));
assert.equal(cases.size, report.counts.nativeCaseExecutions);
for (const row of report.routes) {
  assert(tree.has(row.file), `Missing current route ${row.file}`);
  assert(report.areas.some((area) => area.id === row.ownerArea));
  for (const file of row.allStaticClosure) assert(tree.has(file), `Missing dependency ${file}`);
  for (const id of [...row.nativeCaseIds, ...row.historicalNativeCaseIds]) assert(cases.has(id), `Missing case ${id}`);
  assert.equal(row.fullRouteAccepted, false);
}
for (const record of report.nativeCases) {
  for (const file of [...record.routeFiles, ...record.historicalRouteFiles]) assert(routes.has(file));
  if (!record.runtimeSourceEquivalent) assert.equal(record.routeFiles.length, 0);
}
const bundle = JSON.parse(zlib.gunzipSync(fs.readFileSync(`${prefix}134-recibos-nativos.json.gz`)));
assert.equal(bundle.runs.length, report.counts.nativeRunsIndexed);
for (const run of bundle.runs) {
  const stats = run.results.stats;
  assert.equal(report.nativeCases.filter((item) => item.runId === run.id).length, stats.expected + stats.unexpected + stats.skipped);
  for (const source of run.sources.filter((item) => item.content)) {
    assert.equal(crypto.createHash('sha256').update(source.content).digest('hex'), source.sha256);
  }
}
assert.equal(fs.readFileSync(`${prefix}134-rutas.csv`, 'utf8').trim().split('\n').length, routes.size + 1);
assert.equal(report.counts.multiplyDeclaredRoutes, 8);
assert.equal(report.counts.unmappedRoutes, 0);
assert.equal(report.counts.staleMappedRoutes, 0);
assert.equal(report.allAppCertified, false);
const result = { gate: 'PASS_RECONCILIATION_134_ONLY', sourceSha: report.sourceSha,
  counts: report.counts, applicationTestsRun: false, applicationCertified: false };
fs.writeFileSync(`${prefix}134-validacion.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
