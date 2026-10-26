import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url));const end=Date.now()+55*60*1000;
while(true){const r=JSON.parse(fs.readFileSync(path.join(dir,'461-continuidad.json'),'utf8'));if(r.finished)break;if(Date.now()>end)throw Error('Previous SDK run still active; independent browser not launched');await new Promise(ok=>setTimeout(ok,15000));}
await import(pathToFileURL(path.join(dir,'465-control-codecs-local.mjs')).href);
