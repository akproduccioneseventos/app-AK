const assert=require('node:assert/strict');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8085');
assert.equal(process.env.GCLOUD_PROJECT,'demo-ak-producciones');
const [op,id]=process.argv.slice(2);assert(['get','set','delete'].includes(op));assert(id&&!id.includes('/'));
const url='http://127.0.0.1:8085/v1/projects/demo-ak-producciones/databases/(default)/documents/fiestas/'+encodeURIComponent(id);
function encode(v){if(v===null)return{nullValue:null};if(typeof v==='boolean')return{booleanValue:v};if(typeof v==='number'){assert(Number.isFinite(v));return Number.isSafeInteger(v)?{integerValue:String(v)}:{doubleValue:v};}if(typeof v==='string')return{stringValue:v};if(Array.isArray(v))return{arrayValue:{values:v.map(x=>encode(x===undefined?null:x))}};assert(v&&typeof v==='object');return{mapValue:{fields:Object.fromEntries(Object.entries(v).filter(([,x])=>x!==undefined).map(([k,x])=>[k,encode(x)]))}};}
function decode(v){if('nullValue'in v)return null;if('stringValue'in v)return v.stringValue;if('booleanValue'in v)return v.booleanValue;if('integerValue'in v){const n=Number(v.integerValue);assert(Number.isSafeInteger(n));return n;}if('doubleValue'in v)return Number(v.doubleValue);if('timestampValue'in v)return v.timestampValue;if('arrayValue'in v)return(v.arrayValue.values||[]).map(decode);if('mapValue'in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)]));throw Error('Unsupported QA fixture type');}
(async()=>{
 let body;if(op==='set'){let input='';for await(const c of process.stdin)input+=c;const value=JSON.parse(input);assert.equal(value.id,id);body=JSON.stringify({fields:encode(value).mapValue.fields});}
 const response=await fetch(url,{method:op==='set'?'PATCH':op==='delete'?'DELETE':'GET',headers:{authorization:'Bearer owner','content-type':'application/json'},body,signal:AbortSignal.timeout(10000)});
 if(response.status===404&&op!=='set'){console.log('null');return;}
 const text=await response.text();assert(response.ok,'Demo REST '+response.status+': '+text.slice(0,300));
 console.log(JSON.stringify(op==='get'?decode({mapValue:{fields:JSON.parse(text).fields||{}}}):null));
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
