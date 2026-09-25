const fs=require('node:fs'),path=require('node:path');
const root=process.argv[2];
const text=fs.readFileSync(path.join(root,'docs/YA-RESUELTO.md'),'utf8');
const sections=text.split(/^## /m).filter(x=>/^(8|9|10|11|14|15|16|17|18|19|20|21) de septiembre de 2026/.test(x));
const rows=sections.map(section=>{
 const title=section.split('\n')[0].trim();
 const refs=[...section.matchAll(/^(archivo|prueba):\s*(.+)$/gm)].map(m=>({kind:m[1],path:m[2].trim().replace(/`/g,'' )}));
 return {title,references:refs.map(r=>({...r,exists:fs.existsSync(path.join(root,r.path))})),status:'Registro historico contrastado con existencia de artefactos; NO validacion funcional'};
});
console.log(JSON.stringify({sha:'834fc98e312d657f0486993138e10028bbe49308',scope:'Historical entries September 8-21; excludes new order81; existence is not execution',total:rows.length,missing:rows.flatMap(r=>r.references.filter(x=>!x.exists).map(x=>({title:r.title,...x}))),rows},null,2));

