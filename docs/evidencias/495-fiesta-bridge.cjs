const fs=require('node:fs'),assert=require('node:assert/strict');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
const {initializeApp,deleteApp}=require('firebase-admin/app'),{getFirestore}=require('firebase-admin/firestore');
const app=initializeApp({projectId:'demo-ak-producciones'}),db=getFirestore(app);
(async()=>{try{const[op,id]=process.argv.slice(2);assert(id&&!id.includes('/'));const ref=db.collection('fiestas').doc(id);let result=null;
 if(op==='get'){const d=await ref.get();result=d.exists?d.data():null;}
 else if(op==='set'){const data=JSON.parse(fs.readFileSync(0,'utf8'));assert.equal(data.id,id);await ref.set(data);result={saved:true};}
 else if(op==='delete'){await ref.delete();result={deleted:true};}else throw Error('Unknown QA fixture operation');
 process.stdout.write(JSON.stringify(result));
}finally{await db.terminate();await deleteApp(app);}})().catch(e=>{console.error(String(e.stack||e));process.exitCode=1;});
