import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const baseUrl=new URL('227-portal-candidato-version-nueva.mjs',import.meta.url),target=new URL('357-portal-candidata.json',import.meta.url);
assert(!fs.existsSync(target),'Preserve receipt');
const raw=fs.readFileSync(baseUrl,'utf8'),ast=ts.createSourceFile('base.mjs',raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),start=ast.statements.find(ts.isTryStatement);
assert(start);
const qa=JSON.parse(fs.readFileSync(new URL('347-entorno.json',import.meta.url),'utf8'));assert.equal(qa.phase,'built');assert.equal(qa.source,'3f9460185143ef034dcd713e975d2a0af5e20f1a');
const repository=fileURLToPath(new URL('../../',import.meta.url));
const tree=spawnSync('git',['ls-tree','-r','--name-only',qa.source],{cwd:repository,encoding:'utf8'});assert.equal(tree.status,0,tree.stderr);
let bootstrap=raw.slice(0,start.getStart(ast)).replace("const root = fileURLToPath(new URL('../../', import.meta.url));",'const root='+JSON.stringify(repository)+';const sourceFiles=new Set('+JSON.stringify(tree.stdout.trim().split(/\r?\n/))+');')
 .replaceAll('b91bdbeff7d3db7489fabdadd599776376c0577a',qa.source)
 .replace("'227-portal-candidato-version-nueva.json'","'357-portal-candidata.json'")
 .replace("'HTMLInputElement','MutationObserver'","'HTMLInputElement','HTMLButtonElement','HTMLTextAreaElement','DocumentFragment','ShadowRoot','MutationObserver'")
 .replace("fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile()","sourceFiles.has(candidate)")
 .replaceAll('import.meta.url',JSON.stringify(import.meta.url));
const scenarios=[
 "try {",
 " fixture.fotografiaYFilmacion={notasGenerales:'QA352 ficticio',servicios:[{id:'qa352-entregado',nombre:'Album oficial QA352',estado:'Entregado completo',linkEntrega:'https://qa.invalid/album352'},{id:'qa352-borrador',nombre:'Edicion QA352',estado:'En edición',linkEntrega:'https://qa.invalid/borrador352'}]};",
 " fixture.clientPortalSettings.accessPhase='organizacion';reset();const element=await renderPage();",
 " const organization=document.querySelector('#portal-organizacion button');assert(organization,'QA organization trigger');if(organization.getAttribute('data-state')!=='open')await click(organization);",
 " check('212-album-entregado-en-DTO-y-DOM',Boolean(document.querySelector('a[href=\"https://qa.invalid/album352\"]')),{DTO:element.props.fiesta.fotografiaYFilmacion});",
 " check('212-borrador-sin-enlace-publico',!document.querySelector('a[href=\"https://qa.invalid/borrador352\"]'),{hrefs:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))});",
 " const trigger=document.querySelector('#portal-contable button');if(trigger&&trigger.getAttribute('data-state')!=='open')await click(trigger);",
 " await click(button('Informar pago'));",
 " const dialog=document.querySelector('[role=\"dialog\"]');check('212-informar-pago-abre-formulario-real',Boolean(dialog&&dialog.querySelector('#modal-payment-amount')&&dialog.querySelector('input[type=\"file\"]')),{dialogText:dialog?.textContent,fields:[...document.querySelectorAll('input')].map(x=>({id:x.id,type:x.type}))});",
 " if(dialog){const close=[...dialog.querySelectorAll('button')].find(x=>x.textContent.trim()==='Cerrar');await click(close);}",
 " check('212-cerrar-sin-enviar-no-guarda-ni-sube',!document.querySelector('[role=\"dialog\"]')&&writeCalls===0&&uploadCalls===0,{writeCalls,uploadCalls,dialog:Boolean(document.querySelector('[role=\"dialog\"]'))});",
 "}catch(error){observedErrors.push('QA_HARNESS_OR_UNEXPECTED_ERROR:'+String(error.stack||error));process.exitCode=2;}",
 "finally{await unmount();dom.window.close();const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,summary:{total:cases.length,pass:cases.filter(x=>x.pass).length,fail:cases.filter(x=>!x.pass).length},observedErrors,appEdited:false,realServices:false,scope:'Actual candidate public page DTO plus actual ReactDOM/Radix modal click/close. Controlled read/session/storage adapters; NO native browser, HTTP, SDK, upload or payment.'};fs.writeFileSync(target,JSON.stringify(receipt,null,2)+String.fromCharCode(10));console.log(JSON.stringify({source,summary:receipt.summary,errors:observedErrors.filter(x=>x.startsWith('QA_HARNESS')),cases}));if(receipt.summary.fail&&!process.exitCode)process.exitCode=1;}"
].join('\n');
const program=bootstrap+scenarios,result=spawnSync(process.execPath,['--max-old-space-size=384','--input-type=module'],{cwd:repository,input:program,encoding:'utf8',timeout:120000,maxBuffer:4*1024**2});
fs.writeFileSync(new URL('357-portal-ejecucion.log',import.meta.url),(result.stdout||'')+(result.stderr||''));
console.log(JSON.stringify({exit:result.status,error:result.error?.message,stdout:result.stdout,stderr:result.stderr}));
if(fs.existsSync(target)){const receipt=JSON.parse(fs.readFileSync(target,'utf8'));receipt.generator={baseSha256:crypto.createHash('sha256').update(raw).digest('hex'),programSha256:crypto.createHash('sha256').update(program).digest('hex'),exit:result.status};fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');}
process.exitCode=result.status??2;
