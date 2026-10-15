import fs from 'node:fs';
import net from 'node:net';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { fixtureGuard } from './110-fixture-guard.mjs';

const mode = process.argv[2];
if (!['emulator', 'start', 'probe'].includes(mode)) throw new Error('Invalid QA mode');
if (fs.lstatSync('node_modules').isSymbolicLink() || fs.readdirSync('.').some(n => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n))) throw new Error('Private credentials-free checkout required');
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const keys = ['PATH', 'HOME', 'LANG', 'TEMP', 'TMP', 'SYSTEMROOT', 'USERPROFILE', 'WINDIR', 'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'COMSPEC', 'PATHEXT'];
const env = Object.fromEntries(keys.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(env, {
  NODE_ENV: ['unit', 'jest'].includes(mode) ? 'test' : 'production', NODE_OPTIONS: '--max-old-space-size=4096',
  NEXT_TELEMETRY_DISABLED: '1', AK_ENTORNO_AISLADO: 'true', AK_DISABLE_STANDALONE: 'true',
  AK_USE_LOCAL_JSON_ONLY: mode === 'build' ? 'true' : 'false', AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy', APP_PASSWORD: 'entorno-aislado-ak',
  GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'dummy', FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com', NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test', GOOGLE_APPLICATION_CREDENTIALS: '',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085', PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3301',
  COMMIT_SHA: sha, JAVA_TOOL_OPTIONS: '-Xmx512m',
});
if(mode==='start') env.NODE_OPTIONS+=' --import '+new URL('./126-proveedor-doble.mjs',import.meta.url).href;
if (['start', 'emulator', 'probe'].includes(mode)) {
  const build = JSON.parse(fs.readFileSync('docs/evidencias/125-build-execution.json'));
  const changed = execFileSync('git', ['diff', '--name-only', build.sha, 'HEAD'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  const dirty = execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  const auxiliar = f => /^(docs\/|tests\/|src\/__tests__\/|graphify-out\/|ESTADO-ACTUAL\.md$|AGENTS\.md$)/.test(f);
  let ownedFixtures=new Map();
  const fixturePath='docs/evidencias/126-fixtures-execution.json';
  if(fs.existsSync(fixturePath)){
    const f=JSON.parse(fs.readFileSync(fixturePath));
    if(f.status==='running'&&f.applicationSourceSha===build.sha){
      try{process.kill(f.pid,0);ownedFixtures=new Map(f.fixtureFiles.map(row=>[row.file,row]));}catch{}
    }
  }
  const verifiedFixture=file=>{
    const row=ownedFixtures.get(file);
    return /^(data|src\/data)\/[^\n]+\.json$/.test(file)&&row&&fs.existsSync(file)&&
      crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===row.afterSha256;
  };
  if (build.exitCode !== 0 || changed.some(f=>!auxiliar(f)) || dirty.some(f=>!auxiliar(f)&&!verifiedFixture(f))) throw new Error('Application differs from successful build or owned fixtures');
  env.COMMIT_SHA = build.sha;
}
if (mode === 'emulator' || mode === 'rules') {
  const homeDirectory = path.resolve('..', '.qa-tools', 'firebase125home');
  fs.mkdirSync(path.join(homeDirectory, 'config'), { recursive: true });
  env.FIREBASE_EMULATORS_PATH = path.join(os.homedir(), '.cache', 'firebase', 'emulators');
  env.HOME = homeDirectory; env.USERPROFILE = homeDirectory;
  env.APPDATA = path.join(homeDirectory, 'config'); env.XDG_CONFIG_HOME = env.APPDATA;
  env.FIREBASE_CLI_DISABLE_USAGE_STATS = '1'; env.CI = 'true';
  const localJava = fs.existsSync('docs/evidencias/125-java21-local.json')
    ? JSON.parse(fs.readFileSync('docs/evidencias/125-java21-local.json', 'utf8').replace(/^\uFEFF/, '')).home : undefined;
  const home = process.env.AK_QA_JAVA_HOME || process.env.JAVA_HOME || localJava;
  const java = home ? home + '/bin/java' + (process.platform === 'win32' ? '.exe' : '') : 'java';
  const version = execFileSync(java, ['--version'], { encoding: 'utf8' });
  if (Number(version.match(/(?:openjdk|java) (\d+)/)?.[1] || 0) < 21) throw new Error('Firebase CLI15 requires Java21 for isolated emulators');
  if (home) { env.JAVA_HOME = home; env.PATH = home + '/bin' + (process.platform === 'win32' ? ';' : ':') + env.PATH; }
}
if (mode === 'rules') {
  for (const port of [8080, 9199, 4400, 4500]) {
    const check = net.createServer();
    await new Promise((resolve, reject) => { check.once('error', reject); check.listen(port, '127.0.0.1', resolve); });
    await new Promise(resolve => check.close(resolve));
  }
}
if (mode === 'start' || mode === 'emulator') {
  const check = net.createServer();
  await new Promise((resolve, reject) => { check.once('error', reject); check.listen(mode === 'start' ? 3301 : 8085, '127.0.0.1', resolve); });
  await new Promise(resolve => check.close(resolve));
}
const probe = process.argv[3];
if (mode === 'probe' && !/^docs\/evidencias\/126-[a-z0-9-]+\.mjs$/.test(probe || '')) throw new Error('Owned evidence probe required');
if (mode === 'probe') {
  const wanted = new Map(['adjustAllInsumoCosts', 'getCashFlowProjection'].map(name => [name, new Set()]));
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = dir + '/' + entry.name;
      if (entry.isDirectory()) scan(file);
      else if (entry.name.endsWith('.js')) {
        const text = fs.readFileSync(file, 'utf8');
        for (const match of text.matchAll(/createServerReference\)\("([a-f0-9]+)",[^)]*,"([^"]+)"\)/g)) {
          // El mural exporta otro getSocialPosts; esta prueba es del consumidor marketing.
          if (match[2] === 'getSocialPosts' && !file.includes('/app/(app)/empresa/redes-sociales/')) continue;
          wanted.get(match[2])?.add(match[1]);
        }
      }
    }
  }
  scan('.next/static/chunks');
  const manifest = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json'));
  const ids = {};
  for (const [name, values] of wanted) {
    if (values.size !== 1) throw new Error('Compiled action ambiguous: ' + name);
    const id = [...values][0];
    if (!manifest.node?.[id] && !manifest.edge?.[id]) throw new Error('Action absent from server manifest');
    ids[name] = id;
  }
  env.QA_COST_ACTION = ids.adjustAllInsumoCosts;
  env.QA_ACTION_IDS = JSON.stringify(ids);
  fs.writeFileSync('docs/evidencias/126-action-ids.json', JSON.stringify({ sourceSha: env.COMMIT_SHA, ids }, null, 2));
}
const config = `firebase.126-${process.pid}.generated.json`;
const configBytes = fs.readFileSync('docs/evidencias/113-firestore-config.json');
if (mode === 'emulator') { if (fs.existsSync(config)) throw new Error('QA config already exists'); fs.writeFileSync(config, configBytes); }
const args = mode === 'types' ? ['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false']
  : mode === 'lint' ? ['node_modules/next/dist/bin/next', 'lint']
  : mode === 'acentos' ? ['scripts/check-acentos.mjs']
  : mode === 'build' ? ['scripts/build-next-with-memory.mjs']
  : mode === 'rules' ? ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:exec', '--config', 'firebase.pruebas.json', '--only', 'firestore,storage', '--project', 'demo-ak-producciones', 'node node_modules/jest/bin/jest.js --runInBand --config jest.rules.config.js']
  : mode === 'emulator' ? ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:start', '--config', config, '--only', 'firestore', '--project', 'demo-ak-producciones']
  : mode === 'start' ? ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3301']
  : mode === 'probe' ? [probe, ...process.argv.slice(4)]
  : ['node_modules/jest/bin/jest', '--runInBand', '--silent', '--json', '--outputFile=docs/evidencias/126-jest.json', ...(mode === 'unit' ? ['--runTestsByPath', ...process.argv.slice(3)] : [])];
if (mode === 'build') env.npm_lifecycle_event = 'build';
process.env.AK_ENTORNO_AISLADO = 'true';
const restore = ['build', 'jest', 'unit'].includes(mode) ? fixtureGuard() : null;
const unitEnv = Object.fromEntries(keys.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(unitEnv, { NODE_ENV: 'test', NODE_OPTIONS: '--max-old-space-size=4096', GOOGLE_APPLICATION_CREDENTIALS: process.cwd() + '/qa126-no-real-credentials.json' });
if (fs.existsSync(unitEnv.GOOGLE_APPLICATION_CREDENTIALS)) throw new Error('QA credentials sentinel must not exist');
const child = spawn(process.execPath, args, { env: ['unit', 'jest'].includes(mode) ? unitEnv : env, stdio: ['ignore', 'pipe', 'pipe'] });
const log = fs.createWriteStream(`docs/evidencias/126-${mode}.log`);
const file = `docs/evidencias/126-${mode}-execution.json`;
const record = { sha, applicationSourceSha: env.COMMIT_SHA, mode, args, launcher: process.pid, child: child.pid, started: new Date().toISOString(), status: 'running' };
fs.writeFileSync(file, JSON.stringify(record, null, 2));
for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { log.write(b); process.stdout.write(b); });
child.on('exit', code => {
  const cleanup = restore?.();
  if (mode === 'emulator' && fs.existsSync(config) && fs.readFileSync(config).equals(configBytes)) fs.unlinkSync(config);
  fs.writeFileSync(file, JSON.stringify({ ...record, status: 'finished', exitCode: code ?? 1, finished: new Date().toISOString(), cleanup }, null, 2));
  log.end(() => { process.exitCode = code ?? 1; });
});
