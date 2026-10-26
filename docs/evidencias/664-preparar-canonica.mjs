import fs from'node:fs';import assert from'node:assert/strict';
const dir=new URL('./',import.meta.url);let c=fs.readFileSync(new URL('662-jest-aislado.mjs',dir),'utf8');
c=c.replace("source='a3ecd008976aa4a7879490d6701928ba9f56f7fc'","source='acc1cb968f06f705d11457c8fed0e2f01464d712'");
c=c.replace("assert.equal(previous.source,source)","assert.equal(previous.source,'a3ecd008976aa4a7879490d6701928ba9f56f7fc')");
c=c.replaceAll("'662-'","'664-'").replaceAll('.qa662-home','.qa664-home');
const marker="const record={source,qa,mode,";assert(c.includes(marker));c=c.replace(marker,"const record={source,runtimeSource:'a3ecd008976aa4a7879490d6701928ba9f56f7fc',runtimeEquivalence:'only portal-entregas-y-agentes-86.test.ts changed; verified below',qa,mode,");
const guard="assert.equal(spawnSync('git',['rev-parse','HEAD'],{cwd:qa,encoding:'utf8'}).stdout.trim(),source);";assert(c.includes(guard));
c=c.replace(guard,guard+"assert.equal(spawnSync('git',['diff','--name-only','a3ecd008976aa4a7879490d6701928ba9f56f7fc',source],{cwd:qa,encoding:'utf8'}).stdout.trim(),'src/__tests__/portal-entregas-y-agentes-86.test.ts');");
const out=new URL('664-jest-aislado.mjs',dir);assert(!fs.existsSync(out));fs.writeFileSync(out,c);
