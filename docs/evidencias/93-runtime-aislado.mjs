import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const repo = process.cwd();
const cwd = fs.realpathSync(process.argv[2]);
const sha = '8521548477d90cc2ffa05e9f2edb22c6c51a893b';
if (path.dirname(cwd) !== fs.realpathSync(path.join(os.tmpdir(), 'ak-codex88')) ||
    !path.basename(cwd).startsWith('ak-entorno-aislado-')) throw new Error('Solo TEMP aislado');
if (execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== sha) throw new Error('SHA distinto');
if (fs.readdirSync(cwd).some(n => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n))) throw new Error('Credenciales no permitidas');
const keys = ['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const env = Object.fromEntries(keys.filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
Object.assign(env, {
  NODE_ENV:'development', NEXT_TELEMETRY_DISABLED:'1', NODE_OPTIONS:'--max-old-space-size=4096', JAVA_TOOL_OPTIONS:'-Xmx512m',
  AK_ENTORNO_AISLADO:'true', AK_USE_LOCAL_JSON_ONLY:'false', AK_ALLOW_LOCAL_JSON_WRITES:'true',
  AK_SESSION_SECRET:'playwright-session-secret-with-enough-entropy', APP_PASSWORD:'entorno-aislado-ak',
  GOOGLE_API_KEY:'dummy', GEMINI_API_KEY:'dummy', FIREBASE_PROJECT_ID:'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:'demo-ak-producciones', NEXT_PUBLIC_FIREBASE_API_KEY:'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:'demo-ak-producciones.firebaseapp.com', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:'000000000000', NEXT_PUBLIC_FIREBASE_APP_ID:'1:000000000000:web:test',
  FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085', FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195', COMMIT_SHA:sha,
});
const log = fs.createWriteStream(path.join(repo, 'docs/evidencias/93-runtime.log'), {flags:'a'});
function launch(args) {
  const child = spawn(process.execPath, args, {cwd,env,stdio:['ignore','pipe','pipe']});
  for(const stream of [child.stdout,child.stderr]) stream.on('data',b=>{ log.write(b); process.stdout.write(b); });
  return child;
}
let server;
const emulator = launch(['node_modules/firebase-tools/lib/bin/firebase.js','emulators:start','--config','firebase.entorno.json','--only','firestore,storage','--project','demo-ak-producciones']);
const record = () => fs.writeFileSync(path.join(repo,'docs/evidencias/93-runtime.json'),JSON.stringify({cwd,sha,launcher:process.pid,emulator:emulator.pid,server:server?.pid,mode:'Next dev, no build optimizado',started:new Date().toISOString()},null,2));
record();
const timer=setTimeout(()=>emulator.kill(),120000);
emulator.stdout.on('data',b=>{
  if(!server && /All emulators ready/i.test(String(b))) {
    clearTimeout(timer);
    server=launch(['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3300']);record();
    server.on('exit',()=>emulator.kill());
  }
});
emulator.on('exit',()=>{clearTimeout(timer);server?.kill();log.end();});
