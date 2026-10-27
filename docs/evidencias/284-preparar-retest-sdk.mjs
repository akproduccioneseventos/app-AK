import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),changes=[];
for(const [fromId,toId] of [['263','285'],['264','286']]){
 const probe=fromId==='263'?'aprobacion-sdk':'contrato-guardado-sdk';
 for(const suffix of [`${probe}.mjs`,'ejecutar.mjs']){
  const original=fs.readFileSync(path.join(dir,`${fromId}-${suffix}`),'utf8');let generated=original.replaceAll(fromId,toId).replaceAll('725e62ba2f909578628fad47402d125ed9632c70',source);
  if(fromId==='264'&&suffix===`${probe}.mjs`){
   const before="'@/lib/fiesta/actualizar-fiesta':updater";
   const after="'@/lib/fiesta/actualizar-fiesta':{actualizarFiesta:async(...args)=>{if(beforeWrite){const hook=beforeWrite;beforeWrite=null;await hook();}return updater.actualizarFiesta(...args);}}";
   assert(generated.includes(before),'New writer boundary must be wired explicitly');generated=generated.replace(before,after);
   changes.push({case:'286',adaptation:'The owner contract write now uses actualizarFiesta, not syncToFirestore. Invoke the SAME real client signature immediately before that real updater starts; the sign action itself uses the unwrapped real updater. No assertion replaced or relaxed.'});
  }
  const name=`${toId}-${suffix}`,target=path.join(dir,name);assert(!fs.existsSync(target),'Preserve generated script');fs.writeFileSync(target,generated);
  changes.push({from:`${fromId}-${suffix}`,to:name,fromSha256:hash(original),toSha256:hash(generated),source,assertionsChanged:false});
 }
}
const target=path.join(dir,'284-adaptaciones-sdk.json');assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify({source,changes,scope:'QA namespace/source and corrected persistence-boundary hook only. Not app edits, not results or acceptance.'},null,2)+'\n');console.log(JSON.stringify({source,generatedScripts:4,appEdited:false}));
