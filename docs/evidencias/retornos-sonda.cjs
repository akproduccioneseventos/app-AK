const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require(process.env.AUDIT_TYPESCRIPT||'typescript');
function get(file,name){const source=ts.createSourceFile(file,fs.readFileSync(path.join(process.argv[2],file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const node=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);if(!node)throw Error(name);return vm.runInNewContext(ts.transpileModule(node.getText(source).replace(/^export\s+/,'')+'\n'+name,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,{});}
const patch=get('helpers.ts','applyCargaOperativaItemPatch'),merge=get('page.tsx','mergeRemoteOperationalState'),structure=get('helpers.ts','mergeCargaOperativaStructure');
const base={categorias:[{id:'c',nombre:'Audio',items:[{id:'a',nombre:'A',cantidad:'2',cargado:false,retornado:false},{id:'b',nombre:'B',cantidad:'2',cargado:false,retornado:false}]}]};
const item=x=>x.categorias[0].items[0], results=[];
const returned=patch(base,'c','a',{retornado:true},'Ana','2026-09-18T12:00:00Z');
results.push({case:'return-recorded',passed:item(returned).retornado&&item(returned).cargado&&item(returned).retornadoPor==='Ana'});
const saved=structure(base,returned);results.push({case:'save-structure-preserves-return',passed:item(saved).retornado});
const quantity=patch(base,'c','a',{cantidad:'8'},'Ana','2026-09-18T12:00:00Z'), synced=merge(base,quantity);
results.push({case:'remote-quantity-sync',expected:'8',actual:item(synced).cantidad,passed:item(synced).cantidad==='8'});
const older=patch(base,'c','a',{cargado:true},'Ana','2026-09-18T12:00:00Z');
const newer=patch(older,'c','b',{cargado:true},'Ana','2026-09-18T12:00:01Z');
const reversed=merge(merge(base,newer),older);
results.push({case:'reversed-responses-preserve-newer',actual:reversed.categorias[0].items.map(i=>i.cargado),passed:reversed.categorias[0].items.every(i=>i.cargado)});
console.log(JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.passed)?0:1;

