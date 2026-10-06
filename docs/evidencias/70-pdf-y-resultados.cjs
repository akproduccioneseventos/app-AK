const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const out = path.join(__dirname, '70-resultados');
fs.mkdirSync(out, { recursive: true });
const source = fs.readFileSync(path.join(root, 'src/lib/budget/simulator-budget-pdf.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'require', 'module', code)(mod.exports, require, mod);
(async () => {
  const items = Array.from({ length: 52 }, (_, i) => ({ id: `audit_${i}`, nombre: `Servicio de prueba ${i+1} con detalle de lo contratado`, categoria: i<20?'Catering':'Entretenimiento', cantidad: 1, precioUnitario: 1000, costoTotal: 1000, esRegalo: i%13===0 }));
  const pdf = await mod.exports.createSimulatorBudgetPdf({ documentId: 'SOLO-PRUEBA-70', publicUrl: 'https://example.invalid/presupuesto-de-prueba', clientName: 'Cliente ficticio para revision, sin validez comercial', eventType: 'Boda', eventDate: new Date('2027-08-08T15:00:00Z'), adults: 80, childrenAndTeens: 20, packageName: 'Prueba de presupuesto largo', items,
    stats: { subtotalBruto: 52000, ahorroRegalos: 4000, descPromo: 0, totalFinal: 48000, precioPorPersona: 480, discountPercentage: 0, annualProjection: { applies: true, currentYear: 2026, eventYear: 2027, adjustmentPct: 15, baseTotal: 48000, adjustedTotal: 55200, adjustmentAmount: 7200, rows: [{ year: 2027, total: 55200, adjustmentAmount: 7200 }] } } });
  fs.writeFileSync(path.join(out, 'presupuesto-prueba.pdf'), Buffer.from(pdf.output('arraybuffer')));
  const raw = fs.readFileSync(path.resolve(root, '../audit-runtime-results-20261002/jest-mocked.json'));
  const results = JSON.parse(raw);
  fs.writeFileSync(path.join(out, 'jest.json.gz'), zlib.gzipSync(raw));
  const probe = execFileSync(process.execPath, [path.join(__dirname, '70-sondas-contables.cjs')], { cwd: root, encoding: 'utf8' });
  fs.writeFileSync(path.join(out, 'sondas.json'), JSON.stringify(probe.trim().split(/\r?\n/).map(JSON.parse), null, 2)+'\n');
  const manifest = { sourceCommit: execFileSync('git', ['rev-parse','HEAD'], { cwd: root, encoding:'utf8' }).trim(), recordedAt: new Date().toISOString(), command: 'node docs/evidencias/sondas/64-isolated-audit-runner.mjs . jest-mocked --silent --testPathPatterns="financ|contab|cuota|cobr|pago|presup|simula|invoice|ledger|gasto|payment|recibo|money|mercado|budget|annual|descuento|regalo|cost"', scopeNote: 'The pattern money matched the absolute worktree path, so all suites ran; no extra rerun.', suites: results.numTotalTestSuites, tests: results.numTotalTests, passed: results.numPassedTests, failed: results.numFailedTests, pending: results.numPendingTests, rawSha256: crypto.createHash('sha256').update(raw).digest('hex'), pdfPages: pdf.getNumberOfPages(), pdfLimit: 'Synthetic input through actual generator. No browser download, real logo, live menu catalog or Firebase persistence verified.' };
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest));
})().catch(e => { console.error(e); process.exitCode=1; });
