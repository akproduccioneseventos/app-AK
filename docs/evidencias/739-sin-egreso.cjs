const fail=()=>{throw new Error('QA739 egreso real bloqueado');};
for(const p of ['http','https']){const m=require(p);m.request=fail;m.get=fail;}
const net=require('net');net.connect=fail;net.createConnection=fail;net.Socket.prototype.connect=fail;
global.fetch=fail;
