import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{fileURLToPath,pathToFileURL}from'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),target=path.join(dir,'606-supervisor-generado.mjs');assert(!fs.existsSync(target));
let text=fs.readFileSync(path.join(dir,'584-supervisor-aislado.mjs'),'utf8').replaceAll('584','606').replaceAll('583','603').replaceAll('585','605').replaceAll('583-medios-generado.mjs','603-preparar-pendientes.mjs');
// The template's runner file was renamed by numeric replacement; pin its actual entry point.
text=text.replaceAll('603-medios-generado.mjs','603-preparar-pendientes.mjs');
fs.writeFileSync(target,text);await import(pathToFileURL(target).href);
