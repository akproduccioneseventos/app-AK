import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const target = path.dirname(fileURLToPath(import.meta.url));
const previous = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-auditoria-133-portal-responsive';
const cases = [
  ['151-mobile-execution.json', 'tests/e2e/135-mobile-contrato-social.spec.ts', '151-mobile-source.spec.ts'],
  ['151-date-execution.json', 'tests/e2e/143-cocina-fecha-local.spec.ts', '151-date-source.spec.ts'],
  ['151-agenda-execution.json', 'docs/evidencias/150-agenda-catalogo.spec.ts', '151-agenda-source.spec.ts'],
];
const rows = [];
for (const [receipt, from, name] of cases) {
  const bytes = fs.readFileSync(path.join(previous, from));
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha, JSON.parse(fs.readFileSync(path.join(target, receipt))).testSha256);
  assert.equal(fs.existsSync(path.join(target, name)), false);
  fs.writeFileSync(path.join(target, name), bytes);
  rows.push({ file: name, actualExecutionReceipt: receipt, executedSha256: sha });
}
for (const [from, name] of [['135-playwright.config.ts', '151-mobile-config.ts'], ['143-playwright.config.ts', '151-date-config.ts']]) {
  const bytes = fs.readFileSync(path.join(previous, 'docs/evidencias', from));
  fs.writeFileSync(path.join(target, name), bytes);
  rows.push({ file: name, original: from, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), scope: 'Configuration snapshot, not a retroactive execution hash' });
}
fs.writeFileSync(path.join(target, '154-sources-verificados.json'), JSON.stringify({ rows }, null, 2));
console.log(JSON.stringify(rows));
