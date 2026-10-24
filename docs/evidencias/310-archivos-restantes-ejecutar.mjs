import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
let code=fs.readFileSync(new URL('./295-ejecutar-nativos-focales.mjs',import.meta.url),'utf8');
const run=JSON.parse(fs.readFileSync(new URL('./296-ejecucion.json',import.meta.url),'utf8'));
assert.equal(run.phase,'interrupted-resource-restart');assert.equal(run.batches.length,1);
const completed=new Set(run.batches.flatMap(b=>b.files).map(n=>n.replace(/^ak207-/,'')));
const candidates=JSON.parse(fs.readFileSync(new URL('./279-fallas-para-revision.json',import.meta.url),'utf8'));
const selected=[...new Set(candidates.cases.map(c=>c.file))].filter(file=>!completed.has(file));assert.equal(selected.length,26);
const changes=[
 ["const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source=",`const root=${JSON.stringify(root)},dir=path.join(root,'docs/evidencias'),source=`],
 ["const mode=process.argv[2]||'home';","const mode='failed-files';"],
 ["'failed-files':'296'","'failed-files':'310'"],
 ["else if(mode==='failed-files')selected=[...new Set(JSON.parse(fs.readFileSync(path.join(dir,'279-fallas-para-revision.json'),'utf8')).cases.map(c=>c.file))];",`else if(mode==='failed-files')selected=${JSON.stringify(selected)};`],
 ["mode==='failed-files'?'6':'0'","mode==='failed-files'?'1':'0'"],
];
for(const[from,to]of changes){assert(code.includes(from),from);code=code.replaceAll(from,to);}
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
