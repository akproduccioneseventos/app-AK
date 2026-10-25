import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const base=new URL('216-contraste-aprobaciones.mjs',import.meta.url);
const fragment=new URL('217-casos-concurrencia.mjs',import.meta.url);
const output=new URL('217-contraste-concurrencia.mjs',import.meta.url);
assert.equal(fs.existsSync(output),false,'Preserve generated probe');
const ast=ts.createSourceFile(base.pathname,fs.readFileSync(base,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const cases=ts.createSourceFile(fragment.pathname,fs.readFileSync(fragment,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS).statements.find(ts.isTryStatement);
assert.ok(cases);let replacements=0;
const result=ts.transform(ast,[context=>root=>{
  const synthetic=node=>{
    const clone=ts.factory.cloneNode(node);
    ts.setTextRange(clone,{pos:-1,end:-1});
    return ts.visitEachChild(clone,synthetic,context);
  };
  const visit=node=>{
    if(ts.isStringLiteral(node)&&node.text==='216-contraste-aprobaciones.json')return ts.factory.createStringLiteral('217-contraste-concurrencia.json');
    if(ts.isTryStatement(node)&&node.parent===ast){replacements++;return ts.factory.updateTryStatement(node,synthetic(cases.tryBlock),node.catchClause,node.finallyBlock);}
    return ts.visitEachChild(node,visit,context);
  };
  return ts.visitNode(root,visit);
}]);
assert.equal(replacements,1);const text=ts.createPrinter({newLine:ts.NewLineKind.LineFeed}).printFile(result.transformed[0]);result.dispose();
fs.writeFileSync(output,text);
