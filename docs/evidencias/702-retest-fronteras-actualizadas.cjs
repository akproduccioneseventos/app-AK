// Same acceptance criteria, current-source imports and state setters explicitly supplied.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const old='b58abab75d94a732daf79b32aff54ec253ccf63c',target='c0add57f6237f666db97e7e902ef75f6c8d97479';
const scripts=['697-centro-control-sonda.cjs','698-reglas-y-web-sonda.cjs','699-consumidor-centro-sonda.cjs'];
const runs=[];
for(const file of scripts){
  let code=fs.readFileSync(path.join(__dirname,file),'utf8').replaceAll(old,target).replace(/(['"])(69[789][^'"]+-resultados\.json)\1/g,(_,q,n)=>q+'702-'+n+q);
  if(file.startsWith('697'))code=code.replace("'@/lib/agentes/motor-agentes': {},","'@/lib/agentes/motor-agentes': {}, '@/app/actions/fiesta/fiesta.actions': {getFiestaById:async()=>null,saveFiesta:async()=>({success:false})},");
  if(file.startsWith('698')){
    code=code.replace('readData:async(file,fallback)=>copy(db[file]??fallback),','readData:async(file,fallback)=>copy(db[file]??fallback),readDataConDetalle:async(file,fallback)=>({valor:copy(db[file]??fallback),huboFalla:false}),');
    code=code.replace("'@/lib/agentes/motor-agentes':{},'@/app/actions/fiesta/armar-web-con-ia.actions':web,","'@/lib/agentes/motor-agentes':{},'@/app/actions/fiesta/armar-web-con-ia.actions':web,'@/app/actions/fiesta/fiesta.actions':{getFiestaById:async()=>copy(event),saveFiesta:async()=>{saved++;return {success:true};}},");
  }
  if(file.startsWith('699')){
    code=code.replace("texto:'OLD',enlaceWhatsapp:","texto:'OLD',telefono:'59800000000',enlaceWhatsapp:");
    code=code.replace('setProcesandoId(){},setEditandoId(){},','setProcesandoId(){},setEditandoId(){},setErrorOk(){},');
  }
  const cmd=`new Function('__dirname','require',${JSON.stringify(code)})(${JSON.stringify(__dirname)},require)`;
  const r=cp.spawnSync(process.execPath,['-e',cmd],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8',timeout:30000});
  runs.push({file,exit:r.status,stderr:r.stderr,stdout:r.stdout,error:r.error?.message});
  console.log(JSON.stringify({file,exit:r.status,error:r.error?.message}));
}
fs.writeFileSync(path.join(__dirname,'702-ejecucion.json'),JSON.stringify({target,runs},null,2)+'\n');
