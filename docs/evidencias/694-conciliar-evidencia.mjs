import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('./', import.meta.url));
const root = path.resolve(dir, '../..');
const source = 'd4c69f2b2395ad3abcaee4fb166bcefbdc1457e0';
const previous = '978af7d65a60bd287f3ee3cc05037a29566074f4';
const output = path.join(dir, '694-conciliacion.json');
assert(!fs.existsSync(output));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const files = ['src/app/(app)/invoices/[id]/page.tsx', 'src/lib/entretenimiento/filtros-cara.ts', 'src/lib/entretenimiento/marcos-dinamicos.ts', 'src/app/evento/barra/[fiestaId]/listo/page.tsx', 'src/app/ak-internal-experience-polish.css', ...['fotocabina', 'touchpix', 'bogue', 'espejo-magico'].map(station => `src/app/evento/${station}/[fiestaId]/page.tsx`)];
const blobs = files.map(file => ({ file, previous: git(['rev-parse', `${previous}:${file}`]), current: git(['rev-parse', `${source}:${file}`]) }));
assert(blobs.every(row => row.previous === row.current));
const canonical = JSON.parse(fs.readFileSync(path.join(dir, '681-canonical-resultados.json')));
const focusNames = new Set(['los-efectos-reaccionan-a-la-cara.test.ts', 'los-filtros-siguen-la-cara.test.ts', '387-factura-error-no-es-ausencia.test.tsx']);
const focus = canonical.testResults.filter(row => focusNames.has(path.basename(row.name))).map(row => ({ file: path.basename(row.name), status: row.status, criteria: row.assertionResults.map(test => ({ title: test.fullName, status: test.status })) }));
assert.equal(focus.length, 3); assert(focus.every(row => row.criteria.every(test => test.status === 'passed')));
const install = JSON.parse(fs.readFileSync(path.join(dir, '690-instalacion.json')));
assert.equal(install.phase, 'install-pass');
const lock = JSON.parse(fs.readFileSync(path.join(install.qa, 'package-lock.json')));
const dependencies = { installed: 0, matching: 0, absentOptional: [], absentRequired: [], mismatches: [] };
for (const [entry, meta] of Object.entries(lock.packages)) {
  if (!entry.startsWith('node_modules/') || meta.link) continue;
  const file = path.join(install.qa, entry, 'package.json');
  if (!fs.existsSync(file)) { (meta.optional ? dependencies.absentOptional : dependencies.absentRequired).push(entry); continue; }
  dependencies.installed++;
  const actual = JSON.parse(fs.readFileSync(file));
  if (actual.version === meta.version) dependencies.matching++;
  else dependencies.mismatches.push({ entry, expected: meta.version, actual: actual.version });
}
const record = { checkedAt: new Date().toISOString(), source, headBeforeDocumentation: git(['rev-parse', 'HEAD']), previous, blobs, focus, canonicalReusedNotRerun: true, canonical: { suites: canonical.numTotalTestSuites, pass: canonical.numPassedTests, fail: canonical.numFailedTests, pending: canonical.numPendingTests }, dependencies, dependencyScope: 'Fresh manifest-only install, lifecycle scripts disabled. Compare all installed lock entries; absent optionals kept explicitly, not passed as installed. No vulnerability assessment or full new build.', historicalReferences: { commit: 'e0ffd23951d87d6a93c63e1c77db4bfa473404d8', reports: ['597-cierre-final-25octubre.md', '650-cierre-recorridos-enumerados.md', '640-recuento-final.json'] }, limits: 'No new functional execution. Same blobs are source evidence, not universal transitive runtime acceptance. Initial incomplete helper conclusion discarded; owner automation remains deleted.', appDiff: git(['diff', source, 'HEAD', '--', 'src', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json']), manifestSha256: createHash('sha256').update(fs.readFileSync(path.join(install.qa, 'package.json'))).digest('hex') };
fs.writeFileSync(output, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ source, blobs: blobs.length, focusCases: focus.reduce((sum, row) => sum + row.criteria.length, 0), dependencies: { installed: dependencies.installed, matching: dependencies.matching, absentOptional: dependencies.absentOptional.length, absentRequired: dependencies.absentRequired, mismatches: dependencies.mismatches } }));
assert.equal(record.appDiff, '');
assert.equal(dependencies.absentRequired.length, 0);
assert.equal(dependencies.mismatches.length, 0);
