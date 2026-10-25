import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(dir, '150-consolidado.json');
if (fs.existsSync(target)) throw new Error('Preserve consolidation');
const hashes = {};
const read = file => {
  const bytes = fs.readFileSync(path.join(dir, file)); hashes[file] = crypto.createHash('sha256').update(bytes).digest('hex');
  return JSON.parse(bytes);
};
const collect = report => {
  const cases = [], attachments = [];
  function walk(suite) {
    for (const child of suite.suites || []) walk(child);
    for (const spec of suite.specs || []) for (const test of spec.tests || []) for (const result of test.results || []) {
      cases.push({ title: spec.title, project: test.projectName, status: result.status, duration: result.duration,
        errors: (result.errors || []).map(e => String(e.message || e.value).slice(0, 180)) });
      attachments.push(...result.attachments || []);
    }
  }
  walk(report); return { cases, attachments };
};
const native = [], downloads = [], contexts = [];
for (const prefix of ['150-comercial', '150-comercial-final', '150-comercial-cierre', '150-comercial-aceptacion']) {
  const receipt = read(`${prefix}-execution.json`);
  const report = read(`${prefix}-results.json`);
  const details = collect(report);
  native.push({ prefix, source: receipt.source, exitCode: receipt.exitCode, sourceDiff: receipt.sourceDiff,
    testSha256: receipt.testSha256, cases: details.cases, realServices: receipt.health.services });
  for (const attachment of details.attachments) {
    if (attachment.name === 'presupuesto-movil' && attachment.path && fs.existsSync(attachment.path)) {
      const bytes = fs.readFileSync(attachment.path);
      downloads.push({ prefix, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), base64: bytes.toString('base64') });
      if (prefix === '150-comercial-aceptacion') fs.writeFileSync(path.join(dir, '150-presupuesto-movil.pdf'), bytes);
    }
    if (attachment.name === 'error-context' && attachment.path && fs.existsSync(attachment.path)) contexts.push({ prefix, source: fs.readFileSync(attachment.path, 'utf8') });
  }
  for (const suffix of ['results.json', 'playwright.log', 'serve.log']) {
    const file = path.join(dir, `${prefix}-${suffix}`);
    if (fs.existsSync(file)) fs.writeFileSync(file + '.gz', gzipSync(fs.readFileSync(file)));
  }
}
assert.equal(native.at(-1).exitCode, 0);
assert.equal(native.at(-1).sourceDiff, '');
assert.equal(native.at(-1).cases.length, 1);
assert.equal(native.at(-1).cases[0].status, 'passed');
fs.writeFileSync(path.join(dir, '150-descargas-todas.json.gz'), gzipSync(Buffer.from(JSON.stringify(downloads))));
fs.writeFileSync(path.join(dir, '150-contextos-qa.json.gz'), gzipSync(Buffer.from(JSON.stringify(contexts))));
const money = read('150-consumidores-entrega.json'), privacy = read('150-salidas-perfil.json'), queue = read('150-cola-entrega.json');
const pdf = read('150-pdf-inspeccion.json'), margins = read('150-pdf-margenes.json');
const record = {
  native, nativeAcceptance: 'PASS_COMMERCIAL_MOBILE_MAIN_JSON_ONLY',
  priorQaProblems: ['Mobile CRM column collapsed by design; test did not expand it',
    'Whole-object comparison rejected regenerated timestamp and item IDs',
    'QA normalizer used items instead of actual itemsPresupuestados'],
  money: { source: money.source, ...money.summary, scope: money.scope },
  privacy: { source: privacy.source, controlPass: privacy.control.pass, failingVariants: privacy.cases.filter(c => !c.pass).length, scope: privacy.scope },
  queue: { source: queue.source, ...queue.summary, scope: queue.scope },
  pdf: { source: pdf.sourceSha, pages: pdf.pages.length, itemCount: pdf.itemCount, missing: pdf.missingNamesExactText,
    expectedTotal: pdf.expectedTotal, a4: pdf.a4AllPages, visibleLinkGeometry: margins.rows },
  hashes, appEdited: false, productionChanged: false,
  limits: ['No SDK acceptance from localJSON native journey', 'No real OAuth/model/voice/messages/hardware/19originals',
    'Bodies with explicit session/store doubles are not signed HTTP acceptance', 'No whole-app or zero-error certificate',
    'Order193 already covers185;195 incorporates186; do not issue those corrections again'],
};
fs.writeFileSync(target, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ native: record.nativeAcceptance, money: record.money, queue: record.queue, privacyViolations: record.privacy.failingVariants, pdf: record.pdf }));
