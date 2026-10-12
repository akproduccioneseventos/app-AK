import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';

const cwd = path.join(os.homedir(), 'Documents', 'Codex', 'ak-codex88', 'ak-react19-candidato-103');
const mode = process.argv[2];
const evidence = path.resolve('docs/evidencias');
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
if (!['start-baseline', 'start', '3d-baseline', '3d', 'types', 'jest', 'unit', 'build', 'acentos'].includes(mode)) throw new Error('Unknown mode');
if (fs.realpathSync(cwd) !== cwd || fs.lstatSync(path.join(cwd, 'node_modules')).isSymbolicLink() ||
    fs.readdirSync(cwd).some(name => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(name))) throw new Error('Private checkout/credentials guard');
let applicationSourceSha = sha;
if (['start-baseline', '3d-baseline', 'start', '3d'].includes(mode)) {
  const build = JSON.parse(fs.readFileSync(path.join(evidence, `${mode.endsWith('baseline') ? '105' : '106'}-build-execution.json`), 'utf8'));
  if (build.status !== 'finished' || build.exitCode !== 0) throw new Error('Canonical build required');
  const changed = execFileSync('git', ['diff', '--name-only', build.sha, sha], { cwd, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  const dirty = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  const auxiliary = file => /^(docs\/|tests\/e2e\/|graphify-out\/|ESTADO-ACTUAL\.md$)/.test(file);
  if ([...changed, ...dirty].some(file => !auxiliary(file))) throw new Error('Application differs from build');
  applicationSourceSha = build.sha;
}
const keys = ['PATH', 'HOME', 'LANG', 'TEMP', 'TMP', 'SYSTEMROOT', 'USERPROFILE', 'WINDIR', 'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT'];
const clean = Object.fromEntries(keys.filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
const env = { ...clean, NODE_ENV: 'production', NODE_OPTIONS: '--max-old-space-size=4096', NEXT_TELEMETRY_DISABLED: '1',
  AK_ENTORNO_AISLADO: 'true', AK_DISABLE_STANDALONE: 'true', AK_USE_LOCAL_JSON_ONLY: 'true', AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy', APP_PASSWORD: 'entorno-aislado-ak',
  GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy', FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
  GOOGLE_APPLICATION_CREDENTIALS: path.join(cwd, 'qa106-no-real-credentials.json'), COMMIT_SHA: applicationSourceSha, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300' };
const log = fs.createWriteStream(path.join(evidence, `106-${mode}.log`));
function launch(args, extra = {}, base = env) {
  const child = spawn(process.execPath, args, { cwd, env: { ...base, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
  const execution = { cwd, sha, applicationSourceSha, mode, args, launcher: process.pid, child: child.pid, started: new Date().toISOString(), status: 'running' };
  const file = path.join(evidence, `106-${mode}-execution.json`);
  fs.writeFileSync(file, JSON.stringify(execution, null, 2));
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { log.write(bytes); process.stdout.write(bytes); });
  child.on('exit', code => {
    fs.writeFileSync(file, JSON.stringify({ ...execution, status: 'finished', finished: new Date().toISOString(), exitCode: code ?? 1 }, null, 2));
    log.end(() => { process.exitCode = code ?? 1; });
  });
  return child;
}
if (mode.startsWith('start')) {
  const child = launch(['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3300']);
  fs.writeFileSync(path.join(evidence, '106-runtime.json'), JSON.stringify({ cwd, sha, applicationSourceSha, launcher: process.pid, server: child.pid }, null, 2));
} else if (mode.startsWith('3d')) {
  fs.writeFileSync(path.join(cwd, 'playwright.106.config.ts'), `import base from './playwright.config';export default {...base,testMatch:['**/salon-3d-ayuda-recorrido.spec.ts'${mode === '3d' ? ", '**/salon-3d-real.spec.ts'" : ''}],use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:${JSON.stringify(path.join(evidence, `106-${mode}.json`))}}]],outputDir:${JSON.stringify(path.join(cwd, `qa106-${mode}-artifacts`))}};`);
  launch(['node_modules/@playwright/test/cli', 'test', '--config', 'playwright.106.config.ts', ...process.argv.slice(3)], { NODE_ENV: 'test' });
} else if (mode === 'types') launch(['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false']);
else if (mode === 'acentos') launch(['scripts/check-acentos.mjs']);
else if (mode === 'jest' || mode === 'unit') launch(['node_modules/jest/bin/jest', '--runInBand', '--silent', '--json', `--outputFile=${path.join(evidence, `106-${mode}.json`)}`, ...(mode === 'unit' ? ['--runTestsByPath', 'src/__tests__/dependencias-multipart-mapas-regresion.test.ts'] : [])], { NODE_ENV: 'test' }, clean);
else if (mode === 'build') {
  const sw = spawnSync(process.execPath, ['scripts/generate-firebase-messaging-sw.mjs'], { cwd, env, encoding: 'utf8' });
  for (const output of [sw.stdout, sw.stderr]) if (output) { log.write(output); process.stdout.write(output); }
  if (sw.status !== 0) log.end(() => { process.exitCode = sw.status ?? 1; });
  else launch(['scripts/build-next-with-memory.mjs'], { npm_lifecycle_event: 'build' });
}
