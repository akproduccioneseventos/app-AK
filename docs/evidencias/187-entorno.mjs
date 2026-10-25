import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'docs/evidencias');
const source = '09ea4138f5146cd2dfa6b792eda31cc04c30843f';
const baseline = '108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const recordFile = path.join(dir, '187-entorno.json');
const safe = Object.fromEntries(['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT', 'LOCALAPPDATA']
  .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
function git(args, cwd = root) {
  const result = spawnSync('git', args, { cwd, env: safe, encoding: 'utf8', maxBuffer: 16 * 1024 ** 2 });
  assert.equal(result.status, 0, result.stderr || result.stdout); return result.stdout.trim();
}
const save = record => fs.writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n');
function gate(qa) {
  assert.equal(git(['rev-parse', 'HEAD'], qa), source);
  assert.equal(git(['diff', '--name-only'], qa), '');
  assert.equal(fs.readdirSync(qa).some(name => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(name)), false);
}
function environment(qa) {
  const result = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], { cwd: qa,
    env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const home = path.join(qa, '.qa187-home'); fs.mkdirSync(path.join(home, 'config'), { recursive: true });
  return { ...safe, ...JSON.parse(result.stdout).forzadas, HOME: home, USERPROFILE: home,
    APPDATA: path.join(home, 'config'), XDG_CONFIG_HOME: path.join(home, 'config'),
    AK_DISABLE_STANDALONE: 'true', COMMIT_SHA: source, NODE_ENV: 'production' };
}
assert.equal(process.argv[2], 'prepare');
assert.equal(fs.existsSync(recordFile), false, 'Preserve source/build receipt');
const waitStarted = Date.now();
const initialFreeBytes = os.freemem();
if (process.argv.includes('--wait')) {
  const deadline = Date.now() + 5 * 60 * 1000;
  while (os.freemem() < 2 * 1024 ** 3 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 30000));
}
const preflight = { checkedAt: new Date().toISOString(), initialFreeBytes, waitedMs: Date.now() - waitStarted, freeBytes: os.freemem(), source };
const initialPreflight = path.join(dir, '187-preflight-primer-intento.json');
if (fs.existsSync(path.join(dir, '187-preflight.json')) && !fs.existsSync(initialPreflight)) fs.copyFileSync(path.join(dir, '187-preflight.json'), initialPreflight);
fs.writeFileSync(path.join(dir, '187-preflight.json'), JSON.stringify(preflight, null, 2) + '\n');
assert.ok(preflight.freeBytes >= 2 * 1024 ** 3, 'Do not build under2GiB free');
const previous = JSON.parse(git(['show', `${baseline}:package.json`]));
const next = JSON.parse(git(['show', `${source}:package.json`]));
for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'overrides', 'engines']) assert.deepEqual(next[key], previous[key], key);
assert.equal(git(['rev-parse', `${source}:package-lock.json`]), git(['rev-parse', `${baseline}:package-lock.json`]));
const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-187-'));
git(['worktree', 'add', '--detach', qa, source]);
fs.symlinkSync(deps, path.join(qa, 'node_modules'), 'junction');
gate(qa);
const record = { source, baseline, qa, preparedAt: new Date().toISOString(), phase: 'building',
  dependencySectionsAndLockEqual: true, realServices: false, appEdited: false, preflight };
save(record);
const logFile = path.join(dir, '187-build.log'), log = fs.createWriteStream(logFile);
const child = spawn(process.execPath, ['scripts/build-next-with-memory.mjs'], { cwd: qa, env: environment(qa), stdio: ['ignore', 'pipe', 'pipe'] });
record.buildPid = child.pid; save(record);
child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
let interrupted = false;
const stop = () => { interrupted = true; child.kill('SIGTERM'); };
process.once('SIGINT', stop); process.once('SIGTERM', stop);
const buildExit = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
await new Promise(resolve => log.end(resolve));
fs.writeFileSync(logFile + '.gz', gzipSync(fs.readFileSync(logFile)));
Object.assign(record, { buildExit, interrupted, finished: new Date().toISOString(), sourceDiff: git(['diff', '--name-only'], qa),
  phase: buildExit === 0 ? 'built' : 'build-failed' });
save(record); console.log(JSON.stringify(record));
if (buildExit !== 0 || record.sourceDiff) process.exitCode = 1;
