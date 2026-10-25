import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
assert(!fs.existsSync(new URL('388-recordatorios-motor.json',import.meta.url)),'Preserve earlier evidence');
let code=fs.readFileSync(new URL('249-recordatorios-motor.mjs',import.meta.url),'utf8');
code=code.replace("const root=fileURLToPath(new URL('../../',import.meta.url));",'const root='+JSON.stringify(root)+';')
 .replaceAll('baa034fd25ab77b886e7096105a6114f0336bfdc','917a98e32c63fe2f832f5cdc16db87f4fc722b6c')
 .replaceAll('b91bdbeff7d3db7489fabdadd599776376c0577a','917a98e32c63fe2f832f5cdc16db87f4fc722b6c')
 .replaceAll('249','388');
code=code.replace('ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)',
 '(ts.isFunctionDeclaration(n)&&names.includes(n.name?.text))||(file==="src/lib/utils.ts"&&ts.isImportDeclaration(n)&&n.moduleSpecifier.text==="@/lib/reportes/rango-de-dias")');
code=code.replace("const utils=load('src/lib/utils.ts',{},['getUruguayParts','hoyEnUruguay']);",
 "const days=load('src/lib/reportes/rango-de-dias.ts');const utils=load('src/lib/utils.ts',{'@/lib/reportes/rango-de-dias':days},['getUruguayParts','hoyEnUruguay','parseUruguayDate','diasHastaEnUruguay']);");
code=code.replace('gmailFails,scheduleFails;', 'gmailFails,scheduleFails,gmailFailure;');
code=code.replace('scheduleFails=false;env.',"scheduleFails=false;gmailFailure={message:'QA388_GMAIL_HTTP403_REJECTED',status:403};env.");
code=code.replace("new Error('QA388_GMAIL_HTTP403_REJECTED'),{status:403}","new Error(gmailFailure.message),{status:gmailFailure.status}");
const before='}catch(error){unexpected=String(error.stack||error);process.exitCode=2;}';
assert(code.includes(before));
const variants=[
 "for(const trace of ['neutral','qa403']){",
 "reset();gmailFails=true;scheduleFails=true;gmailFailure={message:'HTTP 503 upstream unavailable; trace '+trace,status:503};",
 "const first=await engine.correrTareaRecordarInvitacionNoAbierta(now),second=await engine.correrTareaRecordarInvitacionNoAbierta(now);",
 "check('uncertain-503-not-retried-from-trace-'+trace,mails.length===1,{first,second,mails:mails.length,scheduledAttempts:scheduled.length,guest:party.invitados[0],providerFailure:gmailFailure});",
 "}"
].join('\n');
code=code.replace(before,variants+before);
code=code.replaceAll('import.meta.url',JSON.stringify(import.meta.url));
assert(code.includes('diasHastaEnUruguay')&&code.includes('uncertain-503'));
const child=spawnSync(process.execPath,['--max-old-space-size=384','--input-type=module'],{cwd:root,input:code,encoding:'utf8',timeout:120000,maxBuffer:4*1024**2});
fs.writeFileSync(new URL('388-recordatorios-ejecucion.log',import.meta.url),child.stdout+child.stderr);
console.log(JSON.stringify({exit:child.status,error:child.error?.message,stdout:child.stdout,stderr:child.stderr}));
process.exitCode=child.status??2;
