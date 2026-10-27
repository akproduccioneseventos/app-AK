// Retest exact new Git source; preserve all original result files.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const old='b58abab75d94a732daf79b32aff54ec253ccf63c';
const target='c0add57f6237f666db97e7e902ef75f6c8d97479';
const scripts=['697-centro-control-sonda.cjs','698-reglas-y-web-sonda.cjs','699-consumidor-centro-sonda.cjs'];
for(const file of scripts){
  let code=fs.readFileSync(path.join(__dirname,file),'utf8');
  code=code.replaceAll(old,target).replace(/(['"])(69[789][^'"]+-resultados\.json)\1/g,(_,q,n)=>q+'701-'+n+q);
  const command=`new Function('__dirname','require',${JSON.stringify(code)})(${JSON.stringify(__dirname)},require)`;
  const r=cp.spawnSync(process.execPath,['-e',command],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8',timeout:30000});
  console.log(JSON.stringify({file,target,exit:r.status,error:r.error?.message}));
  if(r.stderr)console.error(r.stderr);
}
