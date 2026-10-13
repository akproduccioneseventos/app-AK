import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

const sourceApp = '8fa5b56a2833938541a657dcd15ef88130d24b0e';
const readJson = file => JSON.parse(fs.existsSync(file) ? fs.readFileSync(file,'utf8')
  : zlib.gunzipSync(fs.readFileSync(file+'.gz')).toString('utf8'));
const triage = readJson('docs/evidencias/109-seguridad-contraste.json');
const inventory = readJson('docs/evidencias/109-inventario-cobertura.json');
const files = ['109-permisos-documentos.json','109-permisos-documentos-extra.json'];
const documents = files.map(file=>JSON.parse(fs.readFileSync('docs/evidencias/'+file,'utf8')));
const rows = documents.flatMap(doc=>doc.results);
const get = (profile) => rows.filter(row=>row.profile===profile && row.target);
assert.equal(triage.advisories.length,27);
assert.equal(triage.metadataCount,27);
assert.equal(inventory.counts.total,421);
assert.ok(documents.every(doc=>doc.sourceApp===sourceApp && doc.fixtureCleanup));
assert.equal(get('dueno').length,5);
assert.ok(get('dueno').every(row=>row.status===200 && row.identicalFixture));
assert.equal(get('anonimo').length,5);
assert.ok(get('anonimo').every(row=>row.status===401 && !row.identicalFixture));
const unauthorized = ['operador','personal','cliente','invitado'].flatMap(get);
assert.equal(unauthorized.length,20);
assert.ok(unauthorized.every(row=>row.status===200 && row.identicalFixture));
const deniedControls = rows.filter(row=>row.case==='role-denial-positive-control');
assert.equal(deniedControls.length,5);
assert.ok(deniedControls.every(row=>row.deniedByProfile));
const clicks = rows.filter(row=>row.case==='operator-backup-real-click');
assert.equal(clicks.length,2);
assert.ok(clicks.every(row=>row.noBackupDelivered));
const image = rows.find(row=>row.case==='public-image-optimizer');
assert.ok(image.status===200 && image.contentType==='image/png' && image.bytes>100);
const changed = execFileSync('git',['diff','--name-only',sourceApp,'HEAD','--','src','package.json','package-lock.json','next.config.js'],{encoding:'utf8'}).trim();
assert.equal(changed,'');
const compressed = readJson('docs/evidencias/109-artifactos-comprimidos.json');
for (const artifact of compressed.artifacts) {
  const archive = fs.readFileSync(artifact.file);
  assert.equal(crypto.createHash('sha256').update(archive).digest('hex'), artifact.archiveSha256);
  assert.equal(crypto.createHash('sha256').update(zlib.gunzipSync(archive)).digest('hex'), artifact.rawSha256);
}
const rawNames = new Set(compressed.artifacts.map(artifact=>artifact.file.split('/').pop().replace(/\.gz$/, '')));
const artifactFiles = fs.readdirSync('docs/evidencias').filter(file=>/^109-.*\.(json|png|gz)$/.test(file)
  && file!=='109-resultado.json' && !rawNames.has(file));
const result = {sourceApp,sourceHead:inventory.sourceHead,
  evaluatedAdvisories:27,inventoryRoutes:421,
  criteria:{documentProfileProtection:'FAIL',runtimeImageDependencies:'PATCH_REQUIRED',fullFunctionalCoverage:'NOT_COMPLETE',
    ownerFileControls:5,anonymousDenials:5,restrictedProfileBackupControls:5,realBackupClickDenials:2},
  unjustifiedDocumentReads:unauthorized.length,
  interpretation:'Exit0 verifies evidence collection and the observed failures, NOT application acceptance.',
  hashes:Object.fromEntries(artifactFiles.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync('docs/evidencias/'+file)).digest('hex')]))};
fs.writeFileSync('docs/evidencias/109-resultado.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,hashes:undefined}));
