import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=fileURLToPath(new URL('./',import.meta.url));
const rows=[];
function walk(node,parents=[],report='') {
  for(const suite of node.suites||[])walk(suite,[...parents,suite.title],report);
  for(const spec of node.specs||[])for(const test of spec.tests||[]) {
    const result=test.results?.at(-1);
    const file=(spec.file||'').replaceAll('\\','/').replace(/^.*\//,'').replace(/^ak207-/,'');
    const titles=[...parents.filter(t=>!t.endsWith('.spec.ts')&&!t.endsWith('.spec.tsx')),spec.title];
    const key=JSON.stringify([file,titles,test.projectName]);
    rows.push({key,file,titles,project:test.projectName,status:result?.status||test.status,
      started:result?.startTime||null,report,error:(result?.error?.message||'').replace(/\x1b\[[0-9;]*m/g,'').slice(0,900)});
  }
}
function load(prefix) {
  const start=rows.length;
  for(const file of fs.readdirSync(dir).filter(n=>new RegExp('^'+prefix+'-batch-\\d+-resultados\\.json$').test(n)).sort())walk(JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')),[],file);
  return rows.slice(start);
}
const baseline=load(512);assert.equal(baseline.length,258);
const map=new Map(baseline.map(r=>[r.key,{...r,originalReport:r.report,attempts:[r.report],source:'978af7d65a60bd287f3ee3cc05037a29566074f4'}]));
assert.equal(map.size,258,'Unique case/project keys required');
const supplemental=[];const replacements={};
for(const prefix of [520,554,568]) {
  let replaced=0;
  for(const row of load(prefix)) {
    const old=map.get(row.key);
    if(old) {map.set(row.key,{...old,...row,attempts:[...old.attempts,row.report]});replaced++;}
    else {assert.equal(prefix,520,'Unexpected native key, do not silently add a new case');supplemental.push(row);}
  }
  replacements[prefix]=replaced;
}
assert.equal(replacements[520],12);assert.equal(replacements[554],56);assert.equal(replacements[568],31);assert.equal(supplemental.length,2);
const unique=[...map.values()];const counts={};for(const r of unique)counts[r.status]=(counts[r.status]||0)+1;
const media=load(585);assert.equal(media.length,3);
const result={created:new Date().toISOString(),scope:'Finite258 native case/project keys on978. Later executions replace matching keys, never add PASS across attempts or versions. Media585 on f8f7 is separate.',source978:'978af7d65a60bd287f3ee3cc05037a29566074f4',counts,replacements,uniqueCases:unique.length,rows:unique,
  supplementalVisual520:supplemental,media585:{source:'f8f7cf34e8778de784b20e2654058fd722b2a2ec',rows:media},
  limits:['Counts are execution outcomes, not accepted functions or independent app defects.','Earlier512 emulator OOM and540 abandoned recovery are not app failures. Original records retained.','Skipped cases are NOT accepted. Date557 textual observations do not rewrite failed screenshot test.','A matching source identity is not a new browser run on f8f7.585 covers only its3 media criteria.','See594 for timeout/selector/fixture triage and597 for release verdict.']};
fs.writeFileSync(path.join(dir,'596-recuento-resultados.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({unique:unique.length,counts,replacements,supplemental:supplemental.length,media:media.map(r=>({title:r.titles.at(-1),status:r.status}))}));
