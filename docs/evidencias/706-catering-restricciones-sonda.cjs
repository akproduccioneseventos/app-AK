// Exact classifier and report callback, synthetic guest rows only.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const ts=require(process.env.AK_QA_TYPESCRIPT||'C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/node_modules/typescript');
const sha='c0add57f6237f666db97e7e902ef75f6c8d97479',repo=path.resolve(__dirname,'../..'),sources={};
function source(file){return sources[file] ||= cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:repo,encoding:'utf8'});}
function evaluate(code,extra={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,...extra},{timeout:3000});return exports;}
const helper=evaluate(source('src/lib/catering/choques-alergias.ts'));
const page='src/app/(app)/fiestas/nueva/alergias/page.tsx',ast=ts.createSourceFile(page,source(page),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),nodes={};
const wanted=['DIET_CONFIG','PRIORITY_DIETS','allGuests','confirmedGuests','guestsWithRestrictions','contarPersonas','totalConfirmados','personasConRestricciones','dietCounts','copyCateringReport'];
function visit(n){if(ts.isVariableDeclaration(n)&&wanted.includes(n.name.getText(ast)))nodes[n.name.getText(ast)]=n.initializer;ts.forEachChild(n,visit);}
visit(ast);for(const n of wanted)if(!nodes[n])throw new Error(`missing ${n}`);
const reportCode=wanted.map(n=>`const ${n}=${nodes[n].getText(ast)};`).join('\n')+'\nexport const run=copyCateringReport;';
const row=(restriction,extra={})=>({id:'qa706',nombre:'QA Familia',rsvp:'Confirmado',partySize:5,dietaryRestriction:restriction,...extra});
const menu=tag=>({id:'qa-menu',name:'QA',items:[{id:'qa-item',name:'Plato QA',type:'Entrada',ingredients:[],allergenTags:[tag]}]});
const cases=[];
function check(id,expected,actual){cases.push({id,status:expected(actual)?'PASS':'FAIL',observed:actual});}
async function report(guest){
  let copied='';const icons=Object.fromEntries(['Utensils','Wheat','Leaf','Milk','Shell','TreePine','AlertTriangle'].map(k=>[k,k]));
  const module=evaluate(reportCode,{...icons,fiesta:{invitados:[guest],configuracion:{nombreEvento:'Evento QA706',fechaEvento:'2027-01-10'}},useMemo:fn=>fn(),navigator:{clipboard:{writeText:async text=>{copied=text;}}},toast(){}});
  await module.run();return copied;
}
(async()=>{
  check('explicit_mariscos',x=>x.some(c=>c.personasAfectadas===5),helper.detectarChoquesMenuYAlergias(menu('mariscos'),[row('Alergia Mariscos')]));
  check('frutos_secos_control',x=>x.some(c=>c.personasAfectadas===5),helper.detectarChoquesMenuYAlergias(menu('frutos_secos'),[row('Alergia Frutos Secos')]));
  check('celiac_flag_count_control',x=>x.some(c=>c.personasAfectadas===5),helper.detectarChoquesMenuYAlergias(menu('gluten'),[row(undefined,{isCeliac:true})]));
  check('unconfirmed_control',x=>x.length===0,helper.detectarChoquesMenuYAlergias(menu('gluten'),[row('Celiaco',{rsvp:'Pendiente'})]));
  check('legacy_celiac_report',x=>x.includes('QA Familia')&&x.includes('Con restricciones alimentarias: 5 personas'),await report(row(undefined,{isCeliac:true})));
  check('typed_celiac_report_control',x=>x.includes('QA Familia')&&x.includes('Con restricciones alimentarias: 5 personas'),await report(row('Celiaco',{isCeliac:true})));
  const result={sha,method:'Unmodified classifier and AST report expressions/callback; successful clipboard double. No browser, SDK, provider, real guests or clinical claims.',sources:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),cases};
  fs.writeFileSync(path.join(__dirname,'706-catering-restricciones-resultados.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=cases.some(c=>c.status==='FAIL')?1:0;
})();
