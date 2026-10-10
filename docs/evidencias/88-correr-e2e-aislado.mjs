import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const cwd = fs.realpathSync(process.argv[2]);
if (path.dirname(cwd) !== fs.realpathSync(path.join(os.tmpdir(),'ak-codex88'))
  || !path.basename(cwd).startsWith('ak-entorno-aislado-')) {
  throw new Error('Solo se ejecuta en la copia temporal aislada.');
}
const allowed = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT',
  'HOMEDRIVE', 'HOMEPATH', 'SYSTEMDRIVE', 'USERPROFILE', 'WINDIR', 'APPDATA',
  'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT'];
const env = Object.fromEntries(allowed.filter((key) => process.env[key] !== undefined)
  .map((key) => [key, process.env[key]]));
Object.assign(env, {
  NODE_ENV: 'production', AK_USE_LOCAL_JSON_ONLY: 'true', AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_ENTORNO_AISLADO: 'true', AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy',
  APP_PASSWORD: 'entorno-aislado-ak', GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy',
  FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9195',
  PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300',
  PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(cwd, '88-e2e-resultados.json'),
});
const child = spawn(process.execPath, [path.join(cwd, 'node_modules/@playwright/test/cli.js'),
  'test', ...process.argv.slice(3), '--reporter=list,json'], { cwd, env, stdio: 'inherit' });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
