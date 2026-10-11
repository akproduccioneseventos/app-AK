if(process.env.AK_ENTORNO_AISLADO!=='true')throw new Error('QA97 isolated only');
const original=globalThis.fetch;
globalThis.fetch=async function(input,...args){
  const url=typeof input==='string'?input:input?.url||String(input);
  let host='';try{host=new URL(url).hostname;}catch{}
  if(/^(generativelanguage\.googleapis\.com|[a-z0-9-]*aiplatform\.googleapis\.com)$/.test(host)){
    console.error('[QA97] Provider unavailable locally: '+host);
    throw new Error('QA97 controlled provider outage; no outbound request');
  }
  return original.call(this,input,...args);
};
