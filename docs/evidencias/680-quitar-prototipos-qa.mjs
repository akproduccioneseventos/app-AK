import fs from'node:fs';import assert from'node:assert/strict';import{createRequire}from'node:module';import crypto from'node:crypto';
const dir=new URL('./',import.meta.url),req=createRequire(new URL('../../package.json',import.meta.url)),ts=req('typescript'),file=new URL('682-nativos-cierre.mjs',dir);
const original=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile('682.mjs',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),spans=[];
const visit=node=>{if(ts.isIfStatement(node)&&node.expression.getText(tree)==='prototype')spans.push([node.getStart(tree),node.end]);ts.forEachChild(node,visit);};visit(tree);assert.equal(spans.length,2);
let result=original;for(const[start,end]of spans.sort((a,b)=>b[0]-a[0]))result=result.slice(0,start)+result.slice(end);
assert(!result.includes("classList.add('dark')"));assert(!result.includes("setProperty('--primary'"));fs.writeFileSync(file,result);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');fs.writeFileSync(new URL('680-adaptacion-driver.json',dir),JSON.stringify({source:'d4c69f2b2395ad3abcaee4fb166bcefbdc1457e0',before:hash(original),after:hash(result),removed:spans.length,reason:'Delete dead diagnostic DOM-injection branches; final browser evidence uses production classes only',prototype:false},null,2)+'\n');
