import fs from 'node:fs';
import zlib from 'node:zlib';
import {spawnSync,execFileSync} from 'node:child_process';

const result=spawnSync('cmd.exe',['/d','/c','npm audit --json --ignore-scripts --no-fund --fetch-timeout=30000 --fetch-retries=1'],
  {encoding:'utf8',maxBuffer:2000000,timeout:90000,windowsHide:true});
if(![0,1].includes(result.status))throw new Error('Audit did not complete: '+result.stderr);
const report=JSON.parse(result.stdout);if(!report.metadata?.vulnerabilities)throw new Error('No completed audit metadata');
fs.writeFileSync('docs/evidencias/124-npm-audit.json.gz',zlib.gzipSync(Buffer.from(result.stdout)));
const ids=new Set();for(const row of Object.values(report.vulnerabilities))for(const item of row.via)
  if(typeof item==='object'&&item.url)ids.add(item.url);
const proof={applicationSourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  checkedAt:new Date().toISOString(),exitCode:result.status,vulnerabilities:report.metadata.vulnerabilities,
  uniqueAdvisories:ids.size,securityCertified:false};
fs.writeFileSync('docs/evidencias/124-npm-audit-resumen.json',JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify(proof));
