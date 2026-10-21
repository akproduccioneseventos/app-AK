import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias');
const base='9b7ee982c5d6ff1377fccc0490abc85a9cfd8419';
const target=path.join(dir,'170-validacion.json');assert.equal(fs.existsSync(target),false,'Preserve receipt');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const git=args=>{const p=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(p.status,0,p.stderr||p.stdout);return p.stdout.trim();};
assert.equal(git(['diff','--name-only',base,'--','src','scripts','package.json','package-lock.json']),'');
assert.equal(git(['diff','--check',base]),'');
let contexts=0;
for(const folder of fs.readdirSync(path.join(dir,'166-native-artifacts'),{withFileTypes:true}))if(folder.isDirectory()){
  const file=path.join(dir,'166-native-artifacts',folder.name,'error-context.md');if(!fs.existsSync(file))continue;
  const raw=gunzipSync(fs.readFileSync(file+'.gz')).toString('utf8');
  assert.equal(fs.readFileSync(file,'utf8'),raw.replace(/[ \t]+(?=\r?$)/gm,''));contexts++;
}
assert.equal(contexts,2);
const r=JSON.parse(fs.readFileSync(path.join(dir,'169-validacion.json'),'utf8'));
assert.equal(r.allAppCertified,false);assert.equal(r.wide.pass,5010);assert.equal(r.sdk.fail,6);
assert.ok(fs.readFileSync(path.join(root,'ESTADO-ACTUAL.md'),'utf8').trimEnd().split(/\r?\n/).length<=40);
const files=git(['diff','--name-only',base]).split('\n');
const others=git(['ls-files','--others','--exclude-standard']).split('\n');
const excluded=p=>p.endsWith('.log')||/(?:166-(?:native|mobile)|167-regresion)-results\.json$/.test(p)||p.endsWith('/.last-run.json');
const members=[...new Set([...files,...others])].filter(p=>p&&!excluded(p)&&p!=='docs/evidencias/170-manifest.json');
for(const p of members)assert.ok(p==='ESTADO-ACTUAL.md'||p==='docs/YA-RESUELTO.md'||/^docs\/evidencias\/1[67][0-9]-/.test(p)||/^docs\/ordenes\/(193|199|200|201|204)-/.test(p),p);
const result={checkedAt:new Date().toISOString(),base,source:r.source,appDiff:'',
  whitespaceFullDeltaPass:true,preservedOriginalContexts:contexts,baselineSummary:r.wide,
  sameSdkFailureFamily:true,allAppCertified:false,why:'Packaging gate only; no repeated app validation or changed behavior results'};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
members.push('docs/evidencias/170-validacion.json');
const unique=[...new Set(members)].map(p=>({path:p,bytes:fs.statSync(path.join(root,p)).size,sha256:hash(fs.readFileSync(path.join(root,p)))}));
fs.writeFileSync(path.join(dir,'170-manifest.json'),JSON.stringify({base,source:r.source,members:unique},null,2)+'\n');
console.log(JSON.stringify({...result,files:unique.length}));
