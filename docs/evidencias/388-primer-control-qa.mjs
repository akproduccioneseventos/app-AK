import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const source='917a98e32c63fe2f832f5cdc16db87f4fc722b6c';
const output=new URL('388-recordatorios-motor.json',import.meta.url);
assert(!fs.existsSync(output),'Preserve earlier evidence');
let code=fs.readFileSync(new URL('350-retest-recordatorios-candidata.mjs',import.meta.url),'utf8');
code=code.replaceAll('3f9460185143ef034dcd713e975d2a0af5e20f1a',source)
 .replaceAll('350','388')
 .replaceAll('import.meta.url',JSON.stringify(import.meta.url));
const child=spawnSync(process.execPath,['--max-old-space-size=384','--input-type=module'],{
 input:code,encoding:'utf8',timeout:150000,maxBuffer:4*1024**2,
});
assert(fs.existsSync(output),child.stderr||child.stdout);
console.log(JSON.stringify({source,exit:child.status,stdout:child.stdout,stderr:child.stderr}));
process.exitCode=child.status??2;
