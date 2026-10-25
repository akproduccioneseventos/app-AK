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
const source = '108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const baseline = '9b7ee982c5d6ff1377fccc0490abc85a9cfd8419';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const recordFile = path.join(dir, '166-entorno.json');
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
  const home = path.join(qa, '.qa166-home'); fs.mkdirSync(path.join(home, 'config'), { recursive: true });
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
  const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-166-'));
  git(['worktree', 'add', '--detach', qa, source]); fs.symlinkSync(deps, path.join(qa, 'node_modules'), 'junction');
  gate(qa);
  const record = { source, baseline, qa, preparedAt: new Date().toISOString(), phase: 'building',
    dependencySectionsAndLockEqual: true, packageScriptsDiffer: JSON.stringify(previous.scripts) !== JSON.stringify(next.scripts), realServices: false, appEdited: false };
  save(record);
  const result = await logged(['scripts/build-next-with-memory.mjs'], qa, environment(qa), '166-build');
  Object.assign(record, { buildExit: result.exitCode, buildPid: result.pid, finished: new Date().toISOString(),
    sourceDiff: git(['diff', '--name-only'], qa), phase: result.exitCode === 0 ? 'built' : 'build-failed' });
  save(record); console.log(JSON.stringify(record));
  if (record.buildExit !== 0 || record.sourceDiff) process.exitCode = 1;
} else throw new Error('Use prepare');
