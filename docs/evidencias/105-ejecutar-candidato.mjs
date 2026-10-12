import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
const repo = fs.realpathSync(process.cwd());
const cwd = path.join(os.homedir(), 'Documents', 'Codex', 'ak-codex88', 'ak-react19-candidato-103');
const mode = process.argv[2];
if (!['unit', 'types', 'dev', '3d', 'build', 'start', 'jest', 'qr', 'compat', 'security-old', 'prepare-sdk', 'emulator', 'start-sdk', 'sdk'].includes(mode)) throw new Error('Unknown mode');
if (fs.realpathSync(cwd) !== cwd || fs.lstatSync(path.join(cwd, 'node_modules')).isSymbolicLink() ||
    fs.readdirSync(cwd).some(n => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n))) throw new Error('Private checkout/credentials guard');
const evidence = path.join(repo, 'docs', 'evidencias');
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
let applicationSourceSha = sha;
if (['start', '3d', 'qr', 'compat', 'start-sdk', 'sdk'].includes(mode)) {
  const build = JSON.parse(fs.readFileSync(path.join(evidence, '105-build-execution.json'), 'utf8'));
  if (build.status !== 'finished' || build.exitCode !== 0) throw new Error('Successful canonical build required');
  const changed = execFileSync('git', ['diff', '--name-only', build.sha, sha], { cwd, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  if (changed.some(file => !file.startsWith('tests/e2e/'))) throw new Error('Application differs from the accepted build');
  applicationSourceSha = build.sha;
}
const keep = ['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const clean = Object.fromEntries(keep.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
const env = { ...clean, NODE_ENV: 'production', NODE_OPTIONS: '--max-old-space-size=4096', NEXT_TELEMETRY_DISABLED: '1',
  AK_ENTORNO_AISLADO: 'true', AK_DISABLE_STANDALONE: 'true', AK_USE_LOCAL_JSON_ONLY: 'true', AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy', APP_PASSWORD: 'entorno-aislado-ak',
  GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy', FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
  GOOGLE_APPLICATION_CREDENTIALS: path.join(cwd, 'qa105-no-real-credentials.json'), COMMIT_SHA: applicationSourceSha, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300' };
const log = fs.createWriteStream(path.join(evidence, `105-${mode}.log`));
const sdkEnv = { AK_USE_LOCAL_JSON_ONLY: 'false', GOOGLE_APPLICATION_CREDENTIALS: '', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9195', NODE_OPTIONS: '--max-old-space-size=4096 --require ./qa105-provider.cjs' };
function launch(args, extra = {}, base = env) {
  const child = spawn(process.execPath, args, { cwd, env: { ...base, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
  const execution = { cwd, sha, applicationSourceSha, mode, args, launcher: process.pid, child: child.pid, started: new Date().toISOString(), status: 'running' };
  const executionFile = path.join(evidence, `105-${mode}-execution.json`);
  fs.writeFileSync(executionFile, JSON.stringify(execution, null, 2));
  for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { log.write(b); process.stdout.write(b); });
  child.on('exit', code => {
    fs.writeFileSync(executionFile, JSON.stringify({ ...execution, status: 'finished', finished: new Date().toISOString(), exitCode: code ?? 1 }, null, 2));
    log.end(() => { process.exitCode = code ?? 1; });
  });
  return child;
}
if (mode === 'prepare-sdk') {
  for (const [source, target, number] of [
    ['102-portal-reader.spec.ts', 'tests/e2e/105-portal-reader.spec.ts', '102'],
    ['102-calendario-reader.spec.ts', 'tests/e2e/105-calendario-reader.spec.ts', '102'],
    ['101-mural.spec.ts', 'tests/e2e/105-mural.spec.ts', '101'],
    ['102-corte-lectura.cjs', 'qa105-provider.cjs', '102'],
  ]) {
    const text = fs.readFileSync(path.join(evidence, source), 'utf8').replaceAll(number, '105')
      .replaceAll('ak-entorno-aislado-105', 'ak-react19-candidato-103')
      .replaceAll("path.join(os.tmpdir(),'ak-codex88')", "path.join(os.homedir(),'Documents','Codex','ak-codex88')");
    fs.writeFileSync(path.join(cwd, target), text);
  }
  const config = JSON.parse(fs.readFileSync(path.join(cwd, 'firebase.pruebas.json'), 'utf8'));
  config.emulators.firestore.port = 8085;
  config.emulators.firestore.host = '127.0.0.1';
  fs.writeFileSync(path.join(cwd, 'firebase.105.json'), JSON.stringify(config, null, 2));
  log.end();
} else if (mode === 'emulator') {
  const child = launch(['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:start', '--config', 'firebase.105.json', '--only', 'firestore', '--project', 'demo-ak-producciones'], { JAVA_TOOL_OPTIONS: '-Xmx512m' }, clean);
  fs.writeFileSync(path.join(evidence, '105-emulator-runtime.json'), JSON.stringify({ cwd, sha, launcher: process.pid, emulator: child.pid, at: new Date().toISOString() }, null, 2));
} else if (mode === 'security-old') {
  const oldRoot = fs.realpathSync(path.join(repo, 'node_modules'));
  for (const [name, version] of [['handlebars', '4.7.9'], ['proxy-addr', '2.0.7']]) {
    if (JSON.parse(fs.readFileSync(path.join(oldRoot, name, 'package.json'), 'utf8')).version !== version) throw new Error('Baseline dependency changed');
  }
  const mapper = Object.fromEntries(['handlebars', 'proxy-addr'].map(name => [`^${name}$`, path.join(oldRoot, name)]));
  fs.writeFileSync(path.join(cwd, 'qa105-security-old.config.cjs'), `module.exports=async()=>{const base=await require('./jest.config')();return {...base,moduleNameMapper:{...base.moduleNameMapper,...${JSON.stringify(mapper)}}};};`);
  launch(['node_modules/jest/bin/jest', '--config', 'qa105-security-old.config.cjs', '--runInBand', '--silent', '--json', `--outputFile=${path.join(evidence, '105-security-old.json')}`, '--runTestsByPath', 'src/__tests__/dependencias-criticas-regresion.test.ts'], { NODE_ENV: 'test' }, clean);
}
else if (mode === 'types') launch(['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false']);
else if (mode === 'unit' || mode === 'jest') launch(['node_modules/jest/bin/jest', '--runInBand', '--silent', '--json', `--outputFile=${path.join(evidence, `105-${mode}.json`)}`, ...(mode === 'unit' ? ['--runTestsByPath', 'src/__tests__/calendarios-con-react19.test.tsx'] : [])], { NODE_ENV: 'test', NODE_OPTIONS: '--max-old-space-size=4096', GOOGLE_APPLICATION_CREDENTIALS: env.GOOGLE_APPLICATION_CREDENTIALS }, clean);
else if (mode === 'build') {
  const sw = spawnSync(process.execPath, ['scripts/generate-firebase-messaging-sw.mjs'], { cwd, env, encoding: 'utf8' });
  for (const output of [sw.stdout, sw.stderr]) if (output) { log.write(output); process.stdout.write(output); }
  if (sw.status !== 0) log.end(() => { process.exitCode = sw.status ?? 1; });
  else launch(['scripts/build-next-with-memory.mjs'], { npm_lifecycle_event: 'build' });
}
else if (mode === 'dev' || mode === 'start' || mode === 'start-sdk') {
  const child = launch(['node_modules/next/dist/bin/next', mode === 'dev' ? 'dev' : 'start', '--hostname', '127.0.0.1', '--port', '3300'], { NODE_ENV: mode === 'dev' ? 'development' : 'production', ...(mode === 'start-sdk' ? sdkEnv : {}) });
  fs.writeFileSync(path.join(evidence, '105-runtime.json'), JSON.stringify({ cwd, sha, applicationSourceSha, mode, launcher: process.pid, server: child.pid, at: new Date().toISOString() }, null, 2));
} else {
  const matches = mode === 'sdk' ? ['**/105-portal-reader.spec.ts', '**/105-calendario-reader.spec.ts', '**/105-mural.spec.ts'] : mode === 'compat' ? ['**/calendarios-react19.spec.ts', '**/qr-descargado-lector-real.spec.ts'] : [`**/${mode === '3d' ? 'salon-3d-real' : 'qr-archivo-rotaciones'}.spec.ts`];
  fs.writeFileSync(path.join(cwd, 'playwright.105.config.ts'), `import base from './playwright.config';export default {...base,testMatch:${JSON.stringify(matches)},use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:${JSON.stringify(path.join(evidence, `105-${mode}.json`))}}]],outputDir:${JSON.stringify(path.join(cwd, `qa105-${mode}-artifacts`))}};`);
  launch(['node_modules/@playwright/test/cli', 'test', '--config', 'playwright.105.config.ts', ...process.argv.slice(3)], { NODE_ENV: 'test', ...(mode === 'sdk' ? sdkEnv : {}) });
}
