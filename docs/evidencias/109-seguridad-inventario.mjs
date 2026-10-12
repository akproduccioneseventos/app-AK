import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const audit = JSON.parse(fs.readFileSync('docs/evidencias/106-npm-audit.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const byId = new Map();
for (const [name, entry] of Object.entries(audit.vulnerabilities)) {
  for (const advisory of entry.via.filter(item => typeof item === 'object')) {
    const id = advisory.url.split('/').pop();
    const row = byId.get(id) || { id, package: advisory.name, severity: advisory.severity,
      title: advisory.title, range: advisory.range, url: advisory.url, installations: [] };
    for (const node of entry.nodes) {
      if (!row.installations.some(item => item.path === node)) {
        const installed = lock.packages[node];
        row.installations.push({ path: node, version: installed?.version, devFlag: Boolean(installed?.dev),
          reportedUnder: name });
      }
    }
    byId.set(id, row);
  }
}
const walk = (directory) => fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]) : [];
const traceFiles = walk('.next/server').filter(file => file.endsWith('.nft.json'));
const traces = traceFiles.map(file => ({ file: file.replaceAll('\\', '/'),
  files: JSON.parse(fs.readFileSync(file, 'utf8')).files || [] }));
const explain = {};
const advisoryMetadata = {};
const errors = [];
for (const row of byId.values()) {
  row.traceConsumers = traces.filter(trace => trace.files.some(file =>
    file.replaceAll('\\', '/').includes(`/node_modules/${row.package}/`))).map(trace => trace.file);
  try {
    advisoryMetadata[row.id] = JSON.parse(execFileSync('gh', ['api', `/advisories/${row.id}`],
      { encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }));
  } catch (error) { errors.push({ kind: 'advisory', id: row.id, message: error.message }); }
  if (!(row.package in explain)) {
    try {
      explain[row.package] = JSON.parse(execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
        ['explain', row.package, '--json'], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024,
          shell: process.platform === 'win32' }));
    } catch (error) { errors.push({ kind: 'explain', package: row.package, message: error.message }); }
  }
}
const result = { head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  appSource: '8fa5b56a2833938541a657dcd15ef88130d24b0e',
  fetchedAt: new Date().toISOString(), sourceAudit: '106-npm-audit.json',
  auditMetadata: audit.metadata, uniqueAdvisories: byId.size,
  interpretation: 'Installed or traced does not prove an exploitable call. devFlag is not runtime reachability.',
  advisories: [...byId.values()], advisoryMetadata, explain, errors };
fs.writeFileSync('docs/evidencias/109-seguridad-inventario.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ unique: byId.size, packages: Object.keys(explain).length, traces: traces.length,
  metadata: Object.keys(advisoryMetadata).length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
