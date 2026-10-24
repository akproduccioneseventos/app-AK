import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
let code=fs.readFileSync(new URL('233-filtros-funciones.mjs',import.meta.url),'utf8')
 .replaceAll('b91bdbeff7d3db7489fabdadd599776376c0577a','3f9460185143ef034dcd713e975d2a0af5e20f1a')
 .replaceAll('233','356').replaceAll('import.meta.url',JSON.stringify(import.meta.url));
const child=spawnSync(process.execPath,['--max-old-space-size=256','--input-type=module'],{cwd:fileURLToPath(new URL('../../',import.meta.url)),input:code,encoding:'utf8',timeout:60000,maxBuffer:4*1024**2});
fs.writeFileSync(new URL('356-filtros-ejecucion.log',import.meta.url),(child.stdout||'')+(child.stderr||''));
console.log(child.stdout||child.stderr);process.exitCode=child.status??2;
