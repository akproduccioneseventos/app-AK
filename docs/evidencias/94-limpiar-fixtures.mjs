import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
const cwd=path.join(os.tmpdir(),'ak-codex88','ak-entorno-aislado-94');
if(fs.realpathSync(cwd)!==cwd || process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  ||process.env.FIREBASE_STORAGE_EMULATOR_HOST!=='127.0.0.1:9195') throw new Error('Demo94 only');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'cleanup94');
const db=app.firestore(),bucket=app.storage().bucket();
const own=/(?:e2e_94_|e2e_personal91_|q92[rv])/;
const report={cwd,deletedDocs:[],deletedFiles:[],deletedLocal:[],preservedCollections:[],finished:null};
try {
  for(const collection of await db.listCollections()) {
    const docs=(await collection.get()).docs;
    for(const doc of docs) if(own.test(doc.id)) { await doc.ref.delete();report.deletedDocs.push(doc.ref.path); }
    const left=(await collection.get()).docs;
    if(left.length)report.preservedCollections.push({name:collection.id,count:left.length,ids:left.map(d=>d.id)});
  }
  for(const f of (await bucket.getFiles())[0])if(own.test(f.name)||f.name.startsWith('qa94/')) {
    await f.delete();report.deletedFiles.push(f.name);
  }
  for(const relative of ['data/fiestas','src/data/fiestas']) {
    const dir=path.join(cwd,relative);if(!fs.existsSync(dir))continue;
    for(const name of fs.readdirSync(dir)) if(own.test(name)&&name.endsWith('.json')) {
      const file=path.join(dir,name);if(path.dirname(fs.realpathSync(file))!==fs.realpathSync(dir))throw new Error('Path escape');
      fs.unlinkSync(file);report.deletedLocal.push(file);
    }
  }
  report.finished=new Date().toISOString();
  fs.writeFileSync(path.join(process.cwd(),'docs/evidencias/94-limpieza.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {await app.delete();}
