import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'344-excepciones-continuidad.json'),'utf8')).phase,'finished');
const build=JSON.parse(fs.readFileSync(path.join(dir,'291-entorno.json'),'utf8')),qaTest=path.join(build.qa,'src/__tests__/qa345-factura-ausente.test.tsx');assert(!fs.existsSync(qaTest));
let code=fs.readFileSync(path.join(dir,'314-jest-final-aislado.mjs'),'utf8').replace("const root=fileURLToPath(new URL('../../',import.meta.url)),dir=",`const root=${JSON.stringify(root)},dir=`).replaceAll('314','345');
const start=code.indexOf('const forced=spawnSync('),end=code.indexOf('const report=path.join');assert(start>0&&end>start);
const environment="const env={...safe,HOME:home,USERPROFILE:home,APPDATA:path.join(home,'config'),XDG_CONFIG_HOME:path.join(home,'config'),NODE_ENV:'test',GOOGLE_APPLICATION_CREDENTIALS:'',NODE_OPTIONS:`--max-old-space-size=1536 --require \"${path.join(dir,'323-egress-unit-canonico.cjs').replaceAll('\\\\','/')}\"`};\n";
code=code.slice(0,start)+environment+code.slice(end);
const args="'--maxWorkers=1','--workerIdleMemoryLimit=512MB'";assert(code.includes(args));code=code.replace(args,`'--runTestsByPath',${JSON.stringify(qaTest)},`+args);
code=code.replace('ONE full existing Jest suite on frozenQA3e after native jobs end; original assertions/mocks retained.','TWO focal QA cases on actual ViewInvoicePage: pending control versus resolved null. Official Jest config, controlled reads, NOT existing full suite or HTTP/SDK invoice. Failure criterion preserved.');
fs.writeFileSync(qaTest,fs.readFileSync(path.join(dir,'345-factura-ausente.test.tsx')),{flag:'wx'});
try{await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}
finally{fs.unlinkSync(qaTest);}
