import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../../', import.meta.url)), dir = path.join(root, 'docs/evidencias');
const build = JSON.parse(fs.readFileSync(path.join(dir, '166-entorno.json'), 'utf8'));
const source = '108e17b4387237fc921ea12e8d1eb65b20f62ac9';
const contrast = '16e197cc3591bf0812c1e8910c880d83f04eb94b';
const target = path.join(dir, '181-http-denegaciones-resultados.json');
assert.equal(fs.existsSync(target), false, 'Preserve receipt');
assert.equal(build.source, source); assert.equal(build.buildExit, 0);
assert.match(build.qa.replaceAll('\\', '/'), /\/Temp\/ak-qa-166-[^/]+$/);
const qa = build.qa;
const safe = Object.fromEntries(['PATH','TEMP','TMP','SYSTEMROOT','WINDIR','PROGRAMDATA','PROGRAMFILES','COMSPEC','PATHEXT','LOCALAPPDATA'].filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
const git = (args, cwd = root) => { const p = spawnSync('git', args, { cwd, env: safe, encoding: 'utf8', maxBuffer: 4 * 1024 ** 2 }); assert.equal(p.status, 0, p.stderr); return p.stdout.trim(); };
assert.equal(git(['rev-parse','HEAD'], qa), source); assert.equal(git(['diff','--name-only'], qa), '');
assert.equal(fs.readdirSync(qa).some(n => /^\.env(?:\.(?:local|production|development|test)(?:\.local)?)?$/.test(n)), false);
const freeAtStart = os.freemem();
if (process.argv.includes('--wait')) {
  const deadline = Date.now() + 180000;
  while (os.freemem() < 1024 * 1024 ** 2 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve,10000));
}
const memory = { freeAtStart, freeAfterWait:os.freemem(), requiredBeforeServer:1024*1024**2, waited:process.argv.includes('--wait'), checkedAt:new Date().toISOString() };
const memoryFile = path.join(dir,'181-memoria-preflight.json');
assert.equal(fs.existsSync(memoryFile),false,'Preserve preflight receipt');
fs.writeFileSync(memoryFile,JSON.stringify(memory,null,2)+'\n');
assert.ok(memory.freeAfterWait >= memory.requiredBeforeServer, 'Under1GiB: do not start Next/browser; no app cases executed');
const equivalence = {};
for (const file of ['src/app/personal/[empleadoId]/page.tsx','src/app/actions/google-workspace.ts','src/lib/auth/session-token.ts','src/lib/auth/perfiles.ts',
  'src/middleware.ts','src/lib/auth/public-paths.ts','src/lib/google-workspace.ts','src/lib/fiesta/leer-fiestas.ts','src/lib/roles/leer-roles-interno.ts','src/lib/data-service.ts']) {
  const before = git(['rev-parse',`${source}:${file}`]), after = git(['rev-parse',`${contrast}:${file}`]); assert.equal(before, after, file); equivalence[file] = before;
}
const envResult = spawnSync(process.execPath, ['scripts/entorno-de-pruebas.mjs'], { cwd: root, env: { ...safe, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE:'true' }, encoding:'utf8' });
assert.equal(envResult.status, 0, envResult.stderr);
const home = path.join(qa, '.qa177-home'); fs.mkdirSync(path.join(home, 'config'), { recursive: true });
const env = { ...safe, ...JSON.parse(envResult.stdout).forzadas, HOME:home, USERPROFILE:home, APPDATA:path.join(home,'config'), XDG_CONFIG_HOME:path.join(home,'config'),
  AK_DISABLE_STANDALONE:'true', COMMIT_SHA:source, NODE_ENV:'production', NODE_OPTIONS:'--max-old-space-size=512' };
const inside = value => { const resolved = path.resolve(value); assert.ok(resolved.startsWith(path.resolve(qa) + path.sep), 'Own QA only'); return resolved; };
const jsonFiles = () => {
  const files = []; const walk = folder => { if (!fs.existsSync(folder)) return; for (const e of fs.readdirSync(folder, { withFileTypes:true })) {
    const f = inside(path.join(folder,e.name)); if (e.isDirectory() && !e.isSymbolicLink()) walk(f); else if (e.isFile() && f.endsWith('.json')) files.push(f);
  }}; for (const folder of ['data','src/data']) walk(path.join(qa,folder)); return files;
};
const snapshots = new Map(jsonFiles().map(f => [f, fs.readFileSync(f)]));
const employees = ['a','b'].map(x => ({ id:`qa177-${x}`, nombre:`QA177 Empleado ${x.toUpperCase()}`, email:`qa177-${x}@qa.invalid`, telefono:`09900017${x==='a'?'7':'8'}` }));
const event = (id, salaryA, salaryB, date = '2027-08-08') => ({ id, estado:'Planificacion', configuracion:{ nombreEvento:`QA177 Fiesta ${id}`, fechaEvento:date, horaInicio:'21:00', nombreLugar:'QA177 Salon', invitadosEstimados:100 },
  personalAsignado:[...(salaryA == null ? [] : [{ empleadoId:'qa177-a', rolId:'qa177-mozo', eventSalary:salaryA }]), ...(salaryB == null ? [] : [{ empleadoId:'qa177-b', rolId:'qa177-mozo', eventSalary:salaryB }])] });
const fixture = { employees, events:[event('qa177-shared',1500.25,9876.75),event('qa177-other-only',null,8765.5)], archive:[event('qa177-archived',700.5,null,'2025-08-08')] };
const cases = [], observations = []; let server, browser; const started = new Date().toISOString();
const logFile = path.join(dir,'181-servidor.log'), log = fs.createWriteStream(logFile);
const record = { source, contrast, qa, buildFinished:build.finished, started, realServices:false, appEdited:false, equivalence, cases, observations };
const check = (id, pass, observed) => cases.push({ id, pass:Boolean(pass), observed });
const token = (perfil, userId = 'qa177-a', email = 'qa177-a@qa.invalid', expiresAt = Date.now() + 3600000) => {
  const user = { userId, email, role:'admin', perfil };
  const payload = `v1.${expiresAt}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
  return payload + '.' + crypto.createHmac('sha256', env.AK_SESSION_SECRET).update(payload).digest('hex');
};
const origin = 'http://127.0.0.1:3300';
async function http(perfil, id = 'qa177-a', options = {}) {
  let value = perfil === 'anonymous' ? null : token(perfil === 'expired' || perfil === 'tampered' ? 'personal' : perfil, options.userId || 'qa177-a', options.email || 'qa177-a@qa.invalid', perfil === 'expired' ? Date.now()-60000 : undefined);
  if (perfil === 'tampered') value = value.slice(0,-1) + (value.endsWith('0') ? '1' : '0');
  const response = await fetch(`${origin}/personal/${id}`, { redirect:'manual', headers:value ? { cookie:`ak_session=${encodeURIComponent(value)}` } : {}, signal:AbortSignal.timeout(60000) });
  const html = await response.text(); return { status:response.status, location:response.headers.get('location'), html };
}
try {
  const listener = net.createServer(); await new Promise((yes,no) => { listener.once('error',no); listener.listen(3300,'127.0.0.1',yes); }); await new Promise(yes => listener.close(yes));
  for (const f of jsonFiles()) if (['fiestas','archive'].some(folder => f.startsWith(path.join(qa,'data',folder)+path.sep) || f.startsWith(path.join(qa,'src/data',folder)+path.sep))) fs.unlinkSync(inside(f));
  for (const folder of ['data','src/data']) {
    const write = (file, value) => { const p = inside(path.join(qa,folder,file)); fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(value)); };
    write('empleados.json',employees); write('roles.json',[{ id:'qa177-mozo',nombre:'Mozo' }]);
    write('_google-workspace-accounts.json', employees.map(e => ({id:`employee_${e.id}`,kind:'employee',employeeId:e.id,email:e.email,status:'connected',accessToken:`QA177_FAKE_ACCESS_${e.id}`,refreshToken:`QA177_FAKE_REFRESH_${e.id}`})));
    for (const e of fixture.events) write(`fiestas/${e.id}.json`,e);
    for (const e of fixture.archive) write(`archive/${e.id}.json`,e);
  }
  server = spawn(process.execPath,[path.join(root,'../ak-react19-candidato-103/node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3300'],{cwd:qa,env,stdio:['ignore','pipe','pipe']});
  record.serverPid = server.pid; server.stdout.pipe(log,{end:false}); server.stderr.pipe(log,{end:false});
  const deadline = Date.now()+60000;
  while (!record.health) try { const h = await (await fetch(`${origin}/api/health`,{signal:AbortSignal.timeout(5000)})).json(); assert.ok(h.version?.startsWith(source)); assert.ok(Object.values(h.services).every(v=>v===false)); record.health=h; }
  catch(e) { if (Date.now()>=deadline) throw e; await new Promise(r=>setTimeout(r,500)); }
  const positive = await http('personal');
  check('positive-own-portal-before-negative-cases',positive.status===200&&positive.html.includes('QA177 Empleado A')&&positive.html.includes('qa177-shared'),{status:positive.status});
  for (const perfil of ['secretaria','operador','cliente','prospecto','invitado','tampered','expired']) {
    const r = await http(perfil); const allowed = perfil === 'dueno' || perfil === 'personal';
    const own = r.html.includes('QA177 Empleado A') && r.html.includes('qa177-shared') && r.html.includes('qa177-archived');
    const others = ['QA177 Empleado B','qa177-other-only','9876.75','8765.5','QA177_FAKE_ACCESS','QA177_FAKE_REFRESH'].filter(s=>r.html.includes(s));
    const deniedPage = r.html.includes('Esta pagina no existe');
    const pass = !own && !r.html.includes('QA177 Empleado A') && !r.html.includes('qa177-shared') && (r.status>=300 || r.status===200&&deniedPage);
    check(`http-role-${perfil}`,pass,{ status:r.status,location:r.location,ownContent:own,foreignMarkers:others,deniedPage,bytes:Buffer.byteLength(r.html) });
  }
  const wrong = await http('personal','qa177-b'); check('http-other-employee-denied',(wrong.status>=300 || wrong.status===200&&wrong.html.includes('Esta pagina no existe')) && !wrong.html.includes('QA177 Empleado B') && !wrong.html.includes('qa177-other-only'),{status:wrong.status,location:wrong.location,deniedPage:wrong.html.includes('Esta pagina no existe')});

  if (!process.argv.includes('--extra-native')) record.nativeNotRun = {reason:'Reuse ten passing PC/Pixel7 UI cases from179; retry only the eight QA status expectations plus fresh positive control'};
  else {
    const { chromium } = createRequire(path.join(root,'../ak-react19-candidato-103/package.json'))('@playwright/test');
    browser = await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--disable-background-networking']});
    for (const [name,viewport,isMobile,hasTouch] of [['pc',{width:1440,height:1000},false,false],['pixel7',{width:393,height:851},true,true]]) {
      const context = await browser.newContext({viewport,isMobile,hasTouch,timezoneId:'America/Montevideo'});
      try {
        await context.route('**/*',route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        await context.addCookies([{name:'ak_session',value:encodeURIComponent(token('personal')),url:origin,httpOnly:true,sameSite:'Lax'}]);
        const page = await context.newPage(); await page.goto(`${origin}/personal/qa177-a`,{waitUntil:'domcontentloaded',timeout:60000});
        await page.getByRole('heading',{name:'QA177 Empleado A',exact:true}).waitFor({timeout:15000});
        const visible = await page.locator('body').innerText();
        check(`ui-${name}-own-event-and-no-other`,visible.includes('qa177-shared') && visible.includes('qa177-archived') && !visible.includes('qa177-other-only') && !visible.includes('Empleado B'),{visible:visible.slice(0,6000)});
        const links = await page.getByRole('link',{name:'Agregar a Google',exact:true}).evaluateAll(nodes=>nodes.map(n=>n.href));
        const decoded = links.map(value => new URL(value).searchParams.get('details'));
        check(`ui-${name}-calendar-links-own-salary-only`,links.length===2 && decoded.every(s=>!s.includes('9876.75')&&!s.includes('8765.5')) && decoded.some(s=>s.includes('1500.25')),{details:decoded});
        const overflow = await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
        check(`ui-${name}-horizontal-fit`,overflow.scroll<=overflow.width+1,overflow);
        await page.screenshot({path:path.join(dir,`179-personal-${name}.png`),fullPage:true});
        await page.reload({waitUntil:'domcontentloaded'}); await page.getByRole('heading',{name:'QA177 Empleado A',exact:true}).waitFor({timeout:15000});
        check(`ui-${name}-reload-keeps-own-data`,await page.getByText('QA177 Fiesta qa177-shared',{exact:true}).isVisible(),{});
        await page.goto(`${origin}/personal/qa177-b`,{waitUntil:'domcontentloaded'});
        check(`ui-${name}-direct-other-denied`,!(await page.locator('body').innerText()).includes('QA177 Empleado B'),{url:page.url()});
      } finally { await context.close(); }
    }
  }
} catch(e) { record.executionError = String(e.stack || e); process.exitCode=1; }
finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { const ended=new Promise(r=>server.once('exit',r)); server.kill(); await Promise.race([ended,new Promise(r=>setTimeout(r,5000))]); }
  await new Promise(r=>log.end(r)); fs.writeFileSync(logFile+'.gz',gzipSync(fs.readFileSync(logFile)));
  for (const f of jsonFiles()) if (!snapshots.has(f)) fs.unlinkSync(inside(f));
  for (const [f,bytes] of snapshots) { fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,bytes); }
  record.snapshotCount=snapshots.size; record.sourceDiff=git(['diff','--name-only'],qa); record.finished=new Date().toISOString();
  record.summary={total:cases.length,pass:cases.filter(c=>c.pass).length,fail:cases.filter(c=>!c.pass).length};
  record.limits=['Actual Next build108e, signed synthetic sessions and local JSON data; named source consumers match public daef, not a full daef build',
    'No creation/payment/notification/OAuth flow, external browser requests blocked, no new app code',
    'HTML absence checks include SSR/RSC response; UI only where native steps completed; not seven complete role portals'];
  fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n');
  if (record.sourceDiff || record.summary.fail || record.executionError) process.exitCode=1;
  console.log(JSON.stringify({source,contrast,summary:record.summary,error:record.executionError,nativeNotRun:record.nativeNotRun,sourceDiff:record.sourceDiff,failed:cases.filter(c=>!c.pass)}));
}
