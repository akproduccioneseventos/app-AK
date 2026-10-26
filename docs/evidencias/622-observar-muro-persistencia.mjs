import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import assert from'node:assert/strict';
const dir=fileURLToPath(new URL('./',import.meta.url)),file=path.join(dir,'622-muro-persistencia.json');assert(!fs.existsSync(file));
const out={source:'f8f7cf34e8778de784b20e2654058fd722b2a2ec',started:new Date().toISOString(),readOnly:true,realServices:false,observations:[]};
const finish=()=>fs.writeFileSync(file,JSON.stringify({...out,finished:new Date().toISOString()},null,2)+'\n');
try{const until=Date.now()+20*60000;let prev='';while(Date.now()<until){const run=JSON.parse(fs.readFileSync(path.join(dir,'609-ejecucion.json'),'utf8'));if(run.finished)break;if(run.currentBatch===8){
 const res=await fetch('http://127.0.0.1:8085/v1/projects/demo-ak-producciones/databases/(default)/documents/social_gallery_posts?pageSize=100',{signal:AbortSignal.timeout(3000)});
 const data=await res.json();const docs=(data.documents||[]).map(d=>({id:d.name.split('/').at(-1),fiestaId:d.fields?.fiestaId?.stringValue,authorName:d.fields?.authorName?.stringValue,moderationStatus:d.fields?.moderationStatus?.stringValue,imagePresent:!!d.fields?.imageUrl?.stringValue}));
 const key=JSON.stringify(docs);if(key!==prev){out.observations.push({at:new Date().toISOString(),status:res.status,docs});prev=key;}
 }await new Promise(ok=>setTimeout(ok,2000));}}catch(error){out.error=String(error.message||error);}finally{finish();console.log(JSON.stringify({observations:out.observations.length,error:out.error}));}
