import fs from'node:fs';import assert from'node:assert/strict';
const dir=new URL('./',import.meta.url);let cases=fs.readFileSync(new URL('655-native-cases.mjs',dir),'utf8');
cases=cases.replace('name: /Subir Video/','name: /Subir Video/i').replace('for(const testCase of cases)','for(const testCase of cases.filter(c=>!c.recording))');
const caseFile=new URL('668-native-cases.mjs',dir);assert(!fs.existsSync(caseFile));fs.writeFileSync(caseFile,cases);
let c=fs.readFileSync(new URL('663-nativos.mjs',dir),'utf8');const hashes=c.match(/\b[a-f0-9]{40}\b/g);c=c.replaceAll('663','668').replace("from'./655-native-cases.mjs'","from'./668-native-cases.mjs'");assert.deepEqual(c.match(/\b[a-f0-9]{40}\b/g),hashes);
const start=c.indexOf(" for(const [label,viewport]of["),end=c.indexOf(" record.phase=record.cases.every",start);assert(start>0&&end>start);
c=c.slice(0,start)+`
 for(const[label,viewport]of[['pc',{width:1280,height:900}],['pixel7',{width:390,height:844}]])await run('buzon-title-'+label,async()=>{
 const context=await browser.newContext({viewport,deviceScaleFactor:1});await setupContext(context);const page=await context.newPage();
 try{await page.goto(baseURL+guestStationRoute(fixture),{waitUntil:'domcontentloaded'});const heading=page.getByRole('heading',{name:'Cápsula de los Recuerdos',exact:true});await heading.waitFor();await heading.scrollIntoViewIfNeeded();const box=await heading.boundingBox(),color=await heading.evaluate(el=>getComputedStyle(el).color);const screenshot=await page.screenshot({path:path.join(output,'668-title-'+label+'.png')});const png=PNG.sync.read(screenshot),idx=(png.width*Math.floor(box.y+box.height/2)+Math.max(0,Math.floor(box.x-3)))*4,bg=[...png.data.subarray(idx,idx+3)],fg=color.match(/[\\d.]+/g).slice(0,3).map(Number);const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);const ratio=(Math.max(lum(bg),lum(fg))+.05)/(Math.min(lum(bg),lum(fg))+.05);const observed={color,bg,ratio,box};assert(ratio>=3,'Visible title contrast '+JSON.stringify(observed));return observed;}finally{await context.close();}
 });
`+c.slice(end);
const target=new URL('668-subida-y-titulo.mjs',dir);assert(!fs.existsSync(target));fs.writeFileSync(target,c);
