import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const prior=JSON.parse(fs.readFileSync(path.join(dir,'500-continuidad.json'),'utf8'));assert(prior.finished&&prior.nativeExit===1);
let code=fs.readFileSync(path.join(dir,'501-recorridos-sdk.mjs'),'utf8').replaceAll('501','509').replaceAll('504','512');
const marker="const physical=path.join(dir,'512-driver.mjs');";assert(code.includes(marker));
code=code.replace(marker,"code=code.replace(\"AK_USE_LOCAL_JSON_ONLY:'false'\",\"GCLOUD_PROJECT:'demo-ak-producciones',GOOGLE_CLOUD_PROJECT:'demo-ak-producciones',AK_USE_LOCAL_JSON_ONLY:'false'\");\n"+marker);
const child=path.join(dir,'509-recorridos-sdk.mjs'),parent=path.join(dir,'510-sdk-emuladores.mjs');assert(!fs.existsSync(child)&&!fs.existsSync(parent));
fs.writeFileSync(child,code);fs.writeFileSync(parent,fs.readFileSync(path.join(dir,'502-sdk-emuladores.mjs'),'utf8').replaceAll('502','510').replaceAll('501','509'));
await import(pathToFileURL(parent).href);
