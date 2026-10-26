import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='978af7d65a60bd287f3ee3cc05037a29566074f4';
let base=fs.readFileSync(path.join(dir,'424-recorridos-sdk.mjs'),'utf8')
 .replaceAll('917a98e32c63fe2f832f5cdc16db87f4fc722b6c',source).replaceAll('427-entorno.json','486-entorno.json').replaceAll('.qa-427-source-','.qa-480-delta-');
const marker='process.env.AK_AUDIT_SPEC_FILTER=';assert(base.includes(marker));
base=base.replace(marker,"code=code.replace(\"AK_USE_LOCAL_JSON_ONLY:'false'\",\"GCLOUD_PROJECT:'demo-ak-producciones',GOOGLE_CLOUD_PROJECT:'demo-ak-producciones',AK_USE_LOCAL_JSON_ONLY:'false'\");\n"+marker);
const baseFile=path.join(dir,'522-base-sdk-generada.mjs');assert(!fs.existsSync(baseFile));fs.writeFileSync(baseFile,base);
let prep=fs.readFileSync(path.join(dir,'470-preparacion-generada.mjs'),'utf8')
 .replaceAll('470','523').replaceAll('472','525').replaceAll('471','524')
 .replace('424-recorridos-sdk.mjs','522-base-sdk-generada.mjs')
 .replaceAll('917a98e32c63fe2f832f5cdc16db87f4fc722b6c',source);
const parentMarker="fs.writeFileSync(parent,fs.readFileSync(path.join(dir,'430-emuladores-generado.mjs'),'utf8')";
assert(prep.includes(parentMarker));
prep=prep.replace(parentMarker,parentMarker+".replaceAll('917a98e32c63fe2f832f5cdc16db87f4fc722b6c','"+source+"')");
const file=path.join(dir,'523-preparacion-generada.mjs');assert(!fs.existsSync(file));fs.writeFileSync(file,prep);await import(pathToFileURL(file).href);
