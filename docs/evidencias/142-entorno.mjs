import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'docs/evidencias');
const source = '17d26a631f500a263c48c4973d9c6f57d56ba421';
const deps = 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules';
const recordFile = path.join(dir, '142-entorno.json');
const safeNames = ['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT', 'LOCALAPPDATA'];
const safe = Object.fromEntries(safeNames.filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]]));
const checked = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, env: safe, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
};
const forcedRun = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], { cwd: root,
  env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8' });
if (forcedRun.status !== 0) throw new Error(forcedRun.stderr);
const forced = JSON.parse(forcedRun.stdout).forzadas;
const save = (record) => fs.writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n');
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const environment = (qa) => {
  const home = path.join(qa, '.qa142-home');
  fs.mkdirSync(path.join(home, 'config'), { recursive: true });
  return { ...safe, ...forced, HOME: home, USERPROFILE: home, APPDATA: path.join(home, 'config'),
    XDG_CONFIG_HOME: path.join(home, 'config'), AK_DISABLE_STANDALONE: 'true', COMMIT_SHA: source };
};
const gate = (qa) => {
  if (checked('git', ['rev-parse', 'HEAD'], qa) !== source) throw new Error('Wrong QA source');
  if (checked('git', ['diff', '--name-only'], qa)) throw new Error('Dirty QA source');
  if (fs.readdirSync(qa).some((name) => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(name))) {
    throw new Error('Real env files forbidden');
  }
};
const runLogged = async (command, args, qa, env, label) => {
  const log = fs.createWriteStream(path.join(dir, `${label}.log`));
  const child = spawn(command, args, { cwd: qa, env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  const exitCode = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
  await new Promise((resolve) => log.end(resolve));
  fs.writeFileSync(path.join(dir, `${label}.log.gz`), gzipSync(fs.readFileSync(path.join(dir, `${label}.log`))));
  return { pid: child.pid, exitCode };
};

if (process.argv[2] === 'prepare') {
  if (fs.existsSync(recordFile)) throw new Error('142 already exists; preserve this source and build receipt');
  if (os.freemem() < 2 * 1024 ** 3) throw new Error('Do not build with less than2GiB free');
  if (checked('git', ['diff', '--name-only', '7230f9d02b32805952a185f704a0208bd5d643e6', source,
    '--', 'package.json', 'package-lock.json'])) throw new Error('Dependencies changed; do not reuse node_modules');
  const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-142-'));
  checked('git', ['worktree', 'add', '--detach', qa, source]);
  fs.symlinkSync(deps, path.join(qa, 'node_modules'), 'junction');
  gate(qa);
  const record = { sourceSha: source, candidatePR: 1327, qa, preparedAt: new Date().toISOString(),
    realServicesEnabled: false, applicationEdited: false, phase: 'building' };
  save(record);
  const result = await runLogged(process.execPath, ['scripts/build-next-with-memory.mjs'], qa, environment(qa), '142-build');
  Object.assign(record, { buildExit: result.exitCode, buildPid: result.pid, buildFinishedAt: new Date().toISOString(),
    phase: result.exitCode === 0 ? 'built' : 'build-failed', sourceDiff: checked('git', ['diff', '--name-only'], qa) });
  save(record); console.log(JSON.stringify(record));
  if (result.exitCode !== 0 || record.sourceDiff) process.exitCode = 1;
} else if (process.argv[2] === 'test') {
  const evidence = process.argv[3] || '142';
  if (!['142', '143', '143-civil'].includes(evidence)) throw new Error('Unknown audit scope');
  if (fs.existsSync(path.join(dir, `${evidence}-execution.json`))) throw new Error('Preserve previous execution receipt');
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  if (record.sourceSha !== source || record.buildExit !== 0) throw new Error('Source/build mismatch');
  gate(record.qa);
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(3300, '127.0.0.1', resolve); });
  await new Promise((resolve) => listener.close(resolve));
  const env = environment(record.qa);
  const snapshots = new Map();
  const dataFiles = () => ['data', 'src/data'].flatMap((folder) => fs.existsSync(path.join(record.qa, folder))
    ? fs.readdirSync(path.join(record.qa, folder)).filter((name) => name.endsWith('.json')).map((name) => path.join(record.qa, folder, name)) : []);
  for (const file of dataFiles()) snapshots.set(file, fs.readFileSync(file));
  const receipt = { source, buildFinishedAt: record.buildFinishedAt, started: new Date().toISOString(),
    snapshots: snapshots.size, realServices: false, tests: [] };
  const log = fs.createWriteStream(path.join(dir, `${evidence}-serve.log`));
  const server = spawn(process.execPath, [path.join(deps, 'next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3300'],
    { cwd: record.qa, env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.pipe(log, { end: false }); server.stderr.pipe(log, { end: false });
  receipt.serverPid = server.pid;
  try {
    const deadline = Date.now() + 90_000;
    do {
      try {
        const health = await (await fetch('http://127.0.0.1:3300/api/health', { signal: AbortSignal.timeout(15_000) })).json();
        if (!health.version?.startsWith(source) || Object.values(health.services).some(Boolean)) throw new Error('Unsafe QA health');
        receipt.health = health; break;
      } catch (error) {
        if (Date.now() >= deadline) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } while (!receipt.health);
    for (const file of evidence.startsWith('143') ? ['143-cocina-fecha-local.spec.ts'] : ['135-cocina-agenda-3d.spec.ts', '135-mobile-contrato-social.spec.ts']) {
      const bytes = fs.readFileSync(path.join(root, 'tests/e2e', file));
      fs.writeFileSync(path.join(record.qa, 'tests/e2e', file), bytes);
      receipt.tests.push({ file, sha256: hash(bytes) });
    }
    const config = evidence.startsWith('143') ? '143-playwright.config.ts' : '135-playwright.config.ts';
    fs.copyFileSync(path.join(dir, config), path.join(record.qa, config));
    for (const [label, file, selector] of evidence.startsWith('143') ? [[`${evidence}-date`, '143-cocina-fecha-local.spec.ts', []]] : [
      ['142-kitchen', '135-cocina-agenda-3d.spec.ts', ['--grep', 'cocina:']],
      ['142-mobile', '135-mobile-contrato-social.spec.ts', ['--project=chromium-mobile']],
    ]) {
      const result = await runLogged(process.execPath, [path.join(deps, '@playwright/test/cli.js'), 'test',
        '--config', config, file, ...selector, '--output', path.join(dir, `${label}-artifacts`)],
      record.qa, { ...env, AK_QA_RESULTS: path.join(dir, `${label}-results.json`), PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300' }, label);
      receipt[label] = result;
      if (result.exitCode !== 0) process.exitCode = 1;
    }
  } catch (error) {
    receipt.error = String(error); process.exitCode = 1;
  } finally {
    if (server.exitCode === null) {
      const exited = new Promise((resolve) => server.once('exit', resolve)); server.kill();
      await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5000))]);
    }
    await new Promise((resolve) => log.end(resolve));
    receipt.restored = [];
    for (const [file, bytes] of snapshots) {
      if (!fs.readFileSync(file).equals(bytes)) receipt.restored.push(path.relative(record.qa, file));
      fs.writeFileSync(file, bytes);
    }
    for (const file of dataFiles()) if (!snapshots.has(file)) {
      if (!path.resolve(file).startsWith(path.resolve(record.qa) + path.sep)) throw new Error('Cleanup outside QA');
      fs.unlinkSync(file); receipt.restored.push(path.relative(record.qa, file));
    }
    receipt.sourceDiff = checked('git', ['diff', '--name-only'], record.qa);
    receipt.finished = new Date().toISOString();
    fs.writeFileSync(path.join(dir, `${evidence}-execution.json`), JSON.stringify(receipt, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, `${evidence}-serve.log.gz`), gzipSync(fs.readFileSync(path.join(dir, `${evidence}-serve.log`))));
    if (receipt.sourceDiff) process.exitCode = 1;
    console.log(JSON.stringify({ error: receipt.error, kitchen: receipt['142-kitchen'], mobile: receipt['142-mobile'], sourceDiff: receipt.sourceDiff }));
  }
} else throw new Error('Use prepare or test');
