import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';

const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const record={applicationSourceSha:sha,started:new Date().toISOString(),status:'running',llmCalls:0};
const child=spawn('cmd.exe',['/d','/c','npm run graphify:update'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
record.pid=child.pid;
const log=fs.createWriteStream('docs/evidencias/125-graphify.log');
fs.writeFileSync('docs/evidencias/125-graphify-execution.json',JSON.stringify(record,null,2));
for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log.write(b);process.stdout.write(b);});
child.on('exit',code=>{
  const graph=code===0?JSON.parse(fs.readFileSync('graphify-out/graph.json')):null;
  const summary=graph?{builtAtCommit:graph.built_at_commit,nodes:graph.nodes.length,links:graph.links.length,
    communities:new Set(graph.nodes.map(n=>n.community)).size}:null;
  const result={...record,status:'finished',exitCode:code,finished:new Date().toISOString(),graph:summary};
  fs.writeFileSync('docs/evidencias/125-graphify-execution.json',JSON.stringify(result,null,2)+'\n');
  log.end(()=>{process.exitCode=code??1;});
});
