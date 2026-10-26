import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const record={source:'978af7d65a60bd287f3ee3cc05037a29566074f4',started:new Date().toISOString(),previous:'492 preflight only: canonical left fixture notifications changed; no browser case ran.',appEdited:false,realServices:false};
const target=path.join(dir,'500-continuidad.json');assert(!fs.existsSync(target));
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const build=JSON.parse(fs.readFileSync(path.join(dir,'486-entorno.json'),'utf8')),qa=path.resolve(build.qa);
 assert.equal(build.source,record.source);assert.equal(build.phase,'built');
 assert.equal(qa,path.resolve('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-480-delta-Apsy7q'));
 const git=args=>{const r=spawnSync('git',args,{cwd:qa,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 assert.equal(git(['rev-parse','HEAD']),record.source);
 const diff=git(['diff','--name-only']);assert(['','data/notifications.json'].includes(diff),diff);
 if(diff){const bytes=fs.readFileSync(path.join(qa,diff));record.qaFixtureAfterCanonical={path:diff,bytes:bytes.length};
  fs.writeFileSync(path.join(dir,'500-notifications-post-canonical.bin'),bytes);
  const r=spawnSync('git',['show',record.source+':'+diff],{cwd:qa,maxBuffer:16*1024*1024});assert.equal(r.status,0);fs.writeFileSync(path.join(qa,diff),r.stdout);
 }
 assert.equal(git(['diff','--name-only']),'');
 const child=path.join(dir,'501-recorridos-sdk.mjs'),parent=path.join(dir,'502-sdk-emuladores.mjs');assert(!fs.existsSync(child)&&!fs.existsSync(parent));
 fs.writeFileSync(child,fs.readFileSync(path.join(dir,'493-recorridos-sdk.mjs'),'utf8').replaceAll('493','501').replaceAll('496','504'));
 fs.writeFileSync(parent,fs.readFileSync(path.join(dir,'492-sdk-emuladores.mjs'),'utf8').replaceAll('492','502').replaceAll('493','501'));
 record.phase='native-running';save();await import(pathToFileURL(parent).href);
 const result=JSON.parse(fs.readFileSync(path.join(dir,'502-emuladores.json'),'utf8'));record.nativeExit=result.exitCode;record.phase='finished';
}catch(e){record.phase='qa-block-or-run-error';record.error=String(e.stack||e);process.exitCode=1;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
