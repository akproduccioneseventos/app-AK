import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));
const previous=JSON.parse(fs.readFileSync(path.join(dir,'448-ejecucion.json'),'utf8'));
assert(previous.finished&&previous.sourceDiff==='');assert(!previous.batches?.length,'446 had no native execution');
let code=fs.readFileSync(path.join(dir,'446-reensayar-geometria-y-barra.mjs'),'utf8').replaceAll('446','453').replaceAll('448','455');
code=code.replace("assert(os.freemem()>=1024**3,","assert(os.freemem()>=1.5*1024**3,");
code=code.replace("text=text.replace('test.setTimeout(300_000);','test.setTimeout(600_000);');","text=text.replace('test.setTimeout(300_000);','test.setTimeout(600_000); await page.setViewportSize({width:390,height:844});');");
const target=path.join(dir,'454-geometria-generada.mjs');assert(!fs.existsSync(target));fs.writeFileSync(target,code);await import(pathToFileURL(target).href);
