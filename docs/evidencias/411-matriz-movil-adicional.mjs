import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),source='917a98e32c63fe2f832f5cdc16db87f4fc722b6c';
const target=path.join(dir,'411-control.json');assert(!fs.existsSync(target));
const record={source,started:new Date().toISOString(),phase:'preparing',appEdited:false,scope:'Additional mobile variants of EXACT34 original desktop-only cases. Only the test project guards are removed from instrumented copies using AST. Original assertions, source files and other skips remain intact. Not a retrospective PASS for original34 skips.'};
const save=()=>fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');save();
try{
 const build=JSON.parse(fs.readFileSync(path.join(dir,'406-entorno.json'),'utf8'));assert.equal(build.phase,'built');assert.equal(build.source,source);
 const omitted=JSON.parse(fs.readFileSync(path.join(dir,'405-omisiones.json'),'utf8'));assert.equal(omitted.cases.length,34);
 const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const patterns=omitted.cases.map(c=>c.title.split(/\s+\u203a\s+/).map(escape).join('\\s+'));
 const config="import {defineConfig} from '@playwright/test';import base from './208-config';export default defineConfig({...base,projects:base.projects?.filter(p=>p.name==='chromium-mobile').map(p=>({...p,grep:new RegExp("+JSON.stringify(patterns.join('|'))+")}))});\n";
 fs.writeFileSync(path.join(dir,'411-config.ts'),config);
 const adapter=`import {createRequire as __require405} from 'node:module';
 const __ts405=__require405('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
 const __adaptations405=[];
 function __mobile405(file,original){
  const ts=__ts405,tree=ts.createSourceFile(file,original,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];
  const visit=node=>{if(ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(tree)==='test.skip'){
   const condition=node.expression.arguments[0];if(condition&&ts.isBinaryExpression(condition)&&condition.operatorToken.kind===ts.SyntaxKind.ExclamationEqualsEqualsToken&&condition.left.getText(tree).endsWith('.project.name')&&ts.isStringLiteral(condition.right)&&condition.right.text==='chromium-desktop')edits.push({start:node.getStart(tree),end:node.end,text:node.getText(tree)});
  }ts.forEachChild(node,visit);};visit(tree);assert(edits.length,'Expected desktop guard in '+file);
  let prepared=original;for(const e of edits.sort((a,b)=>b.start-a.start))prepared=prepared.slice(0,e.start)+prepared.slice(e.end);
  __adaptations405.push({file,originalSha256:crypto.createHash('sha256').update(original).digest('hex'),preparedSha256:crypto.createHash('sha256').update(prepared).digest('hex'),removedOnlyProjectGuards:edits});
  fs.writeFileSync(path.join(dir,'411-adaptaciones.json'),JSON.stringify({source,changes:__adaptations405,assertionsEdited:false},null,2)+'\\n');return prepared;
 }
 `;
 let code=gunzipSync(fs.readFileSync(path.join(dir,'374-driver.mjs.gz'))).toString('utf8')
  .replaceAll('3e45a4ac6b479f89605163168e31b37dc84f2d0f',source)
  .replaceAll('366-entorno.json','406-entorno.json').replaceAll('.qa-366-main-','.qa-392-candidate-')
  .replaceAll('374','412').replaceAll('373-config.ts','411-config.ts')
  .replace('expected:27','expected:34').replace('assert.equal(list.length,27','assert.equal(list.length,34')
  .replace('Only27 previously inconclusive project/case pairs','Only34 deliberate additional mobile variants');
 assert(code.includes("const raw=fs.readFileSync(file,'utf8');"));
 code=adapter+code.replace("const raw=fs.readFileSync(file,'utf8');","const originalRaw=fs.readFileSync(file,'utf8');const raw=__mobile405(file,originalRaw);")
  .replace('originalSha256:hash(raw)','originalSha256:hash(originalRaw),preparedSha256:hash(raw)');
 process.env.AK_AUDIT_SPEC_FILTER=[...new Set(omitted.cases.map(c=>path.basename(c.file)))].join(',');
 process.env.AK_AUDIT_SKIP_PORTAL='true';process.env.AK_AUDIT_BATCH_SIZE='1';
 fs.writeFileSync(path.join(dir,'412-driver.mjs.gz'),gzipSync(code));record.phase='running';save();
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));record.phase='finished';
}catch(error){record.phase='qa-setup-or-run-error';record.error=String(error.stack||error);process.exitCode=2;}
finally{record.finished=new Date().toISOString();save();console.log(JSON.stringify(record));}
