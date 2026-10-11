import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const repo='akproduccioneseventos/app-AK';
const main=execFileSync('gh',['api',`repos/${repo}/commits/main`,'--jq','.sha'],{encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(main))throw new Error('Main SHA invalid');
git('cat-file','-e',main+'^{commit}');
const health=await fetch('https://akproducciones.uy/api/health',{signal:AbortSignal.timeout(20000)});
if(health.status!==200)throw new Error('Health HTTP'+health.status);
const body=await health.json(),match=/^([a-f0-9]{40})(?:\s|$)/.exec(body.version||'');
if(!match)throw new Error('No full reported deployment SHA');
const publishedClaim=match[1];git('cat-file','-e',publishedClaim+'^{commit}');
const changed=git('diff','--name-only',publishedClaim,main,'--','src/app','src/lib','src/components','src/ai','next.config.js').split('\n').filter(Boolean);
const areas=JSON.parse(fs.readFileSync('docs/codex/areas.json','utf8')).areas;
const response=await fetch('https://akproducciones.uy/api/asistente/voz-en-vivo',{
  method:'GET',redirect:'manual',signal:AbortSignal.timeout(20000)});
const deployments=JSON.parse(execFileSync('gh',['api',`repos/${repo}/deployments?per_page=5`],{encoding:'utf8'}));
const result={checkedAt:new Date().toISOString(),main,health:{status:health.status,body},publishedClaim,
  sameClaim:main===publishedClaim,changedProductPaths:changed,
  commitsSinceClaim:git('log','--format=%h %s',publishedClaim+'..'+main).split('\n').filter(Boolean),
  areas:areas.map(({id,nombre,estado})=>({id,nombre,estado})),
  unauthenticatedVoiceGET:{status:response.status,location:response.headers.get('location'),
    meaning:'307 login neither proves existence nor absence of the new route; no POST or voice token requested.'},
  githubDeployments:deployments.map(({id,sha,environment,created_at})=>({id,sha,environment,created_at})),
  limitations:['Health reports build metadata, not an independent Hosting revision; cross-check build source/log.',
    'Empty GitHub deployment list does not mean Firebase was not deployed.',
    'No credentials, production data or provider sends/charges accessed. No GitHub billing checks inspected.',
    'Areas are not automatically marked clean from partial accepted journeys.']};
fs.writeFileSync('docs/evidencias/95-publicacion.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({main,publishedClaim,sameClaim:result.sameClaim,changedProductPaths:changed.length,
  areasClean:areas.filter(a=>a.estado==='limpia').length,voiceGET:response.status,githubDeployments:deployments.length},null,2));
