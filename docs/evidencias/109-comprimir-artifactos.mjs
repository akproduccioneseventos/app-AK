import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const names = ['109-inventario-cobertura','109-matriz-conciliada','109-seguridad-inventario','109-seguridad-contraste'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const artifacts = names.map(name => {
  const file = `docs/evidencias/${name}.json`;
  const raw = fs.existsSync(file) ? fs.readFileSync(file) : zlib.gunzipSync(fs.readFileSync(file+'.gz'));
  const archive = zlib.gzipSync(raw,{level:9});
  if (!zlib.gunzipSync(archive).equals(raw)) throw new Error('Compression changed evidence');
  fs.writeFileSync(file+'.gz',archive);
  return { file:file+'.gz',rawBytes:raw.length,archiveBytes:archive.length,rawSha256:hash(raw),archiveSha256:hash(archive) };
});
fs.writeFileSync('docs/evidencias/109-artifactos-comprimidos.json',JSON.stringify({ explanation:'Lossless raw artifacts; uncompressed local copies are not uploaded. Readers fall back to gzip.',artifacts },null,2)+'\n');
console.log(JSON.stringify(artifacts.map(item=>({file:item.file,bytes:item.archiveBytes}))));
