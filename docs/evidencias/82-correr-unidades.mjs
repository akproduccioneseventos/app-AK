import path from 'node:path';
import { spawn } from 'node:child_process';

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
const files = [
  'src/__tests__/el-contrato-no-pierde-la-hora-del-evento.test.ts',
  'src/__tests__/el-contrato-de-la-app-es-el-revisado.test.ts',
  'src/__tests__/el-recibo-y-el-contrato-no-corren-la-fecha.test.ts',
  'src/__tests__/las-preguntas-del-contrato-llegan.test.ts',
  'src/__tests__/marcadores-contrato.test.ts',
  'src/__tests__/portal-cliente-contadores-personas.test.ts',
  'src/__tests__/espejo-magico-sesion-segura.test.ts',
  'src/__tests__/espejo-magico-style-selector.test.ts',
  'src/__tests__/itinerario-portal-cliente.test.ts',
];
const child = spawn(process.execPath, [path.resolve('node_modules/jest/bin/jest.js'),
  '--runInBand', '--runTestsByPath', ...files, '--json',
  '--outputFile=docs/evidencias/82-unidades-resultados.json'], { cwd: process.cwd(), env, stdio: 'inherit' });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
