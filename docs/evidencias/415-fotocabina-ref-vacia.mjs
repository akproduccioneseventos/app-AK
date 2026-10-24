import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source='917a98e32c63fe2f832f5cdc16db87f4fc722b6c';
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const git=file=>{const r=spawnSync('git',['show',source+':'+file],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;};
const page='src/app/evento/fotocabina/[fiestaId]/page.tsx',text=git(page),tree=ts.createSourceFile(page,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const occurrences=[],writes=[];let emptyInitialization=false,actualCall=false;
const visit=node=>{
 if(ts.isIdentifier(node)&&node.text==='carasDetectadasRef'){
  occurrences.push({text:node.parent.getText(tree),line:tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1});
  const p=node.parent;
  if(ts.isVariableDeclaration(p)&&p.initializer&&ts.isCallExpression(p.initializer)&&p.initializer.expression.getText(tree)==='useRef')emptyInitialization=ts.isArrayLiteralExpression(p.initializer.arguments[0])&&p.initializer.arguments[0].elements.length===0;
  if(ts.isPropertyAccessExpression(p)&&p.name.text==='current'){
   if(ts.isBinaryExpression(p.parent)&&p.parent.left===p&&p.parent.operatorToken.kind===ts.SyntaxKind.EqualsToken)writes.push(p.parent.getText(tree));
   if(ts.isCallExpression(p.parent)&&p.parent.expression.getText(tree)==='dibujarFiltroDeCara'&&p.parent.arguments[3]===p)actualCall=true;
  }
 }ts.forEachChild(node,visit);
};visit(tree);
assert(emptyInitialization&&actualCall,'Source consumer changed; do not keep old conclusion');assert.equal(occurrences.length,2,'Unexpected alias/write: review again');
const helperFile='src/lib/entretenimiento/filtros-cara.ts',helper=git(helperFile),ast=ts.createSourceFile(helperFile,helper,ts.ScriptTarget.Latest,true);
const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='dibujarFiltroDeCara');assert(fn);
const compiled=ts.transpileModule(fn.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};vm.runInNewContext(compiled,{module:{exports},exports});
const calls=[];const context=new Proxy({canvas:{width:640,height:480}},{get:(obj,key)=>key in obj?obj[key]:(...args)=>calls.push({key:String(key),args})});
const returned=exports.dibujarFiltroDeCara(context,{videoWidth:640,videoHeight:480},'mis15',[],{});
const cases=[
 {id:'real-consumer-passes-ref-current-initialized-empty',pass:emptyInitialization&&actualCall&&occurrences.length===2},
 {id:'real-helper-correctly-preserves-canvas-on-empty-faces',pass:returned===false&&calls.length===0,returned,drawCalls:calls.length},
 {id:'consumer-populates-face-reference-before-drawing',pass:writes.length>0,observedWrites:writes.length},
];
const result={source,at:new Date().toISOString(),file:page,helperFile,occurrences,writes,cases,summary:{total:3,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},classification:'SAME_ORDER214_EMPTY_FACE_INPUT_CAUSE_EXPANDED_TO_FOTOCABINA_NOT_NEW_FOURTH_FILTER_CAUSE',scope:'Actual TypeScript dataflow plus executed REAL drawing function empty-face guard. No native model/camera/face quality or real person tested. The helper should not draw without faces; the consumer must populate its ref. No app edit.'};
const target=path.join(dir,'415-fotocabina-ref-vacia.json');assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));process.exitCode=result.summary.fail?1:0;
