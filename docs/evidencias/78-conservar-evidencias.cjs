const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const directory = path.join(__dirname, '78-resultados');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const results = JSON.parse(fs.readFileSync(path.join(directory, 'jest-mocked.json'), 'utf8'));
const files = fs.readdirSync(directory).filter(name => name !== 'manifest.json').sort().map(name => ({
  file: name, bytes: fs.statSync(path.join(directory, name)).size, sha256: hash(path.join(directory, name)),
}));
const manifest = {
  schema: 1, recordedAt: new Date().toISOString(),
  browserSourceCommit: 'f790a002426aecb6598efa239fa948db57571752',
  browserBuildId: 'iZL-zBn4z4fNZ_IXFyUCN',
  correctedSourceCommit: '09051f80ee7722537a06c50c8eb7524b21ac11e8',
  pendingDocumentationPr: { number: 1266, head: '8f4f6895a2150628271c4beef7c9b64f9a0d718f' },
  jest: { passed: results.numPassedTests, failed: results.numFailedTests, success: results.success,
    suites: results.testResults.map(suite => ({ file: path.basename(suite.name), status: suite.status, tests: suite.assertionResults.length })) },
  pdf: { pages: 2, inspectedBothRenderedPages: true, generatedByActualBrowserDownload: true,
    publicLink: 'complete annotation exists, but consumer fails without team session', fixtureOnly: true },
  ui: { inspectedWidths: [384, 1274], noHorizontalOverflowObservedOnClientPortal: true,
    roles: ['organizer', 'client', 'guest', 'prospect'], storage: 'isolated JSON only' },
  limitations: ['not all app routes/buttons', 'not live Firestore/Meta/Google/WhatsApp/Mercado Pago',
    'mural upload rejected without provider', 'bar order rejected without ingredients', 'not physical hardware',
    'four unresolved findings; no release approval; UI build differs from source retest commit'],
  files,
};
fs.writeFileSync(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ files: files.length, passed: manifest.jest.passed, failed: manifest.jest.failed }));
