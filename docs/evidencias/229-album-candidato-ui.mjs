import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const baseUrl=new URL('227-portal-candidato-version-nueva.mjs',import.meta.url);
const target=new URL('229-album-candidato-ui.json',import.meta.url);
assert.equal(fs.existsSync(target),false,'Preserve receipt');
const raw=fs.readFileSync(baseUrl,'utf8');
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const ast=ts.createSourceFile('base.mjs',raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const start=ast.statements.find(ts.isTryStatement);assert.ok(start);
let bootstrap=raw.slice(0,start.getStart(ast));
const old="'227-portal-candidato-version-nueva.json'";
assert.equal(bootstrap.split(old).length,2);bootstrap=bootstrap.replace(old,"'229-album-candidato-ui.json'").replaceAll('import.meta.url',JSON.stringify(import.meta.url));
const scenarios=String.raw`
try{
  fixture.fotografiaYFilmacion={notasGenerales:'Entrega ficticia229',servicios:[{id:'qa229-album',nombre:'Album oficial QA229',estado:'Entregado completo',linkEntrega:'https://qa.invalid/album-oficial-229'}]};
  reset();const element=await renderPage();
  check('AK-KNOWN-210-A8-official-delivery-link-survives-DTO-and-render',Boolean(document.querySelector('a[href="https://qa.invalid/album-oficial-229"]')),{sourceValue:store.fotografiaYFilmacion,DTO:element.props.fiesta.fotografiaYFilmacion,hrefs:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))});
}catch(error){observedErrors.push('QA_HARNESS_OR_UNEXPECTED_ERROR:'+String(error.stack||error));process.exitCode=2;}
finally{
  await unmount();dom.window.close();
  const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},observedErrors,appEdited:false,realServices:false,limits:'Actual candidate page, mapper and ReactDOM. Read/session adapters controlled; no native browser, SDK or actual photo provider. Same A8 already assigned212, NOT a new defect/order.'};
  fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,errors:observedErrors.filter(e=>e.startsWith('QA_HARNESS')),cases}));if(receipt.summary.fail&&!process.exitCode)process.exitCode=1;
}`;
const program=bootstrap+scenarios;
const result=spawnSync(process.execPath,['--max-old-space-size=256','--input-type=module'],{cwd:fileURLToPath(new URL('../../',import.meta.url)),input:program,encoding:'utf8',maxBuffer:4*1024**2,timeout:120000});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');assert.equal(result.error,undefined,String(result.error));assert.ok(fs.existsSync(target),'No receipt');
const receipt=JSON.parse(fs.readFileSync(target,'utf8'));receipt.generator={baseFile:baseUrl.pathname,baseSha256:crypto.createHash('sha256').update(raw).digest('hex'),programSha256:crypto.createHash('sha256').update(program).digest('hex'),childExit:result.status};fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');process.exitCode=result.status||0;
