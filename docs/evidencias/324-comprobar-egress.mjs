import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);require('./323-egress-unit-canonico.cjs');
const net=require('node:net'),tls=require('node:tls'),http2=require('node:http2'),https=require('node:https');
const tests=[];
for(const[name,fn]of[
 ['net.connect',()=>net.connect(443,'example.com')],
 ['Socket.connect',()=>new net.Socket().connect({port:443,host:'example.com'})],
 ['tls.connect',()=>tls.connect({port:443,host:'example.com'})],
 ['http2.connect',()=>http2.connect('https://example.com')],
 ['https.get',()=>https.get('https://example.com')],
]){assert.throws(fn,e=>e.code==='AK_QA_EGRESS_BLOCKED');tests.push({name,blocked:true});}
await assert.rejects(fetch('https://example.com'),e=>e.code==='AK_QA_EGRESS_BLOCKED');tests.push({name:'fetch',blocked:true});
const server=net.createServer(socket=>socket.end('qa-local'));
await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
try{
 const data=await new Promise((yes,no)=>{const socket=net.connect({port:server.address().port,host:'127.0.0.1'});let text='';socket.on('data',bytes=>text+=bytes);socket.once('end',()=>yes(text));socket.once('error',no);});
 assert.equal(data,'qa-local');tests.push({name:'loopback TCP',allowed:true});
}finally{await new Promise(yes=>server.close(yes));}
const result={finished:new Date().toISOString(),passed:tests.length,tests,externalRequestsSent:0,scope:'QA transport guard only; does not test app or change its functional environment.'};
const target=fileURLToPath(new URL('./324-egress-resultados.json',import.meta.url));assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
