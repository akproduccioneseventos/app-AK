import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import {fixtureGuard} from './110-fixture-guard.mjs';

if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw Error('Owned demo only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa125-fixtures'),db=app.firestore();
for(const c of await db.listCollections())if(!(await c.limit(1).get()).empty)throw Error('Empty owned SDK required');
const restore=fixtureGuard();
const fixtureFiles=[];
function emptyArrays(folder){
  if(!fs.existsSync(folder))return;
  for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
    const file=folder+'/'+entry.name;
    if(entry.isDirectory())emptyArrays(file);
    else if(entry.name.endsWith('.json')){
      let data;try{data=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}catch{continue;}
      if(data&&typeof data==='object'){
        const beforeSha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
        const value=Array.isArray(data)?'[]\n':'{}\n';fs.writeFileSync(file,value);
        fixtureFiles.push({file,beforeSha256,afterSha256:crypto.createHash('sha256').update(value).digest('hex')});
      }
    }
  }
}
emptyArrays('data');emptyArrays('src/data');
const id='qa125-fiesta';
await db.collection('fiestas').doc(id).set({id,configuracion:{nombreEvento:'Fiesta QA125',clienteNombre:'Cliente ficticio QA125',tipoEvento:'Boda',fechaEvento:'2027-08-08',invitadosEstimados:100},tareas:[],listaInvitados:[],presupuestoId:'qa125-presupuesto'});
await db.collection('servicios').doc('qa125-dj').set({id:'qa125-dj',nombre:'DJ ficticio QA125',categoria:'Discoteca',precioBase:1000,calculationMethod:'fijo',activo:true});
const record={applicationSourceSha:process.env.COMMIT_SHA,pid:process.pid,readyAt:new Date().toISOString(),fixtureId:id,
  kind:'FICTITIOUS_LOCAL_SESSION_NOT_REAL_LOGIN',origin:'http://127.0.0.1:3302',status:'running',fixtureFiles};
const server=http.createServer(async(req,res)=>{
  if(req.socket.remoteAddress!=='127.0.0.1'){res.writeHead(403).end();return;}
  if(req.url==='/entrada'){
    const payload=`v1.${Date.now()+900000}.${crypto.randomUUID()}`;
    const value=payload+'.'+crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex');
    res.writeHead(303,{'Set-Cookie':`ak_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`,Location:'http://127.0.0.1:3301/evento/barra'}).end();
  }else if(req.url==='/salir'){
    res.writeHead(303,{'Set-Cookie':'ak_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',Location:'http://127.0.0.1:3301/login'}).end();
  }else if(req.url==='/cerrar'&&req.method==='POST'&&req.headers['x-ak-qa-close']==='owned-qa125'){
    const before={};for(const c of await db.listCollections()){
      const docs=(await c.get()).docs;before[c.id]=docs.length;
      for(const doc of docs)await db.recursiveDelete(doc.ref);
    }
    const cleanup=restore();await app.delete();
    fs.writeFileSync('docs/evidencias/125-fixtures-limpieza.json',JSON.stringify({before,remaining:0,cleanup},null,2)+'\n');
    fs.writeFileSync('docs/evidencias/125-fixtures-execution.json',JSON.stringify({...record,status:'finished',finishedAt:new Date().toISOString()},null,2)+'\n');
    res.writeHead(200).end('Fictitious fixtures removed; original bytes restored');server.close();
  }else res.writeHead(404).end();
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(3302,'127.0.0.1',resolve);});
fs.writeFileSync('docs/evidencias/125-fixtures-execution.json',JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({status:'ready',fixtureId:id,bootstrapPort:3302,realLoginCertified:false}));
