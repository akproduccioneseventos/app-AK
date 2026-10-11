import fs from 'node:fs';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const files=['93-pendientes-anteriores.spec.ts','93-recordatorio-integrado.spec.ts'];
const results=files.map(file=>{
  const out=ts.transpileModule(fs.readFileSync('docs/evidencias/'+file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  const errors=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '));
  return {file,errors};
});
fs.writeFileSync('docs/evidencias/93-sintaxis.json',JSON.stringify({results,typecheckGlobal:false,build:false},null,2));
console.log(JSON.stringify(results));if(results.some(r=>r.errors.length))process.exitCode=1;
