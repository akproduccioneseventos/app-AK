import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = path.join(root, 'docs/evidencias');
const label = process.argv.find(arg => arg.startsWith('--label='))?.slice(8) || '168';
assert.match(label, /^168(?:-[a-z0-9-]+)?$/);
const recordFile = path.join(dir, `${label}-ejecucion.json`);
assert.equal(fs.existsSync(recordFile), false, 'Preserve receipt');
if (process.argv.includes('--wait')) {
  const deadline = Date.now() + 120000;
  while (os.freemem() < 768 * 1024 ** 2 && Date.now() < deadline) await new Promise(yes => setTimeout(yes, 10000));
}
assert.ok(os.freemem() >= 768 * 1024 ** 2, 'Under768MiB; no lightweight SDK QA');
const qa = JSON.parse(fs.readFileSync(path.join(dir,'166-entorno.json'),'utf8')).qa;
assert.ok(fs.existsSync(path.join(qa, '.git')));
const jar = 'C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/firebase-emulators/cloud-firestore-emulator-v1.22.0.jar';
const digest = crypto.createHash('sha256');
for await (const chunk of fs.createReadStream(jar)) digest.update(chunk);
assert.equal(digest.digest('hex'), '9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c');
const listener = net.createServer();
await new Promise((yes, no) => { listener.once('error', no); listener.listen(8085, '127.0.0.1', yes); });
await new Promise(yes => listener.close(yes));
const safe = Object.fromEntries(['PATH', 'TEMP', 'TMP', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'LOCALAPPDATA'].filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
const home = path.join(qa, '.qa168-home'); fs.mkdirSync(path.join(home, 'config'), { recursive: true });
const env = { ...safe, HOME: home, USERPROFILE: home, APPDATA: path.join(home, 'config'), XDG_CONFIG_HOME: path.join(home, 'config'),
  AK_ENTORNO_AISLADO: 'true', AK_USE_LOCAL_JSON_ONLY: 'false', NODE_ENV: 'production', GOOGLE_APPLICATION_CREDENTIALS: '',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', GCLOUD_PROJECT: 'demo-ak-producciones', GOOGLE_CLOUD_PROJECT: 'demo-ak-producciones',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy', AK_QA_RUN_LABEL: label };
const record = { source: '108e17b4387237fc921ea12e8d1eb65b20f62ac9', started: new Date().toISOString(), qa, actualSdk: true,
  realServices: false, memoryPlan: 'No Next/browser/build; Java heap256MiB, Node heap192MiB, guard768MiB' };
const emulatorLog = fs.createWriteStream(path.join(dir, `${label}-emulator.log`));
const child = spawn('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/java21/jdk-21.0.12.1+1/bin/java.exe',
  ['-Xmx256m', '-jar', jar, '--host', '127.0.0.1', '--port', '8085', '--project_id', 'demo-ak-producciones',
    '--single_project_mode', 'true', '--single_project_mode_error', 'true', '--rules', path.join(qa, 'firestore.rules')],
  { cwd: qa, env, stdio: ['ignore', 'pipe', 'pipe'] });
record.emulatorPid = child.pid;
child.stdout.pipe(emulatorLog, { end: false }); child.stderr.pipe(emulatorLog, { end: false });
try {
  const end = Date.now() + 60000;
  while (true) { try { await fetch('http://127.0.0.1:8085/', { signal: AbortSignal.timeout(1000) }); break; }
    catch (e) { if (Date.now() > end) throw e; await new Promise(yes => setTimeout(yes, 500)); } }
  const log = fs.createWriteStream(path.join(dir, `${label}-sdk.log`));
  const probe = spawn(process.execPath, ['--max-old-space-size=192', path.join(dir, '168-proveedor-sdk.mjs')], { cwd: qa, env, stdio: ['ignore', 'pipe', 'pipe'] });
  record.probePid = probe.pid; probe.stdout.pipe(log, { end: false }); probe.stderr.pipe(log, { end: false });
  const timer = setTimeout(() => { record.probeTimedOut = true; probe.kill(); }, 120000);
  try { record.exitCode = await new Promise((yes, no) => { probe.once('exit', yes); probe.once('error', no); }); }
  finally { clearTimeout(timer); await new Promise(yes => log.end(yes)); }
  if (record.exitCode !== 0 || record.probeTimedOut) process.exitCode = 1;
} catch (e) { record.error = String(e); process.exitCode = 1; }
finally {
  try { record.cleanupStatus = (await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-ak-producciones/databases/(default)/documents', { method: 'DELETE', signal: AbortSignal.timeout(5000) })).status; } catch (e) { record.cleanupError = String(e); }
  if (child.exitCode === null) { const ended = new Promise(yes => child.once('exit', yes)); child.kill(); await Promise.race([ended, new Promise(yes => setTimeout(yes, 5000))]); }
  await new Promise(yes => emulatorLog.end(yes));
  record.finished = new Date().toISOString();
  const status = spawnSync('git', ['diff', '--name-only'], { cwd: qa, encoding: 'utf8', env });
  record.sourceDiff = status.stdout.trim(); record.gitExit = status.status;
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n'); console.log(JSON.stringify(record));
  if (status.status !== 0 || record.sourceDiff) process.exitCode = 1;
}
