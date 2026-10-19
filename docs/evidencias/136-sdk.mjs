import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const record = JSON.parse(fs.readFileSync(path.join(root, 'docs/evidencias/135-entorno.json')));
const source = '7230f9d02b32805952a185f704a0208bd5d643e6';
if (record.sourceSha !== source || record.buildExit !== 0 ||
  spawnSync('git', ['rev-parse','HEAD'], { cwd: record.qa, encoding: 'utf8' }).stdout.trim() !== source) throw new Error('Wrong source/build');
if (fs.readdirSync(record.qa).some((name) => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(name))) throw new Error('Env files forbidden');
const mode = process.argv[2];
if (!['emulator','serve'].includes(mode)) throw new Error('Use emulator or serve');
const port = mode === 'emulator' ? 8085 : 3300;
const listener = net.createServer();
await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(port, '127.0.0.1', resolve); });
await new Promise((resolve) => listener.close(resolve));
const keys = ['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'];
const safe = Object.fromEntries(keys.filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]]));
const forced = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], {
  cwd: root, env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' }, encoding: 'utf8',
});
if (forced.status !== 0) throw new Error(forced.stderr);
const home = path.join(record.qa, '.qa136-home');
fs.mkdirSync(path.join(home, 'config'), { recursive: true });
const env = { ...safe, ...JSON.parse(forced.stdout).forzadas, HOME: home, USERPROFILE: home,
  APPDATA: path.join(home, 'config'), XDG_CONFIG_HOME: path.join(home, 'config'),
  AK_USE_LOCAL_JSON_ONLY: 'false', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
  GOOGLE_APPLICATION_CREDENTIALS: '', AK_DISABLE_STANDALONE: 'true', COMMIT_SHA: source };
const java = 'C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/java21/jdk-21.0.12.1+1/bin/java.exe';
const jar = 'C:/Users/Usuario/.cache/firebase/emulators/cloud-firestore-emulator-v1.22.0.jar';
const command = mode === 'emulator' ? java : process.execPath;
const args = mode === 'emulator' ? ['-Xmx512m','-jar',jar,'--host','127.0.0.1','--port','8085',
  '--project_id','demo-ak-producciones','--single_project_mode','true','--single_project_mode_error','true',
  '--rules',path.join(record.qa, 'firestore.rules')] : [path.join(record.qa,'node_modules/next/dist/bin/next'),
  'start','--hostname','127.0.0.1','--port','3300'];
const child = spawn(command, args, { cwd: record.qa, env, stdio: ['ignore','pipe','pipe'] });
const output = path.join(root, `docs/evidencias/136-sdk-${mode}-execution.json`);
const receipt = { source, buildFinishedAt: record.buildFinishedAt, mode, child: child.pid, command, args,
  started: new Date().toISOString(), emulator: env.FIRESTORE_EMULATOR_HOST, project: 'demo-ak-producciones',
  credentials: 'none; isolated HOME/config, localhost emulator only', status: 'running' };
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
const log = fs.createWriteStream(path.join(root, `docs/evidencias/136-sdk-${mode}.log`));
for (const stream of [child.stdout,child.stderr]) stream.on('data', (data) => { log.write(data); process.stdout.write(data); });
const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
await new Promise((resolve) => log.end(resolve));
fs.writeFileSync(output, JSON.stringify({ ...receipt, status: 'stopped', code, finished: new Date().toISOString() }, null, 2) + '\n');
