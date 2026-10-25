import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url)), dir = path.join(root, 'docs/evidencias');
const source = '09ea4138f5146cd2dfa6b792eda31cc04c30843f', target = path.join(dir, '190-ejecucion.json');
assert.equal(fs.existsSync(target), false, 'Preserve execution');
assert.ok(os.freemem() >= 768 * 1024 ** 2, 'No lightweight SDK under768MiB');
const qa = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-qa-190-'));
const rules = spawnSync('git', ['show', `${source}:firestore.rules`], { cwd: root, encoding: 'utf8' }); assert.equal(rules.status, 0, rules.stderr);
fs.writeFileSync(path.join(qa, 'firestore.rules'), rules.stdout);
const jar = 'C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/firebase-emulators/cloud-firestore-emulator-v1.22.0.jar';
const digest = crypto.createHash('sha256'); for await (const chunk of fs.createReadStream(jar)) digest.update(chunk);
assert.equal(digest.digest('hex'), '9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c');
const listener = net.createServer(); await new Promise((resolve,reject) => { listener.once('error',reject); listener.listen(8085,'127.0.0.1',resolve); }); await new Promise(resolve => listener.close(resolve));
const safe = Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(key => process.env[key] !== undefined).map(key => [key,process.env[key]]));
const home = path.join(qa,'home'); fs.mkdirSync(path.join(home,'config'),{recursive:true});
const env = { ...safe, HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),
  AK_ENTORNO_AISLADO:'true',AK_USE_LOCAL_JSON_ONLY:'false',NODE_ENV:'production',GOOGLE_APPLICATION_CREDENTIALS:'',
  FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',GCLOUD_PROJECT:'demo-ak-producciones',GOOGLE_CLOUD_PROJECT:'demo-ak-producciones',
  AK_SESSION_SECRET:'qa190-fictitious-cookie-secret-no-real-account' };
const record = { source, qa, started:new Date().toISOString(), actualSdk:true,realServices:false,freeBytesAtStart:os.freemem(), memoryPlan:'Java256MiB Node192MiB no Next/browser/build',appEdited:false };
const emulatorFile=path.join(dir,'190-emulator.log'),sdkFile=path.join(dir,'190-sdk.log');
const emulatorLog=fs.createWriteStream(emulatorFile),sdkLog=fs.createWriteStream(sdkFile);
const emulator=spawn('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/java21/jdk-21.0.12.1+1/bin/java.exe',
  ['-Xmx256m','-jar',jar,'--host','127.0.0.1','--port','8085','--project_id','demo-ak-producciones','--single_project_mode','true','--single_project_mode_error','true','--rules',path.join(qa,'firestore.rules')],
  {cwd:qa,env,stdio:['ignore','pipe','pipe']});
record.emulatorPid=emulator.pid;emulator.stdout.pipe(emulatorLog,{end:false});emulator.stderr.pipe(emulatorLog,{end:false});
let probe;
try {
  const deadline=Date.now()+60000;
  while(true){try{await fetch('http://127.0.0.1:8085/',{signal:AbortSignal.timeout(1000)});break;}catch(error){if(Date.now()>deadline)throw error;await new Promise(resolve=>setTimeout(resolve,500));}}
  probe=spawn(process.execPath,['--max-old-space-size=192',path.join(dir,'190-pago-informado-sdk.mjs')],{cwd:qa,env,stdio:['ignore','pipe','pipe']});
  record.probePid=probe.pid;probe.stdout.pipe(sdkLog,{end:false});probe.stderr.pipe(sdkLog,{end:false});
  const timer=setTimeout(()=>{record.probeTimedOut=true;probe.kill();},120000);
  try{record.exitCode=await new Promise((resolve,reject)=>{probe.once('exit',resolve);probe.once('error',reject);});}finally{clearTimeout(timer);}
  if(record.exitCode!==0)process.exitCode=1;
}catch(error){record.error=String(error);process.exitCode=1;}
finally{
  if(probe&&probe.exitCode===null){const ended=new Promise(resolve=>probe.once('exit',resolve));probe.kill();await Promise.race([ended,new Promise(resolve=>setTimeout(resolve,5000))]);}
  try{record.cleanupStatus=(await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-ak-producciones/databases/(default)/documents',{method:'DELETE',signal:AbortSignal.timeout(5000)})).status;}catch(error){record.cleanupError=String(error);}
  if(emulator.exitCode===null){const ended=new Promise(resolve=>emulator.once('exit',resolve));emulator.kill();await Promise.race([ended,new Promise(resolve=>setTimeout(resolve,5000))]);}
  await new Promise(resolve=>sdkLog.end(resolve));await new Promise(resolve=>emulatorLog.end(resolve));
  for(const file of [emulatorFile,sdkFile])fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
  record.finished=new Date().toISOString();fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
}
