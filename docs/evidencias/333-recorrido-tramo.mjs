import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('./',import.meta.url)),id=process.argv[2],routes=JSON.parse(process.argv[3]||'[]');
assert(/^(332|336|338)\d{2}$/.test(id));assert(routes.length>0&&routes.length<=60&&routes.every(r=>typeof r==='string'&&r.startsWith('/')&&!r.includes(',')));
let generator=fs.readFileSync(path.join(dir,'331-recorrido-normal-fixture.mjs'),'utf8').replaceAll('331',id);
const beforeIdle="await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});";
const ready="r.qaReadyBody=await page.waitForFunction(passive=>{const area=document.querySelector('main')||document.body;const rect=area.getBoundingClientRect(),style=getComputedStyle(area);const busy=!passive&&Array.from(area.querySelectorAll('[aria-busy=\"true\"],svg.animate-spin')).some(el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden');return rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&Number(style.opacity)>0.1&&(area.innerText||'').trim().length>=40&&!busy;},Boolean(r.passive),{timeout:10000}).then(()=>true,()=>false);await page.waitForTimeout(500);";
const progress=`const results: any[] = [];const qaPartial=path.join(process.cwd(),'test-results','recorrido','partial-${id}.json');fs.mkdirSync(path.dirname(qaPartial),{recursive:true});const qaPush=results.push.bind(results);results.push=(...rows:any[])=>{const count=qaPush(...rows);fs.writeFileSync(qaPartial,JSON.stringify(results,null,2));return count;};`;
const forensics=id.startsWith('338')?"r.qaBodyText=(await page.locator('body').innerText({timeout:1500}).catch(()=>'' )).slice(0,6000);r.qaMainPresent=await page.locator('main').count();r.qaMainText=r.qaMainPresent?(await page.locator('main').first().innerText({timeout:1500}).catch(()=>'' )).slice(0,6000):'';await page.screenshot({path:shotPath,fullPage:false,animations:'disabled',timeout:2000}).then(()=>{r.qaForensicScreenshot=shotPath;},error=>{r.qaForensicScreenshotError=String(error.message||error);});":'';
const stricter="if(r.qaReadyBody===false){"+forensics+"results.push({...r,estado:'NO_PROBADA',motivo:'No confirmo cuerpo visible/listo dentro de10s; no se aprueba por header solo',duracionMs});return;}\n        // Capture screenshot";
const contextAnchor="const response = await page.goto(r.testUrl, {";
const contextInput="if(r.pathname==='/fiestas/nueva'||r.pathname.startsWith('/fiestas/nueva/')){const qaUrl=new URL(r.testUrl,'http://127.0.0.1');if(!qaUrl.searchParams.has('fiestaId'))qaUrl.searchParams.set('fiestaId','fiesta_esta_noche');r.qaInputContext='Explicit existing fictitious fiestaId, not app edit';r.testUrl=qaUrl.pathname+qaUrl.search;}\n        "+contextAnchor;
const screenshotAnchor='await page.screenshot({ path: shotPath, fullPage: false });';
const screenshotEvidence="await page.screenshot({path:shotPath,fullPage:false,animations:'disabled',timeout:5000}).then(()=>{r.qaScreenshot='captured';},error=>{r.qaScreenshot='unavailable';r.qaScreenshotError=String(error.message||error);});";
const sourceMods=[[beforeIdle,ready],['const results: any[] = [];',progress],['// Capture screenshot',stricter],[contextAnchor,contextInput],[screenshotAnchor,screenshotEvidence]];
const writeAnchor='let content=hook+raw;if(entry.name===\'recorrido-de-pantallas.spec.ts\')';
const writeModified=`let content=hook+raw;if(entry.name==='recorrido-de-pantallas.spec.ts'){for(const[from,to]of ${JSON.stringify(sourceMods)}){assert(content.includes(from),from);content=content.replaceAll(from,to);}}if(entry.name==='recorrido-de-pantallas.spec.ts')`;
const mods=[
 [writeAnchor,writeModified],
 ["const runEnv={...env,AK_RECORRIDO_CARRILES:'1',AK_QA_RESULTS:",`const runEnv={...env,AK_RECORRIDO_CARRILES:'1',AK_RECORRIDO_SOLO:${JSON.stringify(routes.join(','))},AK_QA_RESULTS:`],
];
const anchor='const check=spawnSync(process.execPath';assert(generator.includes(anchor));
generator=generator.replace(anchor,`for(const[from,to]of ${JSON.stringify(mods)}){assert(code.includes(from),from);code=code.replaceAll(from,to);}changes.push(...${JSON.stringify(mods)});\n`+anchor);
const checked=spawnSync(process.execPath,['--check','--input-type=module'],{input:generator,encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
const target=path.join(dir,'333-driver-'+id+'.mjs');assert(!fs.existsSync(target));fs.writeFileSync(target,generator);
await import(new URL('./333-driver-'+id+'.mjs',import.meta.url));
