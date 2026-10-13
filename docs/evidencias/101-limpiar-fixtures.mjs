import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
const cwd=path.join(os.tmpdir(),'ak-codex88','ak-entorno-aislado-101');
if(fs.realpathSync(cwd)!==cwd||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||process.env.FIREBASE_STORAGE_EMULATOR_HOST!=='127.0.0.1:9195')throw new Error('Demo101 only');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'cleanup101');
const db=app.firestore(),bucket=app.storage().bucket(),borrowed=new Set(['e2e_99_qr_corto_1791695521018','e2e_99_qr_uuid_1791695586308']),own={test:id=>/^e2e_101_/.test(id)||borrowed.has(id)};
const report={cwd,deletedDocs:[],deletedFiles:[],deletedLocal:[],trimmedSessions:[],preservedCollections:[],finished:null};
try{
  for(const c of await db.listCollections()){
    for(const d of (await c.get()).docs){
      if(own.test(d.id)){await d.ref.delete();report.deletedDocs.push(d.ref.path);continue;}
      const data=d.data(),state=data._data??data;
      if(Array.isArray(state.sessions)){
        const removed=state.sessions.filter(s=>own.test(s.fiestaId||''));
        if(removed.length){const sessions=state.sessions.filter(s=>!own.test(s.fiestaId||''));await d.ref.set(data._data?{...data,_data:{...state,sessions}}:{...data,sessions});report.trimmedSessions.push({path:d.ref.path,ids:removed.map(s=>s.id)});}
      }
    }
    const left=(await c.get()).docs;if(left.length)report.preservedCollections.push({name:c.id,count:left.length,ids:left.map(d=>d.id)});
  }
  for(const f of (await bucket.getFiles())[0])if(f.name.startsWith('qa101/')){await f.delete();report.deletedFiles.push(f.name);}
  for(const relative of ['data/fiestas','src/data/fiestas']){
    const dir=path.join(cwd,relative);if(!fs.existsSync(dir))continue;
    for(const name of fs.readdirSync(dir))if(own.test(name)&&name.endsWith('.json')){
      const file=path.join(dir,name);if(path.dirname(fs.realpathSync(file))!==fs.realpathSync(dir))throw new Error('Path escape');
      fs.unlinkSync(file);report.deletedLocal.push(file);
    }
  }
  report.finished=new Date().toISOString();
  fs.writeFileSync(path.join(process.cwd(),'docs/evidencias/101-limpieza.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await app.delete();}
