import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{fileURLToPath,pathToFileURL}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),dest=path.join(dir,'612-supervisor-generado.mjs');assert(!fs.existsSync(dest));
let text=fs.readFileSync(path.join(dir,'610-supervisor-generado.mjs'),'utf8').replaceAll('610','612').replaceAll('608-preparar-pendientes.mjs','608-recorridos-generados.mjs');
fs.writeFileSync(dest,text);await import(pathToFileURL(dest).href);
