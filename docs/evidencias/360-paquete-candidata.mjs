import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const dir=fileURLToPath(new URL('./',import.meta.url)),root=fileURLToPath(new URL('../../',import.meta.url));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const blob=(relative,bytes)=>{const r=spawnSync('git',['hash-object','--path='+relative,'--stdin'],{cwd:root,input:bytes,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return r.stdout.trim();};
const paths=[],entries=[];
for(const name of fs.readdirSync(dir).sort()){
 if(!/^(?:34[7-9]|35[0-9])[-.]/.test(name)||!/\.((?:mjs|md|json|log)(?:\.gz)?)$/.test(name))continue;
 const file=path.join(dir,name);if(!fs.statSync(file).isFile()||name.endsWith('.gz'))continue;
 const bytes=fs.readFileSync(file),compressed=name.endsWith('.log')||bytes.length>100000;
 const destination=compressed?file+'.gz':file;
 if(compressed)fs.writeFileSync(destination,gzipSync(bytes));
 const relative=path.relative(root,destination).replaceAll('\\','/');
 const payload=fs.readFileSync(destination);
 paths.push(relative);entries.push({original:'docs/evidencias/'+name,published:relative,rawBytes:bytes.length,rawSha256:hash(bytes),workingCopySha256:hash(payload),expectedGitBlob:blob(relative,payload)});
}
for(const name of ['ESTADO-ACTUAL.md','docs/YA-RESUELTO.md','docs/evidencias/253-recuento-unico-auditoria.md','docs/evidencias/361-entrega-candidata.md','docs/ordenes/212-gemini-portal-del-cliente-lo-que-se-ve.md','docs/ordenes/214-gemini-filtros-datos-reactivos-y-ruleta.md','docs/ordenes/215-gemini-devolucion-1353.md','docs/ordenes/217-recordatorios-autorizacion-fecha-y-fallos.md']){
 const bytes=fs.readFileSync(path.join(root,name));paths.push(name);entries.push({published:name,rawBytes:bytes.length,workingCopySha256:hash(bytes),expectedGitBlob:blob(name,bytes)});
}
paths.push('docs/evidencias/360-paquete-candidata.mjs','docs/evidencias/360-manifiesto-candidata.json');
fs.writeFileSync(path.join(dir,'360-manifiesto-candidata.json'),JSON.stringify({source:'3f9460185143ef034dcd713e975d2a0af5e20f1a',baseline:'3e45a4ac6b479f89605163168e31b37dc84f2d0f',purpose:'Supplement347-359, not rewrite package316 or acceptance of candidate/all app. Raw logs preserved locally; gzip transport lossless. workingCopy hashes are local bytes; expectedGitBlob accounts for Git text filters.',entries},null,2)+'\n');
fs.writeFileSync(path.join(dir,'360-stage-paths.nul'),paths.join('\0')+'\0');
console.log(JSON.stringify({entries:entries.length,paths:paths.length,appFiles:paths.filter(p=>p.startsWith('src/'))}));
