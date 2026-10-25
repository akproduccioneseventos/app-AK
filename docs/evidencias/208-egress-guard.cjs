const local = host => ['localhost','127.0.0.1','::1','[::1]'].includes(String(host||'localhost').replace(/:\d+$/,''));
const blocked = value => Object.assign(new Error('AK_QA_EGRESS_BLOCKED: external services disabled'),{code:'AK_QA_EGRESS_BLOCKED'});
if(globalThis.fetch){const original=globalThis.fetch;globalThis.fetch=function(input,options){const url=new URL(input?.url||String(input));if(['http:','https:'].includes(url.protocol)&&!local(url.hostname))return Promise.reject(blocked());return original.call(this,input,options);};}
for(const name of ['node:http','node:https']){
  const module=require(name);
  for(const method of ['request','get']){const original=module[method];module[method]=function(...args){const first=args[0];let host;if(typeof first==='string'||first instanceof URL){try{host=new URL(first).hostname;}catch{host=undefined;}}else host=first?.hostname||first?.host;if(host&&!local(host))throw blocked();return original.apply(this,args);};}
}
