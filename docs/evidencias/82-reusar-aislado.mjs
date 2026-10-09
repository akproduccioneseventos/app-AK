import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const cwd = fs.realpathSync(process.argv[2]);
const sha = execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (path.dirname(cwd) !== fs.realpathSync(os.tmpdir())
  || !path.basename(cwd).startsWith('ak-entorno-aislado-')
  || sha !== '497ee725cb4d8cce6d1c97422fd674cbbe86c051'
  || !fs.existsSync(path.join(cwd, '.next/BUILD_ID'))
  || fs.readdirSync(cwd).some((name) => /^\.env(\.(local|production|development|test)(\.local)?)?$/.test(name))) {
  throw new Error('No es la copia compilada y aislada comprobada.');
}
const allowed = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT',
  'HOMEDRIVE', 'HOMEPATH', 'SYSTEMDRIVE', 'USERPROFILE', 'WINDIR', 'APPDATA',
  'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT'];
const env = Object.fromEntries(allowed.filter((key) => process.env[key] !== undefined)
  .map((key) => [key, process.env[key]]));
Object.assign(env, {
  NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
  AK_USE_LOCAL_JSON_ONLY: 'true', AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_ENTORNO_AISLADO: 'true', AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy',
  APP_PASSWORD: 'entorno-aislado-ak', GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy',
  FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9195',
});
const emulators = spawn(process.execPath, [path.join(cwd, 'node_modules/firebase-tools/lib/bin/firebase.js'),
  'emulators:start', '--config', 'firebase.entorno.json', '--only', 'firestore,storage',
  '--project', 'demo-ak-producciones'], { cwd, env, stdio: ['ignore', 'pipe', 'inherit'] });
console.log(JSON.stringify({ launcher: process.pid, emulators: emulators.pid, sha }));
let server;
const stop = () => { server?.kill(); emulators.kill(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
const timeout = setTimeout(() => { console.error('Emuladores: tiempo agotado'); stop(); process.exitCode = 1; }, 120_000);
emulators.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (!server && /All emulators ready/i.test(String(chunk))) {
    clearTimeout(timeout);
    server = spawn(process.execPath, [path.join(cwd, 'node_modules/next/dist/bin/next'),
      'start', '--hostname', '127.0.0.1', '--port', '3300'], { cwd, env, stdio: 'inherit' });
    console.log(JSON.stringify({ server: server.pid }));
    server.on('exit', () => emulators.kill());
  }
});
emulators.on('exit', () => { clearTimeout(timeout); server?.kill(); });
