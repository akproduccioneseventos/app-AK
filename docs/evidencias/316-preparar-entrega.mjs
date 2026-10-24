import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),manifestFile=path.join(dir,'316-manifiesto-entrega.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const inside=file=>{const p=path.resolve(file);assert(p.startsWith(path.resolve(dir)+path.sep));return p;};
if(process.argv.includes('--restore')){
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));let restored=0;
 for(const item of manifest.files){if(item.encoding!=='gzip')continue;const file=inside(path.join(root,item.path)),archive=inside(path.join(root,item.transport));if(fs.existsSync(file))continue;const bytes=gunzipSync(fs.readFileSync(archive));assert.equal(sha(bytes),item.localRawSha256);fs.writeFileSync(file,bytes,{flag:'wx'});restored++;}
 console.log(JSON.stringify({restored,scope:'Only missing raw evidence reconstructed from checked local archives; no app files.'}));
}else{
 assert(!fs.existsSync(manifestFile),'Preserve previous manifest');
 for(const file of['311-continuidad.json','315-continuidad-final.json','320-continuidad-recorrido.json','322-continuidad-canonica.json','328-continuidad-control.json','330-continuidad-normal.json','332-continuidad-restantes.json','334-contexto-continuidad.json','337-excepciones-continuidad.json','340-excepciones-continuidad.json','344-excepciones-continuidad.json','345-jest-final.json'])assert.equal(JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')).phase,'finished','Do not package live reports');
 const names=fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isFile()).map(e=>e.name).filter(n=>{const id=Number(n.match(/^(\d+)-/)?.[1]);return(id>=267&&id<=345||/^(332|336|338)\d{2}-/.test(n))&&/\.(mjs|cjs|ts|md|ps1|json|gz|log|png)$/.test(n);});
 const files=[],selected=new Set();
 for(const name of names){
  const file=inside(path.join(dir,name)),bytes=fs.readFileSync(file);let transport=name,encoding='raw';
  if(name.endsWith('.log')||(name.endsWith('.json')&&bytes.length>256*1024)){
   transport=name+'.gz';encoding='gzip';
   if(fs.existsSync(path.join(dir,transport))){let matches=false;try{matches=sha(gunzipSync(fs.readFileSync(path.join(dir,transport))))===sha(bytes);}catch{}if(!matches)transport=name+'.transporte.gz';}
   const archive=path.join(dir,transport);if(!fs.existsSync(archive))fs.writeFileSync(archive,gzipSync(bytes),{flag:'wx'});assert.equal(sha(gunzipSync(fs.readFileSync(archive))),sha(bytes));
  }
  selected.add('docs/evidencias/'+transport);
  files.push({path:'docs/evidencias/'+name,transport:'docs/evidencias/'+transport,encoding,localRawBytes:bytes.length,localRawSha256:sha(bytes),transportBytes:fs.statSync(path.join(dir,transport)).size,transportSha256:sha(fs.readFileSync(path.join(dir,transport)))});
 }
 const manifest={appSource:'3e45a4ac6b479f89605163168e31b37dc84f2d0f',prepared:new Date().toISOString(),appEdited:false,files,gitPaths:[...selected,'docs/evidencias/316-manifiesto-entrega.json','ESTADO-ACTUAL.md','docs/YA-RESUELTO.md','docs/evidencias/253-recuento-unico-auditoria.md','docs/ordenes/220-gemini-barra-contraste-pantalla-listo.md','docs/ordenes/221-claude-factura-ausente-no-carga-infinita.md'],limits:'Closed reports only. Big rawJSON/logs transported losslessly with gzip; --restore reconstructs missing raw files. Text localRawSha256 is before Git newline normalization; remote Git tree/blob IDs are verified separately. Large browser trace/screenshot directories stay local; selected critical341PNG transported explicitly. No acceptance inferred from file presence.'};
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({files:files.length,gitPaths:manifest.gitPaths.length,transportBytes:[...selected].reduce((sum,file)=>sum+fs.statSync(path.join(root,file)).size,0)}));
}
