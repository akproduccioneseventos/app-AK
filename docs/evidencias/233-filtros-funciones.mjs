import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source='b91bdbeff7d3db7489fabdadd599776376c0577a';
const target=new URL('233-filtros-funciones.json',import.meta.url);assert.equal(fs.existsSync(target),false);
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
const hashes={},cases=[];
function read(file){const r=spawnSync('git',['show',`${source}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:2*1024**2});assert.equal(r.status,0,r.stderr);hashes[file]=crypto.createHash('sha256').update(r.stdout).digest('hex');return r.stdout;}
function load(file){const module={exports:{}};const code=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(id=>{assert.equal(id,'./segmentacion-fondo');return{recortarPersonaSinTela:()=>false};},module,module.exports);return module.exports;}
const filters=load('src/lib/entretenimiento/filtros-cara.ts'),frames=load('src/lib/entretenimiento/marcos-dinamicos.ts');
function canvas(width=1000,height=500){const events=[],base={canvas:{width,height},globalAlpha:1};const ctx=new Proxy(base,{get(obj,key){if(key in obj)return obj[key];if(key==='measureText')return text=>({width:String(text).length*8});if(String(key).startsWith('create'))return(...args)=>{events.push(['call',key,...args]);return{addColorStop:(...stops)=>events.push(['stop',...stops])};};return(...args)=>{events.push(['call',key,...args]);};},set(obj,key,value){events.push(['set',key,value]);obj[key]=value;return true;}});return{ctx,events};}
const points=[{x:0.5,y:0.2},{x:0.4,y:0.4},{x:0.6,y:0.4},{x:0.5,y:0.8}];
function render(cara,filter='mis15',width=1000,height=500){const spy=canvas(width,height);const applied=filters.dibujarFiltroDeCara(spy.ctx,{},filter,cara?[cara]:[],{nombreAgasajado:'QA',timestampMs:4000});return{...spy,applied};}
const translation=spy=>spy.events.find(e=>e[0]==='call'&&e[1]==='translate')?.slice(2);
const check=(id,pass,observed)=>cases.push({id,pass:Boolean(pass),observed});
let unexpected;
try{
  const empty=render(null);check('no-face-preserves-context',empty.applied===false&&empty.events.length===0,{applied:empty.applied,calls:empty.events.length});
  const normalized=render({puntos:points});check('normalized-face-draws-crown-and-name',normalized.applied&&normalized.events.some(e=>e[1]==='fillText'&&String(e[2]).includes('QA')),{center:translation(normalized),calls:normalized.events.length});
  const pixel=render({puntos:points.map(p=>({x:p.x*1000,y:p.y*500}))});check('pixel-and-normalized-reference-equivalent',JSON.stringify(translation(pixel))===JSON.stringify(translation(normalized)),{pixel:translation(pixel),normalized:translation(normalized)});
  const moved=render({puntos:points.map(p=>({...p,x:p.x+0.1}))});check('landmarks-move-overlay',translation(moved)[0]>translation(normalized)[0],{before:translation(normalized),after:translation(moved)});
  const doubled=render({puntos:points},'mis15',2000,1000);check('resolution-scales-overlay-center',translation(doubled)[0]===translation(normalized)[0]*2&&translation(doubled)[1]===translation(normalized)[1]*2,{normal:translation(normalized),double:translation(doubled)});
  const none=canvas();frames.dibujarMarcoDinamico(none.ctx,1000,500,{estilo:'ninguno'});check('disabled-frame-no-draw',none.events.length===0,{calls:none.events.length});
  const elegant=canvas();frames.dibujarMarcoDinamico(elegant.ctx,1000,500,{estilo:'elegante',nombreEvento:'QA EVENT'});check('enabled-frame-draws-name',elegant.events.some(e=>e[1]==='strokeRect')&&elegant.events.some(e=>e[1]==='fillText'&&String(e[2]).includes('QA EVENT')),{calls:elegant.events.length});
  check('swap-requires-exactly-two-faces',!filters.puedeHacerFaceSwap(1)&&filters.puedeHacerFaceSwap(2)&&!filters.puedeHacerFaceSwap(3),{});
  const jaw=[1000,1500,2000].map(t=>filters.evaluarEfectoReactivo({jawOpen:0.8},t).confetiBoca);check('jaw-cooldown-one-second',JSON.stringify(jaw)==='[true,false,true]',{jaw});
  const roulette=[3100,6100,9100].map(t=>filters.obtenerOpcionRuleta(t,'QA'));check('roulette-fixed-after-three-seconds',new Set(roulette).size===1,{times:[3100,6100,9100],results:roulette});
  const neutral=render({puntos:points,blendshapes:{}}),wink=render({puntos:points,blendshapes:{eyeBlinkLeft:0.8,eyeBlinkRight:0.1}});
  check('wink-affects-active-renderer',JSON.stringify(neutral.events)!==JSON.stringify(wink.events),{helper:filters.evaluarEfectoReactivo({eyeBlinkLeft:0.8,eyeBlinkRight:0.1},4000),sameCanvasEvents:JSON.stringify(neutral.events)===JSON.stringify(wink.events)});
  const brow=render({puntos:points,blendshapes:{browInnerUp:0.8}});check('raised-brows-affect-active-renderer',JSON.stringify(neutral.events)!==JSON.stringify(brow.events),{helper:filters.evaluarEfectoReactivo({browInnerUp:0.8},4000),sameCanvasEvents:JSON.stringify(neutral.events)===JSON.stringify(brow.events)});
}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}
const consumers=[];
for(const station of ['fotocabina','touchpix','bogue','espejo-magico']){
  const file=`src/app/evento/${station}/[fiestaId]/page.tsx`,raw=read(file),ast=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const visit=node=>{if(ts.isCallExpression(node)&&node.expression.getText(ast)==='dibujarFiltroDeCara')consumers.push({file,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,faceArgument:node.arguments[3]?.getText(ast),filter:node.arguments[2]?.getText(ast)});ts.forEachChild(node,visit);};visit(ast);
}
const receipt={source,checkedAt:new Date().toISOString(),hashes,cases,consumers,unexpected,summary:{total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length},appEdited:false,realServices:false,
  limits:'Real candidate filter/frame modules; synthetic landmarks and canvas method/property spy, not pixels, model inference, hardware, camera, recording or full capture. AST locates actual consumer arguments. Empty arrays correctly return false; this is a missing-input integration gap in three consumers, not a broken no-face safeguard. Requirements from191, not a new feature choice.'};
fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({source,summary:receipt.summary,unexpected,failures:cases.filter(c=>!c.pass),consumers}));if(receipt.summary.fail&&!unexpected)process.exitCode=1;
