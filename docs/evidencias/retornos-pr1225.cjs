const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let code=fs.readFileSync(path.join(__dirname,'retornos-sonda.cjs'),'utf8');
const ref=path.relative(path.resolve(process.argv[2]),path.join(__dirname,'mezcla-pr1225.ts')).replaceAll('\\','/');
code=code.replaceAll("'helpers.ts'","'src/lib/logistics/carga-operativa.ts'").replaceAll("'page.tsx'",JSON.stringify(ref));
vm.runInNewContext(code,{require,process,console});

