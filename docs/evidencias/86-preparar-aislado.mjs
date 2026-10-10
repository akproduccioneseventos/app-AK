import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const repo = fs.realpathSync(process.cwd());
const sha = '1b61295a';
const exact = execFileSync('git', ['rev-parse', `${sha}^{commit}`], { encoding: 'utf8' }).trim();
const cwd = process.argv[2] ? fs.realpathSync(process.argv[2]) : fs.mkdtempSync(path.join(os.tmpdir(), 'ak-entorno-aislado-'));
if (path.dirname(fs.realpathSync(cwd)) !== fs.realpathSync(os.tmpdir()) || !path.basename(cwd).startsWith('ak-entorno-aislado-')) throw new Error('TEMP invalido');
if (!process.argv[2]) execFileSync('git', ['worktree', 'add', '--detach', cwd, exact], { stdio: 'inherit' });
if (execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== exact) throw new Error('SHA no corresponde');
if (fs.readdirSync(cwd).some(n => /^\.env(\.(local|production|development|test)(\.local)?)?$/.test(n))) {
  throw new Error('Hay archivos de credenciales; no arrancar.');
}
if (!fs.existsSync(path.join(cwd, 'node_modules'))) fs.symlinkSync(path.join(repo, 'node_modules'), path.join(cwd, 'node_modules'), 'junction');
const allowed = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT',
  'HOMEDRIVE', 'HOMEPATH', 'SYSTEMDRIVE', 'USERPROFILE', 'WINDIR', 'APPDATA',
  'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT'];
const env = Object.fromEntries(allowed.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(env, {
  NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', AK_USE_LOCAL_JSON_ONLY: 'true',
  AK_ALLOW_LOCAL_JSON_WRITES: 'true', AK_ENTORNO_AISLADO: 'true',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy', APP_PASSWORD: 'entorno-aislado-ak',
  GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy', FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9195',
  AK_ENTORNO_SALIDA: path.join(cwd, '86-enlaces-ficticios.json'),
});
console.log(JSON.stringify({ cwd, sha: exact, launcher: process.pid }));
if (process.argv.includes('--firestore-emulado')) env.AK_USE_LOCAL_JSON_ONLY = 'false';
fs.writeFileSync(path.join(repo, 'docs/evidencias/86-entorno.json'), JSON.stringify({ cwd, sha: exact, modo:env.AK_USE_LOCAL_JSON_ONLY === 'true' ? 'JSON local' : 'Firestore demo emulado' }, null, 2));
async function run(args, logName) {
  const out = fs.createWriteStream(path.join(repo, 'docs/evidencias', logName), { flags: 'a' });
  const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { out.write(chunk); process.stdout.write(chunk); });
  const code = await new Promise(resolve => child.on('exit', resolve));
  await new Promise(resolve => out.end(resolve));
  if (code !== 0) throw new Error(`Fallo ${args[0]}: ${code}`);
}
if (process.argv.includes('--build-existente')) {
  if (!fs.existsSync(path.join(cwd, '.next', 'BUILD_ID'))) throw new Error('No hay build completo para reutilizar');
} else {
  await run(['scripts/build-next-with-memory.mjs'], '86-build.log');
}
await run(['node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.entorno.config.ts'], '86-semilla.log');
const config = JSON.parse(fs.readFileSync(path.join(cwd, 'firebase.pruebas.json')));
config.emulators.firestore.port = 8085;
config.emulators.storage.port = 9195;
fs.writeFileSync(path.join(cwd, 'firebase.entorno.json'), JSON.stringify(config, null, 2));
const emulators = spawn(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:start',
  '--config', 'firebase.entorno.json', '--only', 'firestore,storage', '--project', 'demo-ak-producciones'], { cwd, env, stdio: ['ignore', 'pipe', 'inherit'] });
console.log(JSON.stringify({ emulators: emulators.pid }));
let server;
const timer = setTimeout(() => { emulators.kill(); throw new Error('Emuladores: 120 segundos'); }, 120000);
emulators.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  if (!server && /All emulators ready/i.test(String(chunk))) {
    clearTimeout(timer);
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3300'], { cwd, env, stdio: 'inherit' });
    console.log(JSON.stringify({ server: server.pid }));
    server.on('exit', () => emulators.kill());
  }
});
emulators.on('exit', () => { clearTimeout(timer); server?.kill(); });
