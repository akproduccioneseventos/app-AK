import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='725e62ba2f909578628fad47402d125ed9632c70';
const target=path.join(dir,'264-ejecucion.json');assert(!fs.existsSync(target),'Preserve');assert(os.freemem()>=768*1024**2,'SDK needs768MiB free');
const qa=fs.mkdtempSync(path.join(os.tmpdir(),'ak-qa-264-'));
const r=spawnSync('git',['show',`${source}:firestore.rules`],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);fs.writeFileSync(path.join(qa,'firestore.rules'),r.stdout);
const jar='C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/firebase-emulators/cloud-firestore-emulator-v1.22.0.jar';
const hash=crypto.createHash('sha256');for await(const part of fs.createReadStream(jar))hash.update(part);assert.equal(hash.digest('hex'),'9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c');
const server=net.createServer();await new Promise((ok,no)=>{server.once('error',no);server.listen(8085,'127.0.0.1',ok);});await new Promise(ok=>server.close(ok));
const safe=Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
const home=path.join(qa,'home');fs.mkdirSync(path.join(home,'config'),{recursive:true});
const env={...safe,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),AK_ENTORNO_AISLADO:'true',AK_USE_LOCAL_JSON_ONLY:'false',NODE_ENV:'production',GOOGLE_APPLICATION_CREDENTIALS:'',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',GCLOUD_PROJECT:'demo-ak-producciones',GOOGLE_CLOUD_PROJECT:'demo-ak-producciones',AK_SESSION_SECRET:'qa264-fictitious-no-real-account'};
const record={source,qa,started:new Date().toISOString(),actualSdk:true,realServices:false,appEdited:false,freeBytesAtStart:os.freemem()};
const files=['264-emulator.log','264-sdk.log'].map(f=>path.join(dir,f)),streams=files.map(f=>fs.createWriteStream(f));
const emulator=spawn('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-tools/java21/jdk-21.0.12.1+1/bin/java.exe',['-Xmx256m','-jar',jar,'--host','127.0.0.1','--port','8085','--project_id','demo-ak-producciones','--single_project_mode','true','--single_project_mode_error','true','--rules',path.join(qa,'firestore.rules')],{cwd:qa,env,stdio:['ignore','pipe','pipe']});
record.emulatorPid=emulator.pid;emulator.stdout.pipe(streams[0],{end:false});emulator.stderr.pipe(streams[0],{end:false});let probe;
try{
 const deadline=Date.now()+60000;while(true){try{await fetch('http://127.0.0.1:8085/',{signal:AbortSignal.timeout(1000)});break;}catch(e){if(Date.now()>deadline)throw e;await new Promise(ok=>setTimeout(ok,500));}}
 probe=spawn(process.execPath,['--max-old-space-size=192',path.join(dir,'264-contrato-guardado-sdk.mjs')],{cwd:qa,env,stdio:['ignore','pipe','pipe']});record.probePid=probe.pid;probe.stdout.pipe(streams[1],{end:false});probe.stderr.pipe(streams[1],{end:false});
 const timer=setTimeout(()=>{record.probeTimedOut=true;probe.kill();},120000);try{record.exitCode=await new Promise((ok,no)=>{probe.once('exit',ok);probe.once('error',no);});}finally{clearTimeout(timer);}if(record.exitCode!==0)process.exitCode=1;
}catch(e){record.error=String(e);process.exitCode=1;}
finally{
 if(probe&&probe.exitCode===null){const ended=new Promise(ok=>probe.once('exit',ok));probe.kill();await Promise.race([ended,new Promise(ok=>setTimeout(ok,5000))]);}
 try{record.cleanupStatus=(await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-ak-producciones/databases/(default)/documents',{method:'DELETE',signal:AbortSignal.timeout(5000)})).status;}catch(e){record.cleanupError=String(e);}
 if(emulator.exitCode===null){const ended=new Promise(ok=>emulator.once('exit',ok));emulator.kill();await Promise.race([ended,new Promise(ok=>setTimeout(ok,5000))]);}
 for(const stream of streams)await new Promise(ok=>stream.end(ok));for(const file of files)fs.writeFileSync(file+'.gz',gzipSync(fs.readFileSync(file)));
 record.finished=new Date().toISOString();fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
}
