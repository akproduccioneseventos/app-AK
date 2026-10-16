import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'docs/evidencias');
const record = JSON.parse(fs.readFileSync(path.join(dir, '135-entorno.json')));
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
const local = process.argv[2] === 'json';
const mobile = process.argv[3] === 'mobile';
const prefix = local ? (mobile ? '139-json-mobile' : '139-json') : (process.argv[2] === 'sdk-final' ? '139-sdk-final' : '139');
const qa = record.qa;
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const git = (args) => spawnSync('git', args, { cwd: qa, encoding: 'utf8' });
if (record.sourceSha !== source || record.buildExit !== 0 || git(['rev-parse', 'HEAD']).stdout.trim() !== source ||
    git(['diff', '--name-only']).stdout.trim()) throw new Error('Source/build gate failed');
if (fs.readdirSync(qa).some((n) => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n))) throw new Error('Env files forbidden');
if (os.freemem() < 512 * 1024 * 1024) throw new Error('QA resource gate: under512MiB free; do not overlap another build');
for (const port of [3300, 8085]) {
  const s = net.createServer();
  await new Promise((yes, no) => { s.once('error', no); s.listen(port, '127.0.0.1', yes); });
  await new Promise((yes) => s.close(yes));
}
const keys = ['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT', 'LOCALAPPDATA'];
const safe = Object.fromEntries(keys.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]]));
const forced = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], { cwd: root,
  env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8' });
if (forced.status !== 0) throw new Error(forced.stderr);
const home = path.join(qa, '.qa139-home');
fs.mkdirSync(path.join(home, 'config'), { recursive: true });
const env = { ...safe, ...JSON.parse(forced.stdout).forzadas, HOME: home, USERPROFILE: home,
  APPDATA: path.join(home, 'config'), XDG_CONFIG_HOME: path.join(home, 'config'),
  AK_USE_LOCAL_JSON_ONLY: local ? 'true' : 'false', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
  GOOGLE_APPLICATION_CREDENTIALS: '', AK_DISABLE_STANDALONE: 'true', COMMIT_SHA: source };
if (local) for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) delete env[name];
const files = new Map();
const jsonFiles = () => ['data', 'src/data'].flatMap((folder) => fs.existsSync(path.join(qa, folder))
  ? fs.readdirSync(path.join(qa, folder)).filter((n) => n.endsWith('.json')).map((n) => path.join(qa, folder, n)) : []);
for (const file of jsonFiles()) files.set(file, fs.readFileSync(file));
const children = [];
const logs = [];
const receipt = { source, buildFinishedAt: record.buildFinishedAt, started: new Date().toISOString(),
  fixture: local ? 'Modo JSON local autorizado; NO acepta el guardado SDK de produccion.' : 'Firestore demo local. backup_system/auto_backup con ultimo respaldo ficticio reciente para aislar alta; NO prueba respaldo.',
  children: [], realServices: false, snapshots: files.size };
const save = () => fs.writeFileSync(path.join(dir, `${prefix}-execution.json`), JSON.stringify(receipt, null, 2) + '\n');
const launch = (label, command, args, extra = {}) => {
  const log = fs.createWriteStream(path.join(dir, `${prefix}-${label}.log`)); logs.push(log);
  const child = spawn(command, args, { cwd: qa, env: { ...env, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
  children.push(child); receipt.children.push({ label, pid: child.pid, command, args }); save();
  return child;
};
const until = async (fn, limit = 45_000) => {
  const end = Date.now() + limit; let last;
  do { try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 1000)); } } while (Date.now() < end);
  throw last;
};
try {
  if (!local) {
  launch('emulator', 'C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/java21/jdk-21.0.12.1+1/bin/java.exe',
    ['-Xmx512m', '-jar', 'C:/Users/Usuario/.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar',
      '--host', '127.0.0.1', '--port', '8085', '--project_id', 'demo-ak-producciones', '--single_project_mode', 'true',
      '--single_project_mode_error', 'true', '--rules', path.join(qa, 'firestore.rules')]);
  const url = 'http://127.0.0.1:8085/v1/projects/demo-ak-producciones/databases/(default)/documents/backup_system/auto_backup';
  await until(async () => {
    const r = await fetch(url, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { lastCompletedAtMs: { integerValue: String(Date.now()) }, leaseUntilMs: { integerValue: '0' } } }),
      signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`Seed ${r.status}`);
  });
  }
  launch('serve', process.execPath, [path.join(qa, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3300']);
  receipt.health = await until(async () => {
    const h = await (await fetch('http://127.0.0.1:3300/api/health', { signal: AbortSignal.timeout(15_000) })).json();
    if (!h.version?.startsWith(source) || Object.entries(h.services).some(([k, v]) => v && k !== 'firebase')) throw new Error('Unsafe health');
    if (local ? h.services.firebase : !h.services.firebase) throw new Error('Unexpected Firebase mode');
    return h;
  }, 90_000);
  fs.copyFileSync(path.join(root, 'tests/e2e/139-cliente-persistencia.spec.ts'), path.join(qa, 'tests/e2e/139-cliente-persistencia.spec.ts'));
  fs.copyFileSync(path.join(dir, '139-playwright.config.ts'), path.join(qa, '139-playwright.config.ts'));
  receipt.testSha256 = sha(fs.readFileSync(path.join(root, 'tests/e2e/139-cliente-persistencia.spec.ts')));
  const run = launch('playwright', process.execPath, [path.join(qa, 'node_modules/@playwright/test/cli.js'), 'test',
    '--config', '139-playwright.config.ts', '139-cliente-persistencia.spec.ts', ...(mobile ? ['--project=chromium-mobile'] : []), '--output', path.join(dir, `${prefix}-artifacts`)],
    { AK_QA_RESULTS: path.join(dir, `${prefix}-results.json`), AK_QA_CLIENT_STORAGE: local ? 'json' : 'sdk' });
  receipt.exitCode = await new Promise((yes, no) => { run.once('exit', yes); run.once('error', no); });
  process.exitCode = receipt.exitCode === 0 ? 0 : 1;
} catch (e) {
  receipt.error = String(e); process.exitCode = 1;
} finally {
  for (const child of children.reverse()) {
    if (child.exitCode === null) {
      const exited = new Promise((yes) => child.once('exit', yes));
      child.kill(); await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))]);
    }
  }
  for (const log of logs) await new Promise((r) => log.end(r));
  const restored = [];
  for (const [file, bytes] of files) {
    if (!fs.readFileSync(file).equals(bytes)) restored.push(path.relative(qa, file));
    fs.writeFileSync(file, bytes);
  }
  for (const file of jsonFiles()) if (!files.has(file)) {
    if (!path.resolve(file).startsWith(path.resolve(qa) + path.sep)) throw new Error('Cleanup outside QA');
    fs.unlinkSync(file); restored.push(path.relative(qa, file));
  }
  receipt.restored = restored;
  receipt.sourceDiff = git(['diff', '--name-only']).stdout.trim();
  receipt.finished = new Date().toISOString(); save();
  if (receipt.sourceDiff) process.exitCode = 1;
  for (const label of ['emulator', 'serve', 'playwright']) {
    const file = path.join(dir, `${prefix}-${label}.log`);
    if (fs.existsSync(file)) fs.writeFileSync(file + '.gz', gzipSync(fs.readFileSync(file)));
  }
  console.log(JSON.stringify({ exitCode: receipt.exitCode, error: receipt.error, sourceDiff: receipt.sourceDiff, finished: receipt.finished }));
}
