import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
const fixture=JSON.parse(fs.readFileSync('docs/evidencias/125-fixtures-execution.json'));
assert.equal(fixture.status,'running');assert.equal(fixture.applicationSourceSha,process.env.COMMIT_SHA);
const candidates=JSON.parse(fs.readFileSync('docs/evidencias/125-alias-candidatos.json'));
const payload=`v1.${Date.now()+900000}.${crypto.randomUUID()}`;
const cookie='ak_session='+payload+'.'+crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex');
const origin='http://127.0.0.1:3301',results=[];
function urlOf(route){
  const path=route.replace(/:([a-zA-Z]+)\*?/g,(_,key)=>key==='slug'?'como-empezar-a-organizar-una-fiesta-sin-estres':
    key==='fiestaId'?'qa125-fiesta':key==='filename'||key==='parts'?'qa125-no-file.png':'qa125-not-provisioned');
  const url=new URL(path,origin);if(!url.searchParams.has('fiestaId'))url.searchParams.set('fiestaId','qa125-fiesta');
  return url;
}
for(const entry of candidates.entries){
  if(entry.route==='/api/imports/confirmed-events-29'){
    results.push({route:entry.route,status:'NOT_RUN',reason:'Could import original business records; forbidden in fictional QA'});continue;
  }
  const url=urlOf(entry.route);
  try{
    const response=await fetch(url,{headers:{Cookie:cookie},redirect:'manual',signal:AbortSignal.timeout(30000)});
    const body=await response.text(),location=response.headers.get('location');
    let redirectMatches=null;
    if(entry.kind==='redirect'&&entry.targetRoute&&location){
      const expected=urlOf(entry.targetRoute),actual=new URL(location,origin);
      redirectMatches=actual.pathname===expected.pathname;
      for(const [k,v]of expected.searchParams)if(k!=='fiestaId')redirectMatches&&=actual.searchParams.get(k)===v;
    }
    const row={route:entry.route,kind:entry.kind,http:response.status,location,redirectMatches,
      result:response.status>=500?'ENTRY_SERVER_ERROR':entry.kind==='redirect'&&redirectMatches===false?'REDIRECT_MISMATCH':'ENTRY_OBSERVED_ONLY',
      bodyBytes:Buffer.byteLength(body),bodySha256:crypto.createHash('sha256').update(body).digest('hex'),
      parameterEntitiesProvisioned:!entry.requiredParams?.path?.some(k=>k!=='fiestaId'&&k!=='slug'),
      functionalModuleAccepted:false};
    results.push(row);console.log(JSON.stringify({route:row.route,http:row.http,result:row.result,redirectMatches}));
  }catch(error){results.push({route:entry.route,result:'REQUEST_NOT_COMPLETED',error:error.message,functionalModuleAccepted:false});}
}
fs.writeFileSync('docs/evidencias/125-http-entradas.json',JSON.stringify({applicationSourceSha:process.env.COMMIT_SHA,
  fixtureId:fixture.fixtureId,results,allRoutesAccepted:false,allRolesAccepted:false,
  note:'Read-only entry/redirect evidence, NOT successful CRUD or all-button proof. Missing parameter entities are explicit.'},null,2)+'\n');
console.log(JSON.stringify({completed:results.length,serverErrors:results.filter(r=>r.result==='ENTRY_SERVER_ERROR').length,
  redirectMismatches:results.filter(r=>r.result==='REDIRECT_MISMATCH').length,notCompleted:results.filter(r=>r.result==='REQUEST_NOT_COMPLETED').length}));
