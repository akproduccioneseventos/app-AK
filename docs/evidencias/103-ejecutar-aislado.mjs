import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const repo = fs.realpathSync(process.cwd());
const sha = '4c4656d3fb497f00297725059fda5227e979779b';
const root = path.join(os.homedir(), 'Documents', 'Codex', 'ak-codex88');
const cwd = path.join(root, 'ak-entorno-aislado-103');
const mode = process.argv[2];
if (!['prepare', 'build', 'start', 'portal', 'dates', 'qr', 'mural', '3d'].includes(mode)) throw new Error('Invalid mode');
const evidence = path.join(repo, 'docs', 'evidencias');
if (mode === 'prepare') {
  if (fs.existsSync(cwd)) throw new Error('Fresh own checkout required');
  fs.mkdirSync(root, { recursive: true });
  execFileSync('git', ['worktree', 'add', '--detach', cwd, sha], { stdio: 'inherit' });
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(cwd, 'node_modules'), 'junction');
  const copy = (source, target, from) => {
    const text = fs.readFileSync(path.join(evidence, source), 'utf8')
      .replaceAll(from, '103').replaceAll("path.join(os.tmpdir(),'ak-codex88')", "path.join(os.homedir(),'Documents','Codex','ak-codex88')")
      .replaceAll("path.join(os.tmpdir(), 'ak-codex88')", "path.join(os.homedir(),'Documents','Codex','ak-codex88')");
    fs.writeFileSync(path.join(cwd, target), text);
  };
  copy('102-portal-reader.spec.ts', 'tests/e2e/103-portal-reader.spec.ts', '102');
  copy('102-calendario-reader.spec.ts', 'tests/e2e/103-calendario-reader.spec.ts', '102');
  copy('102-corte-lectura.cjs', 'qa103-provider.cjs', '102');
  copy('101-qr-retest.spec.ts', 'tests/e2e/103-qr-retest.spec.ts', '101');
  fs.copyFileSync(path.join(evidence, '103-3d.spec.ts'), path.join(cwd, 'tests/e2e/103-3d.spec.ts'));
  const cfg = JSON.parse(fs.readFileSync(path.join(cwd, 'firebase.pruebas.json')));
  cfg.emulators.firestore.port = 8085; cfg.emulators.storage.port = 9195;
  fs.writeFileSync(path.join(cwd, 'firebase.entorno.json'), JSON.stringify(cfg, null, 2));
  process.exit(0);
}
if (path.dirname(fs.realpathSync(cwd)) !== root || execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== sha ||
    fs.readdirSync(cwd).some(n => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n))) throw new Error('Source/credentials guard');
const keys = ['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const env = Object.fromEntries(keys.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(env, { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', NODE_OPTIONS: '--max-old-space-size=4096', JAVA_TOOL_OPTIONS: '-Xmx512m',
  AK_ENTORNO_AISLADO: 'true', AK_USE_LOCAL_JSON_ONLY: 'false', AK_ALLOW_LOCAL_JSON_WRITES: 'true', AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy', APP_PASSWORD: 'entorno-aislado-ak',
  GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy', FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9195',
  COMMIT_SHA: sha, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3300' });
const log = fs.createWriteStream(path.join(evidence, '103-' + mode + '.log'));
function launch(args, extra = {}) {
  const child = spawn(process.execPath, args, { cwd, env: { ...env, ...extra }, stdio: ['ignore','pipe','pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { log.write(b); process.stdout.write(b); });
  return child;
}
const finish = child => child.on('exit', code => log.end(() => { process.exitCode = code ?? 1; }));
if (mode === 'build') {
  const sw = launch(['scripts/generate-firebase-messaging-sw.mjs'], { npm_lifecycle_event: 'build' });
  sw.on('exit', code => {
    if (code) log.end(() => { process.exitCode = code; });
    else finish(launch(['scripts/build-next-with-memory.mjs'], { npm_lifecycle_event: 'build' }));
  });
} else if (mode === 'start') {
  let server;
  const emulator = launch(['node_modules/firebase-tools/lib/bin/firebase.js','emulators:start','--config','firebase.entorno.json','--only','firestore,storage','--project','demo-ak-producciones']);
  const record = () => fs.writeFileSync(path.join(evidence, '103-runtime.json'), JSON.stringify({ cwd, sha, launcher: process.pid, emulator: emulator.pid, server: server?.pid, started: new Date().toISOString(), runtime: 'Next production build' }, null, 2));
  record(); const timer = setTimeout(() => emulator.kill(), 120000);
  emulator.stdout.on('data', b => {
    if (!server && /All emulators ready/i.test(String(b))) {
      clearTimeout(timer);
      server = launch(['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3300'], { NODE_OPTIONS: '--max-old-space-size=4096 --require ./qa103-provider.cjs' });
      record(); server.on('exit', () => emulator.kill());
    }
  });
  emulator.on('exit', () => { clearTimeout(timer); server?.kill(); log.end(); });
} else {
  if (mode === '3d') fs.copyFileSync(path.join(evidence, '103-3d.spec.ts'), path.join(cwd, 'tests/e2e/103-3d.spec.ts'));
  if (mode === 'mural') {
    const text = fs.readFileSync(path.join(evidence, '101-mural.spec.ts'), 'utf8').replaceAll('101', '103')
      .replaceAll("path.join(os.tmpdir(),'ak-codex88')", "path.join(os.homedir(),'Documents','Codex','ak-codex88')");
    fs.writeFileSync(path.join(cwd, 'tests/e2e/103-mural.spec.ts'), text);
  }
  const spec = { portal: '103-portal-reader', dates: '103-calendario-reader', qr: '103-qr-retest', mural: '103-mural', '3d': '103-3d' }[mode];
  fs.writeFileSync(path.join(cwd, 'playwright.103.config.ts'), "import base from './playwright.config';export default {...base,testMatch:['**/" + spec + ".spec.ts'],use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:" + JSON.stringify(path.join(evidence, '103-' + mode + '.json')) + "}]],outputDir:" + JSON.stringify(path.join(cwd, 'qa103-' + mode + '-artifacts')) + "};");
  finish(launch(['node_modules/@playwright/test/cli.js','test','--config','playwright.103.config.ts', ...process.argv.slice(3)], { NODE_ENV: 'test' }));
}
