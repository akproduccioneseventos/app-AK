import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const cwd = process.cwd();
const mode = process.argv[2];
const tag = process.argv[3] || '107';
const probeFile = process.argv[4] || 'docs/evidencias/107-google-probe.mjs';
if (!['start', 'probe'].includes(mode)) throw new Error('start or probe required');
if (!/^\d{3}$/.test(tag) || !/^docs\/evidencias\/\d{3}-[a-z0-9-]+\.mjs$/.test(probeFile)) throw new Error('Evidence path required');
if (fs.lstatSync('node_modules').isSymbolicLink() || fs.readdirSync(cwd).some(name => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(name))) throw new Error('Private credentials-free checkout required');
const build = JSON.parse(fs.readFileSync('docs/evidencias/106-build-execution.json', 'utf8'));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const changed = execFileSync('git', ['diff', '--name-only', build.sha, 'HEAD'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const dirty = execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
if (build.exitCode !== 0 || [...changed,...dirty].some(file => !/^(docs\/|tests\/e2e\/|ESTADO-ACTUAL\.md$)/.test(file))) throw new Error('Application differs from accepted build');
const cleanKeys = ['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const env = Object.fromEntries(cleanKeys.filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
Object.assign(env, { NODE_ENV:'production', NODE_OPTIONS:'--max-old-space-size=4096', NEXT_TELEMETRY_DISABLED:'1',
  AK_ENTORNO_AISLADO:'true', AK_DISABLE_STANDALONE:'true', AK_USE_LOCAL_JSON_ONLY:'true', AK_ALLOW_LOCAL_JSON_WRITES:'true',
  AK_SESSION_SECRET:'playwright-session-secret-with-enough-entropy', APP_PASSWORD:'entorno-aislado-ak',
  GOOGLE_API_KEY:'dummy', GEMINI_API_KEY:'dummy', FIREBASE_PROJECT_ID:'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_API_KEY:'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:'demo-ak-producciones.firebaseapp.com', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:'000000000000', NEXT_PUBLIC_FIREBASE_APP_ID:'1:000000000000:web:test',
  GOOGLE_APPLICATION_CREDENTIALS:path.join(cwd,'qa107-no-real-credentials.json'), COMMIT_SHA:build.sha, PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3300' });
const args = mode === 'start' ? ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3300'] : [probeFile];
const child = spawn(process.execPath, args, { cwd, env, stdio:['ignore','pipe','pipe'] });
const log = fs.createWriteStream(`docs/evidencias/${tag}-${mode}.log`);
const file = `docs/evidencias/${tag}-${mode}-execution.json`;
const record = { head, applicationSourceSha:build.sha, args, launcher:process.pid, child:child.pid, started:new Date().toISOString() };
fs.writeFileSync(file, JSON.stringify({ ...record,status:'running' },null,2));
for (const stream of [child.stdout,child.stderr]) stream.on('data', bytes => { log.write(bytes); process.stdout.write(bytes); });
child.on('exit', code => { fs.writeFileSync(file,JSON.stringify({ ...record,status:'finished',exitCode:code,finished:new Date().toISOString() },null,2)); log.end(); process.exitCode = code ?? 1; });
