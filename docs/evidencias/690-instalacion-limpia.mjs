import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./', import.meta.url));
const root = path.resolve(dir, '../..');
const source = 'd4c69f2b2395ad3abcaee4fb166bcefbdc1457e0';
const output = path.join(dir, '690-instalacion.json');
assert(!fs.existsSync(output), 'Do not overwrite a receipt');
const safe = Object.fromEntries(['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'LOCALAPPDATA'].filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
const record = { source, started: new Date().toISOString(), phase: 'prepare', appEdited: false, realServices: false, lifecycleScriptsExecuted: false };
const save = () => fs.writeFileSync(output, JSON.stringify(record, null, 2) + '\n');
save();
const git = args => { const r = spawnSync('git', args, { cwd: root, env: safe, encoding: 'utf8', maxBuffer: 4 * 1024 ** 2 }); assert.equal(r.status, 0, r.stderr); return r.stdout; };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  assert.equal(git(['diff', '--name-only', source, 'HEAD', '--', 'src', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json']).trim(), '', 'Application source changed');
  assert(os.freemem() > 768 * 1024 ** 2, 'Insufficient memory for isolated install');
  const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-690-install-'));
  record.qa = qa;
  const home = path.join(qa, '.home');
  fs.mkdirSync(home);
  for (const file of ['package.json', 'package-lock.json']) fs.writeFileSync(path.join(qa, file), git(['show', `${source}:${file}`]));
  const lockBefore = fs.readFileSync(path.join(qa, 'package-lock.json'));
  record.packageSha256 = sha(fs.readFileSync(path.join(qa, 'package.json')));
  record.lockSha256 = sha(lockBefore);
  const env = { ...safe, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home, GOOGLE_APPLICATION_CREDENTIALS: '', NPM_CONFIG_USERCONFIG: path.join(home, 'empty.npmrc'), NPM_CONFIG_GLOBALCONFIG: path.join(home, 'global.npmrc'), NPM_CONFIG_CACHE: path.join(home, 'cache'), NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/', NODE_OPTIONS: '--max-old-space-size=768' };
  fs.writeFileSync(env.NPM_CONFIG_USERCONFIG, '');
  fs.writeFileSync(env.NPM_CONFIG_GLOBALCONFIG, '');
  const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  assert(fs.existsSync(npm));
  const log = fs.createWriteStream(path.join(dir, '690-npm-ci.log'));
  const child = spawn(process.execPath, [npm, 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: qa, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  record.phase = 'npm-ci'; record.pid = child.pid; save();
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  record.exit = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
  await new Promise(resolve => log.end(resolve));
  record.lockUnchanged = sha(fs.readFileSync(path.join(qa, 'package-lock.json'))) === sha(lockBefore);
  if (record.exit === 0) {
    const lock = JSON.parse(lockBefore);
    const installed = name => JSON.parse(fs.readFileSync(path.join(qa, 'node_modules', name, 'package.json'))).version;
    record.versions = Object.fromEntries(['@types/estree', 'typescript', 'next', 'react', 'react-dom', 'sharp'].map(name => [name, { installed: installed(name), locked: lock.packages[`node_modules/${name}`].version }]));
    assert(Object.values(record.versions).every(v => v.installed === v.locked));
    assert(record.lockUnchanged);
    record.phase = 'install-pass';
  } else record.phase = 'install-fail';
  record.limits = 'Manifest-only clean npm ci with lifecycle scripts DISABLED and fresh isolated npm cache/home. No app execution, native postinstall, Firebase, build, credentials or provider calls. This does not replace source-D4 build/browser acceptance or prove clean full build.';
} catch (error) {
  record.phase = 'not-completed'; record.error = String(error.stack || error); process.exitCode = 1;
} finally {
  record.finished = new Date().toISOString(); save();
  console.log(JSON.stringify(record));
  if (record.exit !== undefined && record.exit !== 0) process.exitCode = 1;
}
