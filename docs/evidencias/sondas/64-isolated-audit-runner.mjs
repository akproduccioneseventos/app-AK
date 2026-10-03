import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [root, mode, ...args] = process.argv.slice(2);
if (!root || !['jest', 'jest-mocked', 'seed', 'dev', 'e2e', 'e2e-list'].includes(mode)) throw new Error('root and audit mode required');
const allowed = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT',
  'HOMEDRIVE', 'HOMEPATH', 'SYSTEMDRIVE', 'USERDOMAIN', 'USERNAME', 'USERPROFILE', 'WINDIR',
  'APPDATA', 'LOCALAPPDATA', 'PUBLIC', 'ALLUSERSPROFILE', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT'];
const env = Object.fromEntries(allowed.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(env, {
  NODE_ENV: mode.startsWith('jest') ? 'test' : 'development', NEXT_TELEMETRY_DISABLED: '1',
  AK_USE_LOCAL_JSON_ONLY: 'true', AK_ALLOW_LOCAL_JSON_WRITES: 'true', AK_ENTORNO_AISLADO: 'true',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy', APP_PASSWORD: 'entorno-aislado-ak',
  GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy', FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
});
// These targeted suites provide their own database and API mocks.
if (mode === 'jest-mocked') {
  delete env.AK_USE_LOCAL_JSON_ONLY;
  delete env.AK_ALLOW_LOCAL_JSON_WRITES;
  delete env.GOOGLE_API_KEY;
  delete env.GEMINI_API_KEY;
}
for (const name of ['.env', '.env.local', '.env.development', '.env.development.local', '.env.test', '.env.test.local']) {
  if (fs.existsSync(path.join(root, name))) throw new Error(`Refusing environment file: ${name}`);
}
const output = path.resolve(root, '..', 'audit-runtime-results-20261002');
fs.mkdirSync(output, { recursive: true });
// Preserve earlier evidence before the same mode writes its latest result.
const archive = path.join(output, 'archive');
for (const extension of ['log', 'json']) {
  const previous = path.join(output, `${mode}.${extension}`);
  if (!fs.existsSync(previous)) continue;
  fs.mkdirSync(archive, { recursive: true });
  fs.copyFileSync(previous, path.join(archive, `${Date.now()}-${mode}.${extension}`));
}
env.AK_ENTORNO_SALIDA = path.join(output, 'roles.json');
env.PLAYWRIGHT_PORT = '3311';
env.PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3311';
env.AK_AUDIT_RESULT_DIR = output;
if (mode === 'dev') env.NODE_OPTIONS = '--max-old-space-size=3072';
const cli = mode.startsWith('jest') ? ['jest/bin/jest.js', '--maxWorkers=2', '--json', `--outputFile=${path.join(output, `${mode}.json`)}`, ...args]
  : mode === 'dev' ? ['next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3311']
  : ['@playwright/test/cli.js', 'test', ...(mode === 'seed' ? ['--config', 'playwright.entorno.config.ts'] : mode === 'e2e-list' ? ['--list'] : []), ...args];
const log = fs.openSync(path.join(output, `${mode}.log`), 'w');
const child = spawn(process.execPath, [path.join(root, 'node_modules', cli[0]), ...cli.slice(1)], {
  cwd: root, env, stdio: ['ignore', log, log], windowsHide: true,
});
console.log(JSON.stringify({ mode, pid: child.pid, output, started: new Date().toISOString() }));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { fs.closeSync(log); console.log(JSON.stringify({ mode, code, signal, finished: new Date().toISOString() })); process.exitCode = code ?? 1; });
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
