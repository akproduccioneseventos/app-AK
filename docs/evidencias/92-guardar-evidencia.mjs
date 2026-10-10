import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const temp=fs.realpathSync(process.argv[2]),label=process.argv[3];
if(path.dirname(temp)!==fs.realpathSync(path.join(os.tmpdir(),'ak-codex88'))||!/^[a-z0-9-]+$/.test(label))throw new Error('Solo TEMP reservado/etiqueta segura');
const root=path.resolve('docs/evidencias'),raw=fs.readFileSync(path.join(temp,'88-e2e-resultados.json'),'utf8');
fs.writeFileSync(path.join(root,'92-'+label+'.json'),raw);
const dir=path.join(root,'92-artifactos',label);fs.mkdirSync(dir,{recursive:true});
let i=0;
function walk(o){if(!o||typeof o!=='object')return;
  if(o.attachments)for(const a of o.attachments){
    if(!/\.(png|pdf|json|txt|zip)$/.test(a.name)||a.name==='trace.zip')continue;
    const n=String(++i).padStart(2,'0')+'-'+path.basename(a.name);
    if(a.body)fs.writeFileSync(path.join(dir,n),Buffer.from(a.body,'base64'));
    else if(a.path&&fs.existsSync(a.path))fs.copyFileSync(a.path,path.join(dir,n));
  }
  for(const [k,v]of Object.entries(o))if(k!=='attachments'){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
}
walk(JSON.parse(raw));
function images(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())images(f);else if(/\.(png|md)$/.test(e.name))fs.copyFileSync(f,path.join(dir,String(++i).padStart(2,'0')+'-'+e.name));}}
images(path.join(temp,'test-results'));
console.log(label,JSON.parse(raw).stats,'artefactos='+i);
