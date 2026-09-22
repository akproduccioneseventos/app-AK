const fs=require('node:fs'),path=require('node:path'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
const root=path.resolve(process.argv[2]);
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
const files=walk(path.join(root,'src')),pages=files.filter(p=>/[/\\]page\.(tsx|ts|jsx|js)$/.test(p));
function route(p){return '/'+path.relative(path.join(root,'src/app'),path.dirname(p)).replaceAll('\\','/').split('/').filter(s=>s&&!s.startsWith('(')&&!s.startsWith('@')).join('/');}
const routes=pages.map(route);
const patterns=routes.map(r=>new RegExp('^'+r.split('/').map(s=>s.startsWith('[[...')?'(?:.*)?':s.startsWith('[...')?'.+':s.startsWith('[')?'[^/]+':s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('/')+'/?$'));
const candidates=[],links=[];
for(const file of files.filter(p=>/\.(tsx|ts|jsx|js)$/.test(p)&&!/[\\/]__tests__[\\/]|\.test\./.test(p))){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 function value(n){if(!n)return null;if(ts.isStringLiteralLike(n))return n.text;if(ts.isJsxExpression(n))return value(n.expression);return null;}
 function visit(n){let url=null,kind=null;
  if(ts.isJsxAttribute(n)&&n.name.getText(source)==='href'){url=value(n.initializer);kind='href';}
  if(ts.isCallExpression(n)&&/^(?:router\.(?:push|replace)|redirect)$/.test(n.expression.getText(source))){url=value(n.arguments[0]);kind=n.expression.getText(source);}
  if(url?.startsWith('/')&&!url.startsWith('//')){const target=url.split(/[?#]/)[0]||'/';const entry={file:path.relative(root,file).replaceAll('\\','/'),line:source.getLineAndCharacterOfPosition(n.getStart(source)).line+1,kind,url};links.push(entry);if(!patterns.some(r=>r.test(target))&&!fs.existsSync(path.join(root,'public',target)))candidates.push(entry);}
  ts.forEachChild(n,visit);
 }visit(source);
}
console.log(JSON.stringify({scope:'Static literal links only; unresolved candidates require redirect/API/consumer verification. Not runtime coverage.',pages:pages.length,sourceFiles:files.length,literalLinks:links.length,candidates},null,2));

