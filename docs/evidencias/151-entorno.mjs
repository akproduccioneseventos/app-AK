import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'docs/evidencias');
const source = '2e5363f259461a31bf6b31807872c227855415de';
const baseline = '7230f9d02b32805952a185f704a0208bd5d643e6';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const recordFile = path.join(dir, '151-entorno.json');
const safe = Object.fromEntries(['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT', 'LOCALAPPDATA']
  .filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
const git = (args, cwd = root) => {
  const r = spawnSync('git', args, { cwd, env: safe, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout); return r.stdout.trim();
};
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const save = r => fs.writeFileSync(recordFile, JSON.stringify(r, null, 2) + '\n');
function gate(qa) {
  assert.equal(git(['rev-parse', 'HEAD'], qa), source);
  assert.equal(git(['diff', '--name-only'], qa), '');
  assert.equal(fs.readdirSync(qa).some(n => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)), false);
}
function environment(qa) {
  const r = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], { cwd: root,
    env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  const home = path.join(qa, '.qa151-home'); fs.mkdirSync(path.join(home, 'config'), { recursive: true });
  return { ...safe, ...JSON.parse(r.stdout).forzadas, HOME: home, USERPROFILE: home,
    APPDATA: path.join(home, 'config'), XDG_CONFIG_HOME: path.join(home, 'config'),
    AK_DISABLE_STANDALONE: 'true', COMMIT_SHA: source, NODE_ENV: 'production' };
}
async function logged(args, qa, env, label) {
  const file = path.join(dir, `${label}.log`); const log = fs.createWriteStream(file);
  const child = spawn(process.execPath, args, { cwd: qa, env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  const exitCode = await new Promise((yes, no) => { child.once('exit', yes); child.once('error', no); });
  await new Promise(yes => log.end(yes));
  fs.writeFileSync(file + '.gz', gzipSync(fs.readFileSync(file)));
  return { pid: child.pid, exitCode };
}
if (process.argv[2] === 'prepare') {
  if (fs.existsSync(recordFile)) throw new Error('Preserve source/build receipt');
  if (process.argv[3] === 'wait') {
    const deadline = Date.now() + 10 * 60 * 1000;
    while (os.freemem() < 2 * 1024 ** 3 && Date.now() < deadline) await new Promise(yes => setTimeout(yes, 30000));
  }
  if (os.freemem() < 2 * 1024 ** 3) throw new Error('Do not build under2GiB free');
  const previous = JSON.parse(git(['show', `${baseline}:package.json`]));
  const next = JSON.parse(git(['show', `${source}:package.json`]));
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'overrides', 'engines']) assert.deepEqual(next[key], previous[key], key);
  assert.equal(git(['rev-parse', `${source}:package-lock.json`]), git(['rev-parse', `${baseline}:package-lock.json`]));
  const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-151-'));
  git(['worktree', 'add', '--detach', qa, source]); fs.symlinkSync(deps, path.join(qa, 'node_modules'), 'junction');
  gate(qa);
  const record = { source, baseline, qa, preparedAt: new Date().toISOString(), phase: 'building',
    dependencySectionsAndLockEqual: true, packageScriptsDiffer: true, realServices: false, appEdited: false };
  save(record);
  const result = await logged(['scripts/build-next-with-memory.mjs'], qa, environment(qa), '151-build');
  Object.assign(record, { buildExit: result.exitCode, buildPid: result.pid, finished: new Date().toISOString(),
    sourceDiff: git(['diff', '--name-only'], qa), phase: result.exitCode === 0 ? 'built' : 'build-failed' });
  save(record); console.log(JSON.stringify(record));
  if (record.buildExit !== 0 || record.sourceDiff) process.exitCode = 1;
} else if (process.argv[2] === 'test') {
  const record = JSON.parse(fs.readFileSync(recordFile)); assert.equal(record.source, source); assert.equal(record.buildExit, 0);
  const scope = process.argv[3];
  const mobile = scope === 'mobile', date = scope === 'date', agenda = scope === 'agenda', boundary = scope === 'boundary';
  if (!mobile && !date && !agenda && !boundary) throw new Error('Use mobile/date/agenda/boundary');
  const prefix = process.argv[4] || `151-${scope}`;
  assert.match(prefix, /^151-[a-z0-9-]+$/);
  const receiptPath = path.join(dir, `${prefix}-execution.json`);
  if (fs.existsSync(receiptPath)) throw new Error('Preserve execution receipt');
  gate(record.qa);
  if (os.freemem() < 512 * 1024 ** 2) throw new Error('Under512MiB; no browser QA');
  const listener = net.createServer();
  await new Promise((yes, no) => { listener.once('error', no); listener.listen(3300, '127.0.0.1', yes); });
  await new Promise(yes => listener.close(yes));
  const env = environment(record.qa);
  const receipt = { source, scope, buildFinished: record.finished, started: new Date().toISOString(), realServices: false };
  const inside = file => { const resolved = path.resolve(file); if (!resolved.startsWith(path.resolve(record.qa) + path.sep)) throw new Error('Outside own QA'); return resolved; };
  const jsonFiles = () => {
    const files = [];
    function walk(folder) { if (!fs.existsSync(folder)) return; for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = inside(path.join(folder, item.name)); if (item.isDirectory() && !item.isSymbolicLink()) walk(file);
      else if (item.isFile() && item.name.endsWith('.json')) files.push(file);
    } }
    for (const folder of ['data', 'src/data']) walk(path.join(record.qa, folder)); return files;
  };
  const snapshots = new Map(jsonFiles().map(f => [f, fs.readFileSync(f)]));
  const file = mobile ? '135-mobile-contrato-social.spec.ts' : date ? '143-cocina-fecha-local.spec.ts' : '150-agenda-catalogo.spec.ts';
  const config = date ? '143-playwright.config.ts' : '135-playwright.config.ts';
  const copies = new Map();
  const log = fs.createWriteStream(path.join(dir, `${prefix}-serve.log`));
  const server = spawn(process.execPath, [path.join(deps, 'next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3300'],
    { cwd: record.qa, env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.pipe(log, { end: false }); server.stderr.pipe(log, { end: false }); receipt.serverPid = server.pid;
  try {
    const end = Date.now() + 90000;
    do { try {
      const h = await (await fetch('http://127.0.0.1:3300/api/health', { signal: AbortSignal.timeout(10000) })).json();
      if (!h.version?.startsWith(source) || Object.values(h.services).some(Boolean)) throw new Error('Unsafe health'); receipt.health = h; break;
    } catch (e) { if (Date.now() >= end) throw e; await new Promise(yes => setTimeout(yes, 1000)); } } while (!receipt.health);
    if (boundary) {
      receipt.run = await logged([path.join(dir, '151-frontera-http.mjs')], record.qa,
        { ...env, AK_QA_EVIDENCE_DIR: dir }, prefix);
    } else {
    for (const [from, to] of [[path.join(dir, mobile ? '151-mobile-source.spec.ts' : date ? '151-date-source.spec.ts' : '151-agenda-source.spec.ts'), path.join(record.qa, 'tests/e2e', file)],
      [path.join(dir, date ? '151-date-config.ts' : '151-mobile-config.ts'), path.join(record.qa, config)]]) {
      copies.set(to, fs.existsSync(to) ? fs.readFileSync(to) : null); fs.copyFileSync(from, to);
    }
    receipt.testSha256 = hash(fs.readFileSync(path.join(record.qa, 'tests/e2e', file)));
    receipt.run = await logged([path.join(deps, '@playwright/test/cli.js'), 'test', '--config', config, file,
      ...(mobile ? ['--project=chromium-mobile'] : []), '--output', path.join(dir, `${prefix}-artifacts`)], record.qa,
      { ...env, AK_QA_RESULTS: path.join(dir, `${prefix}-results.json`), PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300' }, prefix);
    }
    if (receipt.run.exitCode) process.exitCode = 1;
  } catch (e) { receipt.error = String(e); process.exitCode = 1; }
  finally {
    if (server.exitCode === null) { const exited = new Promise(yes => server.once('exit', yes)); server.kill(); await Promise.race([exited, new Promise(yes => setTimeout(yes, 5000))]); }
    await new Promise(yes => log.end(yes));
    for (const [f, bytes] of copies) { if (bytes === null) fs.unlinkSync(inside(f)); else fs.writeFileSync(inside(f), bytes); }
    for (const f of jsonFiles()) if (!snapshots.has(f)) fs.unlinkSync(inside(f));
    for (const [f, bytes] of snapshots) fs.writeFileSync(inside(f), bytes);
    receipt.snapshotCount = snapshots.size; receipt.sourceDiff = git(['diff', '--name-only'], record.qa); receipt.finished = new Date().toISOString();
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, `${prefix}-serve.log.gz`), gzipSync(fs.readFileSync(path.join(dir, `${prefix}-serve.log`))));
    if (receipt.sourceDiff) process.exitCode = 1;
    console.log(JSON.stringify({ scope, result: receipt.run, error: receipt.error, sourceDiff: receipt.sourceDiff }));
  }
} else throw new Error('Use prepare or test');
