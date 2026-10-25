require('./208-egress-guard.cjs');
const local=host=>['localhost','127.0.0.1','::1','[::1]'].includes(String(host||'localhost'));
const denied=()=>Object.assign(new Error('AK_QA_EGRESS_BLOCKED: no external socket'),{code:'AK_QA_EGRESS_BLOCKED'});
const checkArgs=input=>{
 let args=Array.from(input);while(Array.isArray(args[0]))args=args[0];
 const first=args[0];let host;
 if(first&&typeof first==='object')host=first.host||first.hostname||first.socket?.remoteAddress;
 else if(typeof first==='number'||typeof first==='string'&&/^\d+$/.test(first))host=typeof args[1]==='string'?args[1]:undefined;
 // Named pipes/Unix sockets stay local; a TCP target without a host defaults to localhost.
 if(host&&!local(host))throw denied();
};
const net=require('node:net'),tls=require('node:tls'),http2=require('node:http2');
for(const module of[net,tls])for(const key of['connect','createConnection'])if(typeof module[key]==='function'){
 const original=module[key];module[key]=function(...args){checkArgs(args);return original.apply(this,args);};
}
const originalSocket=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){checkArgs(args);return originalSocket.apply(this,args);};
const originalHttp2=http2.connect;
http2.connect=function(authority,...args){const target=new URL(String(authority));if(!local(target.hostname))throw denied();return originalHttp2.call(this,authority,...args);};
