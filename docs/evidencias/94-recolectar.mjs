import fs from 'node:fs';
import path from 'node:path';
const repo=process.cwd(),root=path.join(repo,'docs/evidencias'),out=path.join(root,'94-artifactos');
fs.mkdirSync(out,{recursive:true});
const result=[];
for(const name of process.argv.slice(2)){
  if(!/^94-[a-z-]+\.json$/.test(name))throw new Error('Nombre no permitido');
  const json=JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
  const walk=s=>{
    for(const spec of s.specs||[])for(const test of spec.tests||[])for(const r of test.results||[]){
      const label=name.replace('.json','')+'-'+String(result.length).padStart(2,'0');
      const attachments=[];
      for(const [i,a] of (r.attachments||[]).entries()){
        const ext=a.contentType?.includes('json')?'.json':a.contentType?.includes('pdf')?'.pdf':a.contentType?.includes('jpeg')?'.jpg':a.contentType?.includes('png')?'.png':'.txt';
        const dest=path.join(out,label+'-'+i+ext);
        if(a.path&&fs.existsSync(a.path))fs.copyFileSync(a.path,dest);
        else if(a.body)fs.writeFileSync(dest,Buffer.from(a.body,'base64'));
        else continue;
        attachments.push({name:a.name,file:path.relative(repo,dest).replaceAll('\\','/')});
      }
      result.push({report:name,title:spec.title,project:test.projectName,status:r.status,duration:r.duration,errors:(r.errors||[]).map(e=>e.message),attachments});
    }
    for(const child of s.suites||[])walk(child);
  };
  for(const suite of json.suites||[])walk(suite);
}
fs.writeFileSync(path.join(root,'94-resultados.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result.map(({report,title,project,status,duration,errors})=>({report,title,project,status,duration,errors})),null,2));
