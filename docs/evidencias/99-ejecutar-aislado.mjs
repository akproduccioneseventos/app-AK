import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
const repo = fs.realpathSync(process.cwd()), sha = 'ca5b714d75635b633bf4618529938ed37fd40f73';
const root = path.join(fs.realpathSync(os.tmpdir()), 'ak-codex88'), cwd = path.join(root, 'ak-entorno-aislado-99');
const mode = process.argv[2]; if (!['start', 'e2e', 'control'].includes(mode)) throw new Error('Mode invalid');
if (mode === 'start') {
  if (fs.existsSync(cwd)) throw new Error('Fresh TEMP required');
  execFileSync('git', ['worktree', 'add', '--detach', cwd, sha], { stdio: 'inherit' });
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(cwd, 'node_modules'), 'junction');
  fs.copyFileSync(path.join(repo, 'docs/evidencias/99-qr-retest.spec.ts'), path.join(cwd, 'tests/e2e/99-qr-retest.spec.ts'));
  const cfg = JSON.parse(fs.readFileSync(path.join(cwd, 'firebase.pruebas.json')));
  cfg.emulators.firestore.port = 8085; cfg.emulators.storage.port = 9195;
  fs.writeFileSync(path.join(cwd, 'firebase.entorno.json'), JSON.stringify(cfg, null, 2));
  fs.writeFileSync(path.join(cwd, 'playwright.99.config.ts'), "import base from './playwright.config';export default {...base,testMatch:['**/99-qr-retest.spec.ts'],use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:" + JSON.stringify(path.join(repo, 'docs/evidencias/99-browser.json')) + "}]],outputDir:" + JSON.stringify(path.join(cwd, 'qa99-artifacts')) + "};");
}
if (path.dirname(fs.realpathSync(cwd)) !== root || execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== sha ||
    fs.readdirSync(cwd).some(n => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n))) throw new Error('Source/credentials guard');
const keys = ['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const env = Object.fromEntries(keys.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(env, { NODE_ENV:'development', NEXT_TELEMETRY_DISABLED:'1', NODE_OPTIONS:'--max-old-space-size=4096', JAVA_TOOL_OPTIONS:'-Xmx512m',
  AK_ENTORNO_AISLADO:'true', AK_USE_LOCAL_JSON_ONLY:'false', AK_ALLOW_LOCAL_JSON_WRITES:'true', AK_SESSION_SECRET:'playwright-session-secret-with-enough-entropy', APP_PASSWORD:'entorno-aislado-ak',
  GOOGLE_API_KEY:'dummy', GEMINI_API_KEY:'dummy', FIREBASE_PROJECT_ID:'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_PROJECT_ID:'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY:'dummy', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:'demo-ak-producciones.firebaseapp.com', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:'000000000000', NEXT_PUBLIC_FIREBASE_APP_ID:'1:000000000000:web:test', FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195', COMMIT_SHA:sha, PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3300' });
const log = fs.createWriteStream(path.join(repo, 'docs/evidencias/99-' + mode + '.log'), { flags: 'a' });
function launch(args) {
  const child = spawn(process.execPath, args, { cwd, env, stdio:['ignore','pipe','pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { log.write(b); process.stdout.write(b); });
  return child;
}
if (mode === 'start') {
  let server; const emulator = launch(['node_modules/firebase-tools/lib/bin/firebase.js','emulators:start','--config','firebase.entorno.json','--only','firestore,storage','--project','demo-ak-producciones']);
  const record = () => fs.writeFileSync(path.join(repo,'docs/evidencias/99-runtime.json'),JSON.stringify({cwd,sha,launcher:process.pid,emulator:emulator.pid,server:server?.pid,started:new Date().toISOString(),runtime:'Next dev, no build'},null,2));
  record(); const timer = setTimeout(() => emulator.kill(), 120000);
  emulator.stdout.on('data', b => { if (!server && /All emulators ready/i.test(String(b))) { clearTimeout(timer); server = launch(['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3300']); record(); server.on('exit',() => emulator.kill()); } });
  emulator.on('exit', () => { clearTimeout(timer); server?.kill(); log.end(); });
} else {
  fs.copyFileSync(path.join(repo,'docs/evidencias/99-qr-retest.spec.ts'),path.join(cwd,'tests/e2e/99-qr-retest.spec.ts'));
  let config = 'playwright.99.config.ts';
  if (mode === 'control') {
    fs.copyFileSync(path.join(repo,'docs/evidencias/99-qr-persistidos.spec.ts'),path.join(cwd,'tests/e2e/99-qr-persistidos.spec.ts'));
    for (const n of [3,4]) fs.copyFileSync(path.join(repo,'docs/evidencias/99-artifactos/99-browser-primer-0'+n+'-0.png'),path.join(cwd,'qa99-file-'+n+'.png'));
    config = 'playwright.99-control.config.ts';
    fs.writeFileSync(path.join(cwd,config),"import base from './playwright.config';export default {...base,testMatch:['**/99-qr-persistidos.spec.ts'],use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:"+JSON.stringify(path.join(repo,'docs/evidencias/99-control.json'))+"}]],outputDir:"+JSON.stringify(path.join(cwd,'qa99-control-artifacts'))+"};");
  }
  const child = launch(['node_modules/@playwright/test/cli.js','test','--config',config,...process.argv.slice(3)]);
  child.on('exit', code => log.end(() => { process.exitCode = code ?? 1; }));
}
