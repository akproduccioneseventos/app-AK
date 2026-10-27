const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const qa = process.argv[2];
if (!qa || !path.basename(qa).startsWith('ak-qa-725-contabilidad-')) throw Error('QA aislado requerido');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const entries = [];
const rawDir = path.join(qa, 'recibos-raw');
fs.mkdirSync(rawDir, { recursive: true });
const names = [];
for (const prefix of ['725', '726', '727']) {
  for (const suffix of ['json', 'log']) names.push(`${prefix}-contabilidad-originales.${suffix}`);
}
for (const name of names) {
  const src = path.join(__dirname, name);
  const bytes = fs.readFileSync(src);
  const zipped = zlib.gzipSync(bytes, { level: 9 });
  if (!zlib.gunzipSync(zipped).equals(bytes)) throw Error('Archivo no recuperable');
  fs.writeFileSync(`${src}.gz`, zipped);
  fs.writeFileSync(path.join(rawDir, name), bytes);
  entries.push({ original: name, archivo: `${name}.gz`, bytes: bytes.length, sha256: sha(bytes), gzipSha256: sha(zipped) });
  fs.unlinkSync(src);
}
for (const [input, output] of [
  ['source-manifest.json', '725-fuente-manifiesto.json.gz'],
  ['snapshot-delta.json', '725-preparacion-delta.json.gz'],
  ['snapshot-verificado.json', '725-preparacion-antes-lf-final.json.gz'],
]) {
  const bytes = fs.readFileSync(path.join(qa, input));
  const zipped = zlib.gzipSync(bytes, { level: 9 });
  fs.writeFileSync(path.join(__dirname, output), zipped);
  entries.push({ original: input, archivo: output, bytes: bytes.length, sha256: sha(bytes), gzipSha256: sha(zipped) });
}
const runnerFiles = ['725-contabilidad-ejecutor.cjs', '725-sin-egreso.cjs', '726-contabilidad-nuevas-sondas.test.ts', '727-adaptar-solo-doble-de-lectura.cjs'];
const sourceHashes = runnerFiles.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(__dirname, file))) }));
fs.writeFileSync(path.join(__dirname, '728-recibos-manifiesto.json'), JSON.stringify({
  source: '0abe9199ddb7281a945fd0f000a1a89f25b8fa8e', entries, sourceHashes,
  limits: 'Compresion reversible; recibos iniciales conservados, no se suman adaptadas a canonicas.',
}, null, 2));
console.log(JSON.stringify({ archived: entries.length, rawCopy: rawDir }));
