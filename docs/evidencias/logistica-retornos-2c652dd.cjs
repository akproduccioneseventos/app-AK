// Adapt only historical fixture aliases to verified current source paths.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const name=process.argv[3];
const aliases=name==='logistica'?{'load.ts':'src/app/actions/fiesta/carga-operativa.actions.ts','assets.ts':'src/app/actions/activos-fijos.ts'}:{'helpers.ts':'src/lib/logistics/carga-operativa.ts','page.tsx':'src/app/(app)/fiestas/nueva/carga-operativa/page.tsx'};
let code=fs.readFileSync(path.join(__dirname,name+'-sonda.cjs'),'utf8');
for(const [from,to] of Object.entries(aliases))code=code.replaceAll("'"+from+"'","'"+to+"'");
vm.runInNewContext(code,{require,process,console});

