import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const runtime=JSON.parse(fs.readFileSync('docs/evidencias/93-runtime.json','utf8'));
const cwd=fs.realpathSync(runtime.cwd);
if(cwd!==path.join(os.tmpdir(),'ak-codex88','ak-entorno-aislado-93') ||
execFileSync('git',['-C',cwd,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==runtime.sha)throw new Error('Solo demo93 propio');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8085';
process.env.FIREBASE_STORAGE_EMULATOR_HOST='127.0.0.1:9195';
const admin=createRequire(path.join(cwd,'package.json'))('firebase-admin');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'cleanup93');
const db=app.firestore(),bucket=app.storage().bucket();
const own=/e2e_(?:93_|barra93_|recordatorio93_)/;
const deleted=[],remaining=[],unrelated=[];
for(const col of await db.listCollections()){
  const snapshot=await col.get();
  for(const doc of snapshot.docs){
    if(own.test(doc.id)||own.test(String(doc.data().fiestaId||''))){await doc.ref.delete();deleted.push(doc.ref.path);}
    else unrelated.push(doc.ref.path);
  }
}
const [files]=await bucket.getFiles();
for(const file of files)if(own.test(file.name)){await file.delete();deleted.push('storage:'+file.name);}
for(const dir of [path.join(cwd,'data','fiestas'),path.join(cwd,'src','data','fiestas')]){
  if(!fs.existsSync(dir))continue;
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    if(!item.isFile()||!own.test(item.name)||!item.name.endsWith('.json'))continue;
    const target=path.resolve(dir,item.name);
    if(!target.startsWith(cwd+path.sep))throw new Error('Archivo fuera de TEMP93');
    fs.unlinkSync(target);deleted.push('local:'+path.relative(cwd,target));
  }
}
// Este emulador se inicio vacio, sin importacion, y solo lo usa el launcher93.
const marker=db.collection('json_documents').doc('tareas-automaticas.json');
if((await marker.get()).exists){await marker.delete();deleted.push(marker.path);}
for(const col of await db.listCollections())for(const doc of (await col.get()).docs)
  if(own.test(doc.id)||own.test(String(doc.data().fiestaId||'')))remaining.push(doc.ref.path);
for(const file of (await bucket.getFiles())[0])if(own.test(file.name))remaining.push('storage:'+file.name);
const result={checkedAt:new Date().toISOString(),sha:runtime.sha,project:'demo-ak-producciones',deleted,remaining,unrelated,scope:'Referencias directas y archivos propios; respaldos/metadatos demo preservados',productionTouched:false};
fs.writeFileSync('docs/evidencias/93-limpieza-demo.json',JSON.stringify(result,null,2));
await app.delete();
console.log(JSON.stringify({deleted:deleted.length,remaining,unrelated}));
if(remaining.length)process.exitCode=1;
