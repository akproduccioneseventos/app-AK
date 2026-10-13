import fs from 'node:fs';
import admin from 'firebase-admin';
if(process.env.AK_ENTORNO_AISLADO!=='true' || process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085' || process.env.PLAYWRIGHT_BASE_URL!=='http://127.0.0.1:3301') throw new Error('Private SDK emulator only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa110-providers');
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
const before=await db.collection('proveedores').get();
if(!before.empty) throw new Error('Fresh owned emulator collection required');
process.argv.push('--providers');
try {await import('./110-acciones-probe.mjs');}
finally {
  const after=await db.collection('proveedores').get(),removed=[];
  for(const doc of after.docs) {
    if(!doc.data().nombreEmpresa?.startsWith('QA110_')) throw new Error('Unexpected emulator data: '+doc.id);
    await doc.ref.delete();removed.push(doc.id);
  }
  fs.writeFileSync('docs/evidencias/110-providers-sdk-restauracion.json',JSON.stringify({initialCount:before.size,removed,remaining:(await db.collection('proveedores').get()).size},null,2));
  await app.delete();
}
