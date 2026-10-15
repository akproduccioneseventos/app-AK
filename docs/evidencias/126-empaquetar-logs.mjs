import fs from 'node:fs';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';

const hashes=[];
for(const name of ['emulator','probe','start','outbound-blocked']) {
  const file=`docs/evidencias/126-${name}.log`;
  if(!fs.existsSync(file))continue;
  const bytes=fs.readFileSync(file), target=file+'.gz';
  if(fs.existsSync(target))throw Error(`Refusing to replace ${target}`);
  fs.writeFileSync(target,gzipSync(bytes));
  hashes.push({file,archivedAs:target,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
  fs.unlinkSync(file);
}
fs.writeFileSync('docs/evidencias/126-logs-archivados.json',JSON.stringify({byteExactArchives:true,hashes},null,2)+'\n');
console.log(JSON.stringify({archived:hashes.length,rawBytesPreserved:true}));
