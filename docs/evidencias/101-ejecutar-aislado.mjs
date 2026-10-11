import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
const repo=fs.realpathSync(process.cwd()),sha='99faf4eb061fa46341cfdde6f81b93b3bfb9c73c';
const root=path.join(fs.realpathSync(os.tmpdir()),'ak-codex88'),cwd=path.join(root,'ak-entorno-aislado-101');
const mode=process.argv[2];if(!['start','e2e','mural','qr','qrcontrol'].includes(mode))throw new Error('Mode invalid');
if(mode==='start'){
  if(fs.existsSync(cwd))throw new Error('Fresh TEMP required');
  execFileSync('git',['worktree','add','--detach',cwd,sha],{stdio:'inherit'});
  fs.symlinkSync(path.join(repo,'node_modules'),path.join(cwd,'node_modules'),'junction');
  fs.copyFileSync(path.join(repo,'docs/evidencias/101-ia-respaldo-historial.spec.ts'),path.join(cwd,'tests/e2e/101-ia.spec.ts'));
  fs.copyFileSync(path.join(repo,'docs/evidencias/101-proveedor-caido.cjs'),path.join(cwd,'qa101-provider.cjs'));
  const cfg=JSON.parse(fs.readFileSync(path.join(cwd,'firebase.pruebas.json')));cfg.emulators.firestore.port=8085;cfg.emulators.storage.port=9195;
  fs.writeFileSync(path.join(cwd,'firebase.entorno.json'),JSON.stringify(cfg,null,2));
  fs.writeFileSync(path.join(cwd,'playwright.101.config.ts'),"import base from './playwright.config';export default {...base,testMatch:['**/101-ia.spec.ts'],use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:"+JSON.stringify(path.join(repo,'docs/evidencias/101-browser.json'))+"}]],outputDir:"+JSON.stringify(path.join(cwd,'qa101-artifacts'))+"};");
}
if(path.dirname(fs.realpathSync(cwd))!==root||execFileSync('git',['-C',cwd,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==sha||
  fs.readdirSync(cwd).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)))throw new Error('Source/credentials guard');
const keys=['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const env=Object.fromEntries(keys.filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
Object.assign(env,{NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:'--max-old-space-size=4096',JAVA_TOOL_OPTIONS:'-Xmx512m',
  AK_ENTORNO_AISLADO:'true',AK_USE_LOCAL_JSON_ONLY:'false',AK_ALLOW_LOCAL_JSON_WRITES:'true',AK_SESSION_SECRET:'playwright-session-secret-with-enough-entropy',APP_PASSWORD:'entorno-aislado-ak',
  GOOGLE_API_KEY:'dummy',GEMINI_API_KEY:'dummy',FIREBASE_PROJECT_ID:'demo-ak-producciones',NEXT_PUBLIC_FIREBASE_PROJECT_ID:'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY:'dummy',NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:'demo-ak-producciones.firebaseapp.com',NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:'000000000000',NEXT_PUBLIC_FIREBASE_APP_ID:'1:000000000000:web:test',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195',COMMIT_SHA:sha,PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3300'});
const report=process.env.QA101_REPORT||'101-browser.json';if(!/^101-[a-z-]+\.json$/.test(report))throw new Error('Report name');
if(mode==='e2e'&&report!=='101-browser.json'){
  fs.writeFileSync(path.join(cwd,'playwright.101.config.ts'),"import base from './playwright.config';export default {...base,testMatch:['**/101-ia.spec.ts'],use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:"+JSON.stringify(path.join(repo,'docs/evidencias',report))+"}]],outputDir:"+JSON.stringify(path.join(cwd,'qa101-artifacts'))+"};");
}
const log=fs.createWriteStream(path.join(repo,'docs/evidencias/101-'+mode+'.log'),{flags:'a'});
function launch(args,extra={}){const child=spawn(process.execPath,args,{cwd,env:{...env,...extra},stdio:['ignore','pipe','pipe']});
  for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log.write(b);process.stdout.write(b);});return child;}
if(mode==='start'){
  let server;const emulator=launch(['node_modules/firebase-tools/lib/bin/firebase.js','emulators:start','--config','firebase.entorno.json','--only','firestore,storage','--project','demo-ak-producciones']);
  const record=()=>fs.writeFileSync(path.join(repo,'docs/evidencias/101-runtime.json'),JSON.stringify({cwd,sha,launcher:process.pid,emulator:emulator.pid,server:server?.pid,started:new Date().toISOString(),runtime:'Next dev, no build'},null,2));
  record();const timer=setTimeout(()=>emulator.kill(),120000);
  emulator.stdout.on('data',b=>{if(!server&&/All emulators ready/i.test(String(b))){clearTimeout(timer);server=launch(['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3300'],{NODE_OPTIONS:'--max-old-space-size=4096 --require ./qa101-provider.cjs'});record();server.on('exit',()=>emulator.kill());}});
  emulator.on('exit',()=>{clearTimeout(timer);server?.kill();log.end();});
}else{
  const file=mode==='mural'?'101-mural.spec.ts':mode==='qr'?'101-qr-retest.spec.ts':mode==='qrcontrol'?'101-qr-control.spec.ts':'101-ia-respaldo-historial.spec.ts';
  if(mode==='qrcontrol')fs.copyFileSync(path.join(repo,'docs/evidencias/101-artifactos/101-qr-01-0.png'),path.join(cwd,'qa101-uuid.png'));
  const dest=mode==='e2e'?'101-ia.spec.ts':file;
  fs.copyFileSync(path.join(repo,'docs/evidencias',file),path.join(cwd,'tests/e2e',dest));
  fs.writeFileSync(path.join(cwd,'playwright.101.config.ts'),"import base from './playwright.config';export default {...base,testMatch:"+JSON.stringify(['**/'+dest])+",use:{...base.use,trace:'off',video:'off'},reporter:[['json',{outputFile:"+JSON.stringify(path.join(repo,'docs/evidencias','101-'+mode+'.json'))+"}]],outputDir:"+JSON.stringify(path.join(cwd,'qa101-'+mode+'-artifacts'))+"};");
  const child=launch(['node_modules/@playwright/test/cli.js','test','--config','playwright.101.config.ts',...process.argv.slice(3)]);child.on('exit',code=>log.end(()=>{process.exitCode=code??1;}));
}
