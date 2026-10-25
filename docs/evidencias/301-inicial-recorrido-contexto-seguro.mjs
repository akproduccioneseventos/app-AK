import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
let generator=fs.readFileSync(new URL('./295-ejecutar-nativos-focales.mjs',import.meta.url),'utf8');
const replacements=[
 ["const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'docs/evidencias'),source=",`const root=${JSON.stringify(root)},dir=path.join(root,'docs/evidencias'),source=`],
 ["const mode=process.argv[2]||'home';","const mode='route-walk';"],
 ["const sha=v=>crypto.createHash",`const beforeWrite="fs.writeFileSync(dest,hook+raw);copied.push(dest);";
const beforeCookies="await context.addCookies([";
const routeGuard="await context.route('**/*', async route => { const u=new URL(route.request().url()); if(/^https?:$/.test(u.protocol)&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname)) await route.abort('blockedbyclient'); else await route.continue(); });\\n    ";
assert(code.includes(beforeWrite));
code=code.replace(beforeWrite,"let content=hook+raw;if(entry.name==='recorrido-de-pantallas.spec.ts'){assert(content.includes("+JSON.stringify(beforeCookies)+"));content=content.replace("+JSON.stringify(beforeCookies)+","+JSON.stringify(routeGuard+beforeCookies)+");}fs.writeFileSync(dest,content);copied.push(dest);");
assert(code.includes('instrumentedSha256:hash(hook+raw)'));
code=code.replace('instrumentedSha256:hash(hook+raw)','instrumentedSha256:hash(fs.readFileSync(dest))');
const configCopy="copy(path.join(dir,'208-config.ts'),path.join(qa,'208-config.ts'));";
assert(code.includes(configCopy));
code=code.replace(configCopy,"const configDest=inside(path.join(qa,'208-config.ts'));assert(!fs.existsSync(configDest));const configSource=fs.readFileSync(path.join(dir,'208-config.ts'),'utf8');assert(configSource.includes(\"testIgnore:['**/ak207-recorrido-de-pantallas.spec.ts']\"));fs.writeFileSync(configDest,configSource.replace(\"testIgnore:['**/ak207-recorrido-de-pantallas.spec.ts']\",'testIgnore:[]'));copied.push(configDest);");
assert(code.includes("'test','--config','208-config.ts'"));
code=code.replace("'test','--config','208-config.ts'","'test','--project','chromium-desktop','--config','208-config.ts'");
changes.push(['QA additional egress guard','Guard also the separate browser.newContext used by the route walk; no original assertion or route changed']);
changes.push(['Route inventory activation','Remove copied QA configuration exclusion and run only the supported desktop project so a skipped mobile afterAll cannot overwrite the route receipt']);
const sha=v=>crypto.createHash`],
];
for(const[from,to]of replacements){assert(generator.includes(from),from);generator=generator.replace(from,to);}
await import('data:text/javascript;base64,'+Buffer.from(generator).toString('base64'));
