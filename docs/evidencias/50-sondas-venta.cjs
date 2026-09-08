// Read-only audit: real functions, fake posts/leads, no network or CRM writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2] || 'typescript');
const root = path.resolve(__dirname, '../..');
const results = [];
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function declaration(file, name) {
  const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
  const node = ast.statements.find((n) => n.name?.text === name);
  assert.ok(node, `Missing declaration ${name}`);
  return node.getText(ast);
}
function evaluate(source, globals = {}) {
  const context = { exports: {}, console, URL, URLSearchParams, ...globals };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context, { timeout: 2000 });
  return context.exports;
}
async function probe(id, run) {
  try { await run(); results.push({ id, status: 'PASS' }); }
  catch (e) { results.push({ id, status: 'FAIL', reason: e.message }); }
}
(async () => {
  await probe('WEB-02 private drafts and scheduled posts stay out of public feed', async () => {
    const statuses = ['Publicado', 'Borrador', 'Programado'];
    const posts = statuses.map((status, i) => ({
      id: `fake-${i}`, platform: 'Instagram', mediaType: 'image', status,
      mediaUrl: `https://example.invalid/audit-${i}.jpg`, text: `Fake ${status}`,
      publishDate: status === 'Publicado' ? '2026-09-01' : '2099-01-01',
    }));
    const api = evaluate(declaration('src/lib/instagram/public-feed.ts', 'getPublicInstagramFeed'), {
      POSTS_FILE: 'test-only', readData: async () => posts, process: { env: {} },
      fetch: async () => { throw new Error('Network forbidden'); },
    });
    const feed = await api.getPublicInstagramFeed();
    assert.equal(feed.length, 1, `Public feed includes ${feed.length} records: ${feed.map((p) => p.caption).join(', ')}`);
  });
  const attribution = evaluate(read('src/lib/commercial/acquisition.ts'));
  await probe('WEB-03a preserve UTM source and campaign', async () => {
    const query = new URLSearchParams('utm_source=facebook&utm_medium=paid_social&utm_campaign=bodas-audit');
    const result = attribution.commercialAttributionFromSearchParams(query, 'landing');
    assert.equal(`${result.source}|${result.campaign}`, 'facebook|bodas-audit',
      `Observed source=${result.source}, campaign=${result.campaign}`);
  });
  await probe('WEB-03b saveLead must not replace known acquisition channel with page type', async () => {
    let captured;
    const api = evaluate(declaration('src/app/actions/crm.ts', 'saveLead'), {
      ...attribution, normalizeUruguayPhone: () => '099000001', enforcePublicRateLimit: async () => {},
      upsertPublicCommercialLead: async (data) => { captured = data; },
    });
    const result = await api.saveLead({
      nombre: 'AUDIT ONLY', telefono: 'fake-input-not-sent', fuente: 'landing-bodas', marketingConsent: false,
      acquisition: { source: 'facebook', campaign: 'bodas-audit', entryPath: '/bodas' },
    });
    assert.equal(result.success, true);
    assert.equal(captured.acquisition.source, 'facebook',
      `Known source=facebook overwritten by ${captured.acquisition.source}`);
  });
  console.log(JSON.stringify({ scope: 'Isolated functions; no live publication or lead', results }, null, 2));
  process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0;
})().catch((error) => { console.error(error); process.exitCode = 2; });
