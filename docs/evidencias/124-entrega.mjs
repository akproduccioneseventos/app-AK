import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const repo='akproduccioneseventos/app-AK';
const branch='codex/123-ia-controles-main-20261014';
const token=execFileSync('gh',['auth','token'],{encoding:'utf8'}).trim();
const mode=process.argv[2];
function request(endpoint,method='GET',body){
  const config=`header = "Authorization: Bearer ${token}"\nheader = "Accept: application/vnd.github+json"\n`+
    (body?`header = "Content-Type: application/json"\ndata-binary = ${JSON.stringify(JSON.stringify(body))}\n`:'');
  return JSON.parse(execFileSync('curl.exe',['-4','--fail','--silent','--show-error','--connect-timeout','5','--max-time','45',
    '--request',method,'--config','-',`https://api.github.com/${endpoint}`],{input:config,encoding:'utf8',maxBuffer:12000000}));
}
const api=(path,method,body)=>request(`repos/${repo}/${path}`,method,body);
let pr=api('pulls?state=open&per_page=100').find(p=>p.head.ref===branch);
if(mode==='create'){
  const remote=api(`git/ref/heads/${branch}`).object.sha;
  assert.equal(remote,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
  if(!pr)pr=api('pulls','POST',{title:'Correcciones123: IA, reintentos, controles y dependencias sobre main nuevo',
    head:branch,base:'main',draft:true,body:fs.readFileSync('docs/evidencias/124-pr-description.md','utf8')});
}else{
  assert(pr,'Expected open proposal on owned branch');
  if(mode==='update')pr=api(`pulls/${pr.number}`,'PATCH',{body:fs.readFileSync('docs/evidencias/124-pr-description.md','utf8')});
  else if(mode==='ready'){
    const result=request('graphql','POST',{query:'mutation($id:ID!){markPullRequestReadyForReview(input:{pullRequestId:$id}){pullRequest{id isDraft}}}',variables:{id:pr.node_id}});
    assert(!result.errors,JSON.stringify(result.errors));assert.equal(result.data.markPullRequestReadyForReview.pullRequest.isDraft,false);
    pr=api(`pulls/${pr.number}`);
  }else if(mode!=='verify')throw new Error('Unknown delivery mode');
}
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const result={checkedAt:new Date().toISOString(),number:pr.number,url:pr.html_url,state:pr.state,draft:pr.draft,
  localHead:head,remoteHead:pr.head.sha,branch,main:api('git/ref/heads/main').object.sha,mergeOwner:'Claude'};
if(mode==='verify'){
  assert.equal(pr.head.sha,head,'Remote proposal differs from local HEAD');
  const commit=api(`git/commits/${head}`),tree=api(`git/trees/${commit.tree.sha}?recursive=1`);
  assert(!tree.truncated,'Remote tree truncated');
  const paths=['AGENTS.md','ESTADO-ACTUAL.md','docs/YA-RESUELTO.md','docs/LO-QUE-NO-VI.md','docs/COMO-AUDITAR.md',
    'docs/ordenes/163-claude-dependencias-residuales-sin-force.md','package.json','package-lock.json',
    'src/lib/multiagent/assistant-crm-actions.ts','src/lib/multiagent/encargado.ts','src/lib/budget/intento-configurador.ts',
    'src/components/multiagent/multiagent-widget.tsx','src/components/assistant/contextual-assistant-indicator.tsx',
    'src/lib/assistant/posicion-segura.ts','src/__tests__/indicador-abre-asistente-real.test.tsx',
    'docs/evidencias/124-aceptacion.json','docs/evidencias/124-pr-description.md',
    'docs/evidencias/124-cobertura-recuento.json.gz','docs/evidencias/124-jest.json.gz',
    'docs/evidencias/124-chat-aceptacion-resultados.json','docs/evidencias/124-ia-final-resultados.json',
    'docs/evidencias/124-posicion-resultados.json'];
  if(tree.tree.some(f=>f.path==='docs/evidencias/124-entrega-remota.json'))paths.push('docs/evidencias/124-entrega-remota.json');
  result.blobs=paths.map(path=>{
    const local=execFileSync('git',['rev-parse',`HEAD:${path}`],{encoding:'utf8'}).trim();
    const remote=tree.tree.find(f=>f.path===path)?.sha;assert.equal(remote,local,path);
    return{path,sha:local,verified:true};
  });result.tree=commit.tree.sha;
  if(!process.argv.includes('--no-write'))fs.writeFileSync('docs/evidencias/124-entrega-remota.json',JSON.stringify(result,null,2)+'\n');
}
console.log(JSON.stringify({...result,blobs:result.blobs?.length}));
