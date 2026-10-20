import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'docs/evidencias');
const source = '03cd87d59dcdd35ac26108d3d7fe979b6a4bf83b';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const recordFile = path.join(dir, '148-revalidacion-proveedor.json');
if (fs.existsSync(recordFile)) throw new Error('Preserve previous receipt; do not rerun unchanged source');
if (os.freemem() < 1024 ** 3) throw new Error('Less than1GiB free; no new test process');
const names = ['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'PROGRAMDATA', 'PROGRAMFILES', 'LOCALAPPDATA'];
const safe = Object.fromEntries(names.filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]]));
const git = (args, cwd = root) => {
  const result = spawnSync('git', args, { cwd, env: safe, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr); return result.stdout.trim();
};
if (git(['diff', '--name-only', '17d26a631f500a263c48c4973d9c6f57d56ba421', source, '--', 'package.json', 'package-lock.json'])) {
  throw new Error('Do not reuse dependencies after package/lock change');
}
const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-148-'));
git(['worktree', 'add', '--detach', qa, source]);
fs.symlinkSync(deps, path.join(qa, 'node_modules'), 'junction');
if (fs.readdirSync(qa).some((name) => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(name))) throw new Error('Real env file forbidden');
const home = path.join(qa, '.qa148-home'); fs.mkdirSync(path.join(home, 'config'), { recursive: true });
const forced = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], {
  cwd: root, env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8' });
if (forced.status !== 0) throw new Error(forced.stderr);
const env = { ...safe, ...JSON.parse(forced.stdout).forzadas, HOME: home, USERPROFILE: home,
  APPDATA: path.join(home, 'config'), XDG_CONFIG_HOME: path.join(home, 'config'), NODE_ENV: 'test' };
const test = 'src/__tests__/reponer-plata-identidad-proveedor.test.ts';
const file = 'src/lib/fiesta/reponer-la-plata.ts';
const hash = (name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(qa, name))).digest('hex');
const resultFile = path.join(dir, '148-jest-results.json');
const record = { source, pr: 1333, qa, test, testSha256: hash(test), file, fileSha256: hash(file),
  started: new Date().toISOString(), realServices: false, appEdited: false,
  scope: 'Four helper regression cases only; no full authenticated saveFiesta or persisted payment' };
const logFile = path.join(dir, '148-jest.log');
const log = fs.createWriteStream(logFile);
const child = spawn(process.execPath, [path.join(deps, 'jest/bin/jest.js'), '--runInBand', '--runTestsByPath', test,
  '--json', `--outputFile=${resultFile}`], { cwd: qa, env, stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
record.pid = child.pid;
record.exitCode = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
await new Promise((resolve) => log.end(resolve));
record.finished = new Date().toISOString();
record.sourceDiff = git(['diff', '--name-only'], qa);
if (fs.existsSync(resultFile)) {
  const bytes = fs.readFileSync(resultFile); const result = JSON.parse(bytes);
  record.resultSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  record.summary = { suites: result.numTotalTestSuites, tests: result.numTotalTests,
    passed: result.numPassedTests, failed: result.numFailedTests, pending: result.numPendingTests,
    success: result.success };
  fs.writeFileSync(resultFile + '.gz', gzipSync(bytes));
}
fs.writeFileSync(logFile + '.gz', gzipSync(fs.readFileSync(logFile)));
record.acceptance = record.exitCode === 0 && record.summary?.passed === 4 && record.summary?.failed === 0 &&
  record.summary?.pending === 0 && !record.sourceDiff ? 'PASS_ORDER185_HELPER_ONLY' : 'NOT_ACCEPTED';
fs.writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ acceptance: record.acceptance, source, summary: record.summary, sourceDiff: record.sourceDiff }));
if (record.acceptance !== 'PASS_ORDER185_HELPER_ONLY') process.exitCode = 1;
