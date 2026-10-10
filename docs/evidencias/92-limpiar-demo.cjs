// Resultado generado de limpieza; nunca se conecta a produccion.
const fs=require('node:fs');const admin=require('firebase-admin');
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||process.env.FIREBASE_STORAGE_EMULATOR_HOST!=='127.0.0.1:9195')throw Error('Solo emuladores demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'limpieza92');
const db=app.firestore(),bucket=app.storage().bucket();
const propio=id=>/^q92[rv][a-z0-9]+$/.test(id)||id.includes('e2e_catering92_')||id.includes('e2e_recibos92_')||id.includes('e2e_album92_')||id.includes('e2e_vida92_')||id.includes('e2e_geo92_');
(async()=>{
  const restos=[];
  for(const nombre of ['fiestas','presupuestos','menus_catering','insumos','empleados','roles','social_gallery_posts','social_dedications']){
    const snap=await db.collection(nombre).get();for(const doc of snap.docs){if(propio(doc.id)||propio(doc.data().fiestaId||'')){restos.push({coleccion:nombre,id:doc.id});await doc.ref.delete();}}
  }
  const archivos=[];for(const prefix of ['qa92/','video-vida-photos/e2e_vida92_','dedications-audio/e2e_album92_']){
    const [files]=await bucket.getFiles({prefix});for(const file of files){if(file.name.includes('e2e_album92_')||file.name.includes('e2e_vida92_')){archivos.push(file.name);await file.delete();}}
  }
  const ajustes={};for(const id of ['ajustes-llegada.json','accesos-personal.json']){const d=await db.collection('json_documents').doc(id).get();ajustes[id]=d.exists?d.data():null;}
  const result={project:'demo-ak-producciones',firestore:'127.0.0.1:8085',storage:'127.0.0.1:9195',restosBorrados:restos,archivosBorrados:archivos,ajustes,fecha:new Date().toISOString()};
  fs.writeFileSync('docs/evidencias/92-limpieza-demo.json',JSON.stringify(result,null,2)+'\n');console.log(result);await app.delete();
})().catch(e=>{console.error(e);process.exitCode=1;});
