import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const source='3e45a4ac6b479f89605163168e31b37dc84f2d0f';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST,'127.0.0.1:9195');
assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
let code=fs.readFileSync(path.join(dir,'209-ejecutar-bateria.mjs'),'utf8');
const changes=[
 ["const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');",`const root=${JSON.stringify(root)},dir=path.join(root,'docs/evidencias');`],
 ['fa3b492b8f1d6a77433a92f4d63b665cfea3747c',source],['206-entorno.json','291-entorno.json'],['ak-qa-206-','ak-qa-280-'],
 ["const runId=process.env.AK_AUDIT_RUN_ID||'209';","const runId='304';"],
 ["NODE_OPTIONS:`--max-old-space-size=1024", "AK_USE_LOCAL_JSON_ONLY:'false',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8085',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9195',STORAGE_EMULATOR_HOST:'http://127.0.0.1:9195',GCLOUD_PROJECT:'demo-ak-producciones',GOOGLE_CLOUD_PROJECT:'demo-ak-producciones',GOOGLE_APPLICATION_CREDENTIALS:'',\n  NODE_OPTIONS:`--max-old-space-size=768"],
 ["assert.ok(Object.values(h.services).every(v=>v===false));","assert.ok(Object.entries(h.services).every(([key,value])=>key==='firebase'||value===false));"],
 ["'--config','208-config.ts','--output'","'--config','208-config.ts','--grep','video de vida:|con el analisis de imagen caido','--output'"],
 ];
for(const[from,to]of changes){assert(code.includes(from),from);code=code.replaceAll(from,to);}
assert(code.includes("walkTests(path.join(qa,'tests/e2e'));"));
code=code.replace("walkTests(path.join(qa,'tests/e2e'));","walkTests(path.join(qa,'tests/e2e'));assert.equal(manifest.length,2);");
process.env.AK_AUDIT_SPEC_FILTER='video-vida-error-lectura.spec.ts,espejo-moderacion-caida-y-reintento.spec.ts';
process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='0';
fs.writeFileSync(path.join(dir,'304-driver-materializado.mjs.gz'),gzipSync(code));
fs.writeFileSync(path.join(dir,'304-adaptacion.json'),JSON.stringify({source,changes,scope:'Original SDK-only video reading recovery and public mirror moderation cases; grep excludes previously run JSON cases. Actual emulator SDK; no real provider/camera.',assertionsChanged:false},null,2)+'\n');
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
