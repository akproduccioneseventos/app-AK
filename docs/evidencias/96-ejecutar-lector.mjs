import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync,spawn} from 'node:child_process';
const repo=process.cwd(),cwd=path.join(os.tmpdir(),'ak-codex88','ak-entorno-aislado-94');
const sha='9a054620718673f00e10b52f0811cc1af729ba4e';
if(execFileSync('git',['-C',cwd,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==sha ||
   fs.readdirSync(cwd).some(n=>/^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)))throw new Error('Source/credentials mismatch');
fs.copyFileSync(path.join(repo,'docs/evidencias/96-video-lector.test.tsx'),path.join(cwd,'src/__tests__/qa96-video-lector.test.tsx'));
const keys=['PATH','HOME','LANG','TEMP','TMP','SYSTEMROOT','USERPROFILE','WINDIR','APPDATA','LOCALAPPDATA','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT'];
const env=Object.fromEntries(keys.filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
Object.assign(env,{NODE_ENV:'test',NEXT_TELEMETRY_DISABLED:'1',AK_ENTORNO_AISLADO:'true',FIREBASE_PROJECT_ID:'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:'demo-ak-producciones.appspot.com',GOOGLE_API_KEY:'dummy',GEMINI_API_KEY:'dummy'});
const log=fs.createWriteStream(path.join(repo,'docs/evidencias/96-lector.log'));
const child=spawn(process.execPath,['node_modules/jest/bin/jest.js','--runInBand','--runTestsByPath','src/__tests__/qa96-video-lector.test.tsx',
  '--json','--outputFile='+path.join(repo,'docs/evidencias/96-lector.json')],{cwd,env,stdio:['ignore','pipe','pipe']});
for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log.write(b);process.stdout.write(b);});
child.on('exit',code=>log.end(()=>{process.exitCode=code??1;}));
