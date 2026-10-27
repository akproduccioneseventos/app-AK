const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../..'),sha='c0add57f6237f666db97e7e902ef75f6c8d97479',qa=process.argv[2];
if(!qa)throw new Error('Pass QA directory');
const files=['src/lib/barra-tecnologica.ts','src/app/actions/fiesta/barra-tecnologica.actions.ts','src/lib/auth/perfiles.ts','src/lib/auth/event-access.ts','src/lib/auth/session-token.ts','src/lib/fiesta-defaults.ts','src/types/fiesta.ts','src/types/barra-tecnologica.ts','src/app/evento/barra/[fiestaId]/page.tsx'];
const sources=files.map(file=>{const git=cp.execFileSync('git',['show',`${sha}:${file}`],{cwd:repo});const disk=fs.readFileSync(path.join(qa,file));return {file,gitSha256:crypto.createHash('sha256').update(git).digest('hex'),sameAfterCRLF:git.toString('utf8').replace(/\r\n/g,'\n')===disk.toString('utf8').replace(/\r\n/g,'\n')};});
const tests=['716-barra-jest-resultados.json','718-barra-perfiles-resultados.json','719-barra-sesion-firmada-resultados.json'].map(file=>{const r=JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));return {file,suites:r.numTotalTestSuites,passed:r.numPassedTests,failed:r.numFailedTests,pending:r.numPendingTests};});
const report={sha,qa,qaExportSource:'092906d666d73d3e895f8d3126e9f51bc18d72b1',sources,tests,scope:'Source identity with LF/CRLF normalization, not acceptance. Expected failures retained; session cryptography local, no production auth/database/provider or native browser.'};
fs.writeFileSync(path.join(__dirname,'720-barra-procedencia.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourcesEquivalent:sources.every(s=>s.sameAfterCRLF),tests}));process.exitCode=sources.every(s=>s.sameAfterCRLF)?0:1;
