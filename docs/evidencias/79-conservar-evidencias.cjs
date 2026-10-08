const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const dir = path.join(__dirname, '79-resultados');
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const jest = read('orden-128-jest.json');
const retest = read('retest-128-persistencia.json');
const bar = read('barra-persistencia.json');
const oracle = read('oraculo-fotocabina.json');
assert.equal(jest.numPassedTests, 9);
assert.equal(jest.numFailedTests, 0);
assert.equal(retest.source, '09c8d814fdecdca00da71de7bc22c1d64ef0e662');
const files = fs.readdirSync(dir).filter((n) => n !== 'manifest.json').sort().map((name) => {
  const bytes = fs.readFileSync(path.join(dir, name));
  return { file: name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
});
const manifest = {
  schema: 1, at: new Date().toISOString(),
  currentSource: retest.source, currentBuild: retest.build,
  olderBarBrowser: { source: 'f790a002426aecb6598efa239fa948db57571752', build: 'iZL-zBn4z4fNZ_IXFyUCN',
    reusedBecauseRelevantSourceUnchanged: true },
  jest: { suites: jest.numPassedTestSuites, passed: jest.numPassedTests, failed: jest.numFailedTests,
    kind: 'Focused helpers/persistence with mocked DB and static consumer scans, not nine E2E' },
  browser: { isolated: true, productionWrites: false, source128: retest.source,
    verifiedCases: ['buffet budget saved', 'actual PDF download', 'valid public token without team session',
      'invalid public token rejected', 'no token requires login', 'CRM event date without appointment',
      'grouped portal counts', 'bar order preparation/ready/delivery', 'bar cancellation and stock restored'],
    pdf: { pages: 2, bothRendersVisuallyInspected: true, artifact: 'presupuesto-128.pdf' },
    residual128C: 'Pending shortcut still labels 19 invitations as invitados, while 37 persons shown elsewhere' },
  barResultFile: 'barra-persistencia.json',
  barRecordedAt: bar.recordedAt ?? bar.at ?? null,
  oracleFile: 'oraculo-fotocabina.json',
  oracleKind: 'Actual test callback/assertions, simulated browser; not proof of an app defect',
  oracleRecordedAt: oracle.recordedAt ?? oracle.at ?? null,
  limits: ['local build, not published deployment', 'not all 14 areas or buttons',
    'station sessions/mural media need connected test Firestore/Storage (existing 114.3)',
    'original 19 budgets not reconciled', 'not real Google/Meta/WhatsApp/Mercado Pago',
    'not hardware or multi-server concurrency'],
  files,
};
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, passed: 9, failed: 0, source: retest.source }));
