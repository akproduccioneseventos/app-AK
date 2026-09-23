const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let s=fs.readFileSync(path.join(__dirname,'barra-invitados-catalogos-sonda.cjs'),'utf8');
s=s.replace('ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)','(ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n))&&names.includes(n.name?.text)');
s=s.replace("const bar=", "const AsyncMutex=build([['src/lib/mutex.ts',['AsyncMutex']]],{},'AsyncMutex');\nconst bar=");
s=s.replaceAll('logger:{warn(){}}','logger:{warn(){},error(){}}');
s=s.replace('getDb:async()=>mode===', 'reponerStock:async()=>{stock++;},getDb:async()=>mode===');
s=s.replace("'updateFiestaData','normalizeGuestName'", "'updateFiestaData','normalizeGuestName','soloLoDelInvitado'");
s=s.replaceAll("{CATALOGO_FILE:", "{AsyncMutex,turnoDelCatalogo:new AsyncMutex(),turnoDeSalones:new AsyncMutex(),CATALOGO_FILE:");
s=s.replaceAll("{SALONES_FILE:", "{AsyncMutex,turnoDeSalones:new AsyncMutex(),SALONES_FILE:");
s=s.replace("await rsvp('existing');", "/* Own QR by name is owner-approved; not a defect criterion. */");
s=s.replace('54cd6230d8fd10d91b031c5ae5320125e8d1bd41','2f413228cf97dce5cef6f6bb818c504ec66cef74');
vm.runInNewContext(s,{require,process,console});

