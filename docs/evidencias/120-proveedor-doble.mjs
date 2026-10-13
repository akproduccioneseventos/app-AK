import fs from 'node:fs';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085') throw new Error('Private QA provider only');
const fetchLocal=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(url.hostname==='127.0.0.1'||url.hostname==='localhost') return fetchLocal(input,init);
  const file='docs/evidencias/120-model-plan.generated.json';
  if(url.hostname==='generativelanguage.googleapis.com'&&fs.existsSync(file)) {
    const plan=JSON.parse(fs.readFileSync(file,'utf8'));
    const step=plan.steps?.[plan.index];
    plan.calls=(plan.calls||0)+1; plan.index=(plan.index||0)+1;
    fs.writeFileSync(file,JSON.stringify(plan));
    if(step) return new Response(JSON.stringify({candidates:[{index:0,content:{role:'model',parts:[{text:JSON.stringify(step)}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:1,candidatesTokenCount:1,totalTokenCount:2}}),{status:200,headers:{'content-type':'application/json'}});
  }
  // Ninguna solicitud externa sale de esta corrida; las claves son ficticias.
  fs.appendFileSync('docs/evidencias/120-outbound-blocked.log',url.hostname+'\n');
  return new Response(JSON.stringify({error:{code:400,status:'INVALID_ARGUMENT',message:'QA120 proveedor no disponible'}}),{status:400,headers:{'content-type':'application/json'}});
};
