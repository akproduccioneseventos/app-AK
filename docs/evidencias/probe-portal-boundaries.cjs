const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2]);
const ts = require(path.join(root, 'node_modules/typescript'));
let cookie;
let now = 1800000000000;
const events = { A: { clientPortalSettings: { enabled: true, accessKey: 'fixture-A' } }, B: { clientPortalSettings: { enabled: true, accessKey: 'fixture-B' } } };
const mod = { exports: {} };
const source = fs.readFileSync(path.join(root, 'src/lib/security/portal-session.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
vm.runInNewContext(js, {
  exports: mod.exports, module: mod, Buffer, console,
  Date: { now: () => now },
  process: { env: { NODE_ENV: 'test', AK_SESSION_SECRET: 'audit-only-fictional-secret' } },
  require: (name) => {
    if (name === 'crypto') return require('node:crypto');
    if (name === 'next/headers') return { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) };
    if (name === '@/lib/fiesta/get-fiesta-raw') return { getFiestaByIdRaw: async (id) => events[id] };
    throw new Error('Unexpected dependency: ' + name);
  },
});
(async () => {
  const results = [];
  const check = async (name, expected, event = 'A') => {
    const actual = await mod.exports.verifyPortalSession(event);
    assert.equal(actual, expected, name);
    results.push({ name, result: 'PASS', allowed: actual });
  };
  await check('missing session denied', false);
  cookie = mod.exports.createPortalSession('A', 'fixture-A');
  const valid = cookie;
  await check('own event allowed', true);
  await check('event A cookie cannot access event B', false, 'B');
  cookie = valid.replace('A:', 'B:');
  await check('altered event rejected', false, 'B');
  cookie = valid;
  now += 12 * 60 * 60 * 1000 + 1;
  await check('expired cookie rejected', false);
  cookie = mod.exports.createPortalSession('A', 'fixture-A');
  events.A.clientPortalSettings.enabled = false;
  await check('disabled portal rejected', false);
  events.A.clientPortalSettings.enabled = true;
  delete events.A;
  await check('deleted event rejected', false);
  console.log(JSON.stringify({ scope: 'Actual session verifier; mocked cookies/storage/clock; no browser or network', results }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });

