const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),crypto=require('node:crypto');
const ts=require(process.env.AK_QA_TYPESCRIPT||'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');
const sha='c0add57f6237f666db97e7e902ef75f6c8d97479',repo=path.resolve(__dirname,'../..'),sources={};
function source(file){return sources[file] ||= cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:repo,encoding:'utf8'});}
function evaluate(code,scope={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,...scope},{timeout:3000});return exports;}
function initializer(file,name){const ast=ts.createSourceFile(file,source(file),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found;function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)===name)found=n.initializer;ts.forEachChild(n,walk);}walk(ast);if(!found)throw new Error(`missing ${name}`);return found.getText(ast);}
const helpers=evaluate(source('src/lib/barra-tecnologica.ts'));
const drinks=evaluate('export const value='+initializer('src/lib/fiesta-defaults.ts','defaultCartaTragosData')+';').value.items;
const selection=initializer('src/app/evento/barra/[fiestaId]/page.tsx','visibleDrinks');
function select(category,items=drinks){return evaluate('export const value='+selection+';',{drinks:items,activeCategory:category,getDrinkTags:helpers.getDrinkTags}).value;}
const caipi=drinks.find(d=>d.id==='caipirinha'),daiquiri=drinks.find(d=>d.id==='daiquiri-durazno');
if(!caipi||!daiquiri)throw new Error('missing real menu fixtures');
const filtered=select('Con alcohol');
const mocktail={id:'qa-sin-alcohol',nombre:'Mocktail sin alcohol',ingredientes:['Jugo de naranja','Agua']};
const cases=[
  {id:'real_caipirinha_in_alcohol_filter',status:filtered.some(d=>d.id===caipi.id)?'PASS':'FAIL',expected:caipi.id,observed:filtered.map(d=>d.id),drink:caipi,tags:helpers.getDrinkTags(caipi)},
  {id:'real_ron_control',status:filtered.some(d=>d.id===daiquiri.id)?'PASS':'FAIL'},
  {id:'nonalcohol_control',status:select('Sin alcohol',[mocktail]).length===1&&!select('Con alcohol',[mocktail]).length?'PASS':'FAIL'},
  {id:'all_retains_menu',status:select('Todos').length===drinks.length?'PASS':'FAIL'},
  {id:'no_category_match',status:select('Categoria inexistente').length===0?'PASS':'FAIL'},
];
const report={sha,method:'Complete real helper and actual visibleDrinks AST expression with default menu from Git. No rendered UI, age enforcement, model, accounts or database.',cases,sources:Object.fromEntries(Object.entries(sources).map(([file,text])=>[file,crypto.createHash('sha256').update(text).digest('hex')]))};
fs.writeFileSync(path.join(__dirname,'717-barra-filtro-carta-resultados.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sha,cases},null,2));process.exitCode=cases.some(c=>c.status==='FAIL')?1:0;
