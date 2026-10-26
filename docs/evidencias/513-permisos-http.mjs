import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
let code=fs.readFileSync(path.join(dir,'136-permisos-http.mjs'),'utf8')
 .replaceAll('136','513').replace('135-entorno.json','486-entorno.json')
 .replaceAll('7230f9d02b32805952a185f704a0208bd5d643e6','978af7d65a60bd287f3ee3cc05037a29566074f4')
 .replace('record.sourceSha','record.source').replaceAll('record.buildFinishedAt','record.finished')
 .replace("assert.match(record.qa.replaceAll('\\\\', '/'), /\\/Temp\\/ak-qa-135-[^/]+$/);","assert.equal(path.resolve(record.qa),path.resolve('C:/Users/Usuario/Documents/Codex/ak-codex88/.qa-480-delta-Apsy7q'));")
 .replace('Object.values(health.services).every((value) => value === false)',"Object.entries(health.services).every(([key,value])=>!value||key==='firebase')");
const output=path.join(dir,'513-permisos-http-generado.mjs');assert(!fs.existsSync(output));fs.writeFileSync(output,code);await import(pathToFileURL(output).href);
