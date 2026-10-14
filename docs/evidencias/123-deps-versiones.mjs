import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const candidates=['@modelcontextprotocol/sdk','baseline-browser-mapping','browserslist','compression','fast-uri','ip-address','morgan','smol-toml'];
const result=[];
for(const spec of candidates){
  const data=JSON.parse(execFileSync(process.execPath,['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','view',spec,'version','engines','--json','--fetch-retries=0','--fetch-timeout=10000'],{encoding:'utf8',timeout:20000}));
  result.push({spec,metadata:data});console.log(JSON.stringify(result.at(-1)));
}
fs.writeFileSync('docs/evidencias/123-deps-versiones.json',JSON.stringify(result,null,2)+'\n');
