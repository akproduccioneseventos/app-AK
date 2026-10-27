// Exact module bodies; isolated filesystems and database doubles, no real I/O from app.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const ts = require(process.env.AK_QA_TYPESCRIPT || 'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');
const sha = 'b58abab75d94a732daf79b32aff54ec253ccf63c';
const sources = {};
const copy = x => structuredClone(x);
function load(file, deps, context = {}) {
  const text = sources[file] ||= cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'});
  const exports = {};
  vm.runInNewContext(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
    exports, require(id) { if (!(id in deps)) throw new Error(`UNMOCKED ${id}`); return deps[id]; },
    console:{warn(){},error(){},log(){}}, Date, Math, ...context,
  },{filename:`${sha}/${file}`,timeout:3000});
  return exports;
}
const rows=[];
async function check(id,title,fn) { try { const result=await fn(); rows.push({id,title,status:result.pass?'PASS':'FAIL',...result}); } catch(e){ rows.push({id,title,status:'HARNESS_ERROR',error:String(e.stack)}); } }
function instance(db,failRemote=false) {
  const files = new Map();
  const fakeFs={existsSync:p=>files.has(p),mkdirSync(){},readFileSync:p=>files.get(p),writeFileSync:(p,v)=>files.set(p,v)};
  const api=load('src/lib/ia/reglas-de-la-ia.ts',{'fs':fakeFs,'path':path,'@/lib/data-service':{
    readData:async(file,fallback)=>copy(db[file]??fallback),
    writeData:async(file,data)=>{if(failRemote)throw new Error('QA_REMOTE_DOWN');db[file]=copy(data);},
  }},{process:{cwd:()=>'/qa-isolated',env:{NODE_ENV:'production'}}});
  return api;
}
(async()=>{
  await check('R01','Disable on instance B must be observed on existing instance A',async()=>{
    const db={}; const a=instance(db),b=instance(db);
    await a.guardarReglaIA('armar_web_evento','sola','dueno');
    await b.guardarReglaIA('armar_web_evento','apagada','dueno');
    const actualA=await a.getReglaParaTarea('armar_web_evento');
    const actualB=await b.getReglaParaTarea('armar_web_evento');
    return {pass:actualA==='apagada'&&actualB==='apagada',actualA,actualB,remote:db};
  });
  await check('R02','Failed shared save must not report durable success',async()=>{
    const db={}; const a=instance(db,true); const result=await a.guardarReglaIA('armar_web_evento','apagada','dueno');
    const fresh=await instance(db).getReglaParaTarea('armar_web_evento');
    return {pass:result.success===false,result,fresh,remote:db};
  });
  await check('R03','Sequential changes from stale workers must retain unrelated disabled rules',async()=>{
    const db={}; const a=instance(db),b=instance(db);
    await a.guardarReglaIA('armar_web_evento','sola','dueno');
    await b.guardarReglaIA('vigilante_fiestas','apagada','dueno');
    await a.guardarReglaIA('generador_contenido','apagada','dueno');
    return {pass:db['reglas-de-la-ia.json']?.vigilante_fiestas==='apagada',remote:db};
  });
  await check('R04','Forbidden solo messaging is rejected',async()=>{
    try {await instance({}).guardarReglaIA('mandar_mensajes_clientes','sola','dueno');return {pass:false};}
    catch(e){return {pass:/seguridad/.test(e.message),message:e.message};}
  });
  await check('R05','One worker sees its successful local setting',async()=>{
    const db={};const a=instance(db);await a.guardarReglaIA('armar_web_evento','apagada','dueno');
    const observed=await a.getReglaParaTarea('armar_web_evento');return {pass:observed==='apagada',observed};
  });
  await check('W01','Actual control action plus actual web action must save before claiming web completed',async()=>{
    const defaults=load('src/lib/invitacion-digital-defaults.ts',{});
    const event={id:'qa-lucia',configuracion:{nombreEvento:'QA Lucia'}};
    let saved=0,generated=0;const records=[];
    const web=load('src/app/actions/fiesta/armar-web-con-ia.actions.ts',{
      '@/app/actions/fiesta/fiesta.actions':{requireFiestaWriteAccess:async()=>{},getFiestaById:async()=>copy(event),saveFiesta:async()=>{saved++;return {success:true};}},
      '@/ai/flows/armar-web-del-evento-flow':{armarWebDelEventoFlow:async()=>{generated++;return copy(defaults.defaultInvitacionDigitalData);}},
      '@/lib/invitacion-digital-defaults':defaults,
      '@/lib/security/portal-session':{},'@/lib/notifications/create-notification':{},
    });
    const control=load('src/app/actions/centro-de-control.ts',{
      '@/lib/auth/perfiles':{PERMISOS:{ADMINISTRACION:'admin'}},'@/lib/auth/require-session':{requirePermiso:async()=>({ok:true,user:{perfil:'dueno'}})},
      '@/lib/asistente/propuestas-service':{},'@/app/actions/scheduled-messages':{},'@/lib/whatsapp/internal-token':{},
      '@/lib/data-service':{readData:async()=>[copy(event)]},
      '@/lib/ia/reglas-de-la-ia':{getReglaParaTarea:async()=>'sola',registrarAccionSola:async r=>records.push(copy(r))},
      '@/lib/agentes/motor-agentes':{},'@/app/actions/fiesta/armar-web-con-ia.actions':web,
    });
    const result=await control.darOrdenPorVozOTexto('armar web de QA Lucia');
    return {pass:!result.success||saved===1,result,saved,generated,records};
  });
  const report={sha,method:'Unmodified module bodies with memory filesystem per worker/shared data double; actual control+web actions, generated template double. No SDK/HTTP/real model/production.',sources:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),rows,counts:Object.fromEntries(['PASS','FAIL','HARNESS_ERROR'].map(s=>[s,rows.filter(r=>r.status===s).length]))};
  fs.writeFileSync(path.join(__dirname,'698-reglas-y-web-resultados.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));process.exitCode=report.counts.HARNESS_ERROR?2:report.counts.FAIL?1:0;
})();
