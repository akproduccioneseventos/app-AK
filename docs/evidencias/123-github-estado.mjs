import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const token=execFileSync('gh',['auth','token'],{encoding:'utf8'}).trim();
function api(endpoint){return JSON.parse(execFileSync('curl.exe',['-4','--fail','--silent','--show-error','--retry','1','--connect-timeout','5','--max-time','20','--config','-',`https://api.github.com/repos/akproduccioneseventos/app-AK/${endpoint}`],{input:`header = "Authorization: Bearer ${token}"\nheader = "Accept: application/vnd.github+json"\n`,encoding:'utf8',maxBuffer:2000000}));}
const pr=api('pulls/1293'),main=api('git/ref/heads/main');
const result={capturedAt:new Date().toISOString(),pr:1293,state:pr.state,merged:pr.merged,head:pr.head.sha,headRef:pr.head.ref,base:pr.base.sha,main:main.object.sha,mergeOwner:'Claude',privateClaude:'NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE'};
fs.writeFileSync('docs/evidencias/123-github-estado.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
