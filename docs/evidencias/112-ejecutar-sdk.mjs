import fs from 'node:fs';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
const mode=process.argv[2];
if(!['emulator','start','probe'].includes(mode))throw new Error('Invalid mode');
if(fs.lstatSync('node_modules').isSymbolicLink()||fs.readdirSync('.').some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)))throw new Error('Private credentials-free checkout only');
const build=JSON.parse(fs.readFileSync('docs/evidencias/106-build-execution.json'));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const changed=execFileSync('git',['diff','--name-only',build.sha,'HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const dirty=execFileSync('git',['diff','--name-only','HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
if(build.exitCode!==0||[...changed,...dirty].some(f=>!/^(docs\/|tests\/e2e\/|ESTADO-ACTUAL\.md$)/.test(f)))throw new Error('Accepted app source required');
const keys=['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const env=Object.fromEntries(keys.filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
Object.assign(env,{NODE_ENV:'production',NODE_OPTIONS:'--max-old-space-size=4096',NEXT_TELEMETRY_DISABLED:'1',AK_ENTORNO_AISLADO:'true',AK_DISABLE_STANDALONE:'true',AK_USE_LOCAL_JSON_ONLY:'false',AK_ALLOW_LOCAL_JSON_WRITES:'true',AK_SESSION_SECRET:'playwright-session-secret-with-enough-entropy',APP_PASSWORD:'entorno-aislado-ak',GOOGLE_API_KEY:'dummy',GEMINI_API_KEY:'dummy',FIREBASE_PROJECT_ID:'demo-ak-producciones',NEXT_PUBLIC_FIREBASE_PROJECT_ID:'demo-ak-producciones',NEXT_PUBLIC_FIREBASE_API_KEY:'dummy',NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:'demo-ak-producciones.firebaseapp.com',NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:'demo-ak-producciones.appspot.com',NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:'000000000000',NEXT_PUBLIC_FIREBASE_APP_ID:'1:000000000000:web:test',GOOGLE_APPLICATION_CREDENTIALS:'',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3301',COMMIT_SHA:build.sha,JAVA_TOOL_OPTIONS:'-Xmx512m'});
if(mode!=='probe') {
  const check=net.createServer();await new Promise((resolve,reject)=>{check.once('error',reject);check.listen(mode==='emulator'?8085:3301,'127.0.0.1',resolve);});await new Promise(resolve=>check.close(resolve));
}
const probe=process.argv[3]||'docs/evidencias/112-mantenimiento-probe.mjs';
if(!/^docs\/evidencias\/112-[a-z0-9-]+\.mjs$/.test(probe))throw new Error('Evidence path required');
const config=`firebase.112-${process.pid}.generated.json`,configBytes=fs.readFileSync('docs/evidencias/112-firestore-config.json');
if(mode==='emulator'){if(fs.existsSync(config))throw new Error('Owned QA config must be new');fs.writeFileSync(config,configBytes);}
const args=mode==='emulator'?['node_modules/firebase-tools/lib/bin/firebase.js','emulators:start','--config',config,'--only','firestore','--project','demo-ak-producciones']:mode==='start'?['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3301']:[probe];
const child=spawn(process.execPath,args,{env,stdio:['ignore','pipe','pipe']});
const file=`docs/evidencias/112-sdk-${mode}-execution.json`,log=fs.createWriteStream(`docs/evidencias/112-sdk-${mode}.log`);
const record={head,applicationSourceSha:build.sha,mode,args,launcher:process.pid,child:child.pid,started:new Date().toISOString(),status:'running',emulator:env.FIRESTORE_EMULATOR_HOST,baseUrl:env.PLAYWRIGHT_BASE_URL};
fs.writeFileSync(file,JSON.stringify(record,null,2));
for(const stream of[child.stdout,child.stderr])stream.on('data',b=>{log.write(b);process.stdout.write(b);});
child.on('exit',code=>{fs.writeFileSync(file,JSON.stringify({...record,status:'finished',exitCode:code,finished:new Date().toISOString()},null,2));if(mode==='emulator'&&fs.existsSync(config)&&fs.readFileSync(config).equals(configBytes))fs.unlinkSync(config);log.end();process.exitCode=code??1;});
