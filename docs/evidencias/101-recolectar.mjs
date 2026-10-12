import fs from 'node:fs';
import path from 'node:path';
const repo=process.cwd(),root=path.join(repo,'docs/evidencias'),out=path.join(root,'101-artifactos');
fs.mkdirSync(out,{recursive:true});
const raw=process.argv[2]||'101-browser.json';if(!/^101-[a-z0-9-]+\.json$/.test(raw))throw new Error('QA101 report only');
const json=JSON.parse(fs.readFileSync(path.join(root,raw),'utf8')),results=[];
function walk(s){
  for(const spec of s.specs||[])for(const test of spec.tests||[])for(const r of test.results||[]){
    const label=raw.replace('.json','')+'-'+String(results.length).padStart(2,'0'),attachments=[];
    for(const [i,a] of (r.attachments||[]).entries()){
      const ext=a.contentType?.includes('json')?'.json':a.contentType?.includes('png')?'.png':'.txt';
      const dest=path.join(out,label+'-'+i+ext);
      if(a.path&&fs.existsSync(a.path))fs.copyFileSync(a.path,dest);
      else if(a.body)fs.writeFileSync(dest,Buffer.from(a.body,'base64'));
      else continue;
      attachments.push({name:a.name,file:path.relative(repo,dest).replaceAll('\\','/')});
    }
    results.push({title:spec.title,project:test.projectName,status:r.status,duration:r.duration,errors:(r.errors||[]).map(e=>e.message),attachments});
  }
  for(const child of s.suites||[])walk(child);
}
for(const suite of json.suites||[])walk(suite);
fs.writeFileSync(path.join(root,raw.replace('.json','-resultados.json')),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({attachments,errors,...r})=>r),null,2));
