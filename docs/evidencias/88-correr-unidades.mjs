import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';

const cwd = fs.realpathSync(process.argv[2]);
if (![fs.realpathSync(os.tmpdir()),fs.realpathSync(path.join(os.tmpdir(),'ak-codex88'))].includes(path.dirname(cwd)) || !path.basename(cwd).startsWith('ak-entorno-aislado-')
  || execFileSync('git', ['-C', cwd, 'rev-parse', '--short=8', 'HEAD'], {encoding:'utf8'}).trim() !== '2aac14e2') throw new Error('Solo copia aislada 2aac14e2');

const allowed = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT',
  'HOMEDRIVE', 'HOMEPATH', 'SYSTEMDRIVE', 'USERPROFILE', 'WINDIR', 'APPDATA',
  'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT'];
const env = Object.fromEntries(allowed.filter((key) => process.env[key] !== undefined)
  .map((key) => [key, process.env[key]]));
Object.assign(env, {
  NODE_ENV: 'test', AK_USE_LOCAL_JSON_ONLY: 'true', AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_ENTORNO_AISLADO: 'true', AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy',
  APP_PASSWORD: 'entorno-aislado-ak', GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy',
  FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9195',
});
const report = process.argv.find(a => a.startsWith('--report='))?.slice(9) || '88-multiagente-resultados.json';
if (path.basename(report) !== report || !report.startsWith('88-') || !report.endsWith('.json')) throw new Error('Nombre de evidencia invalido');
const requested = process.argv.slice(3).filter(a => !a.startsWith('--report='));
const files = requested.length ? requested : [
  'src/__tests__/estacion-guarda-medio-sin-editar-fiesta.test.ts',
  'src/__tests__/entretenimiento-bloque-a.test.tsx',
  'src/__tests__/el-qr-no-tumba-la-pantalla.test.tsx',
];
const child = spawn(process.execPath, [path.join(cwd, 'node_modules/jest/bin/jest.js'),
  '--runInBand', '--runTestsByPath', ...files, '--json',
  `--outputFile=${path.resolve('docs/evidencias', requested.length ? report : '88-unidades-resultados.json')}`], { cwd, env, stdio: 'inherit' });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
