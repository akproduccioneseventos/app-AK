const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'../.audit-runtime-62dcb2c/akproduccioneseventos-app-AK-62dcb2c');
const ts=require(require.resolve('typescript',{paths:[root]}));
const source=fs.readFileSync(path.join(root,'src/lib/budget/simulator-budget-pdf.ts'),'utf8');
const exportsObject={};
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(js,{exports:exportsObject,console,require:name=>require(require.resolve(name,{paths:[root]}))});
const input={documentId:'AUDITORIA-FICTICIA',publicUrl:'https://example.invalid/propuesta/auditoria',clientName:'Maria Fernanda Rodriguez y Juan Sebastian Fernandez',eventType:'Boda',eventDate:new Date('2028-02-15T15:00:00Z'),adults:100,childrenAndTeens:20,packageName:'Servicio completo de boda con tecnologia',items:Array.from({length:45},(_,i)=>({id:`ficticio-${i}`,nombre:`Servicio ficticio ${i+1}: ${i%3===0?'ambientacion de la recepcion, montaje y desmontaje con coordinacion del equipo':'detalle de servicio contratado para la celebracion'}`,categoria:i<15?'Catering':i<30?'Decoracion':'Entretenimiento',cantidad:1,precioUnitario:1000,costoTotal:i%9===0?0:1000,esRegalo:i%9===0})),stats:{subtotalBruto:45000,ahorroRegalos:5000,descPromo:0,totalFinal:40000,precioPorPersona:40000/120,discountPercentage:0,annualProjection:{applies:true,currentYear:2026,adjustmentPct:10,rows:[{year:2027,total:44000},{year:2028,total:48400}]}}};
(async()=>{const pdf=await exportsObject.createSimulatorBudgetPdf(input);fs.writeFileSync(path.join(__dirname,'budget-62dcb2c-audit.pdf'),Buffer.from(pdf.output('arraybuffer')));console.log(JSON.stringify({pages:pdf.getNumberOfPages(),path:path.join(__dirname,'budget-62dcb2c-audit.pdf'),logo:'not tested; Node has no window',source:'62dcb2c',fixtureOnly:true}));})();

