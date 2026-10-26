import {createRequire} from 'node:module';
const ts=createRequire('C:/Users/Usuario/Documents/Codex/ak-codex88/ak-react19-candidato-103/package.json')('typescript');
export function transform604(file,text){
 let out=text;
 if(file.endsWith('90-lo-que-va-atras-dice-donde-quedo.spec.ts')){
  out=out.replaceAll('test.setTimeout(90_000);','test.setTimeout(180_000);').replaceAll('await enchufarCamaraFalsa(page);','await enchufarCamaraFalsa(page); await camara604(page);').replaceAll('timeout: 25_000','timeout: 65_000');
  out='async function camara604(page){await page.addInitScript(()=>{const streams=[];Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{enumerateDevices:async()=>[{deviceId:"qa604",kind:"videoinput",label:"QA ficticia",groupId:"qa"}],addEventListener:()=>{},removeEventListener:()=>{},getUserMedia:async()=>{const canvas=document.createElement("canvas");canvas.width=640;canvas.height=480;const draw=()=>{const c=canvas.getContext("2d");c.fillStyle="#ffffff";c.fillRect(0,0,640,480);c.fillStyle="#2196f3";c.fillRect((Date.now()/10)%600,100,35,35);};draw();const stream=canvas.captureStream(30);const pump=setInterval(draw,33);for(const t of stream.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(pump);stop();};}streams.push(stream);return stream;}}});window.__qa604streams=streams;});}\n'+out;
 }
 if(file.endsWith('la-grilla-de-caras.spec.ts')){
  out=out.replaceAll("page.getByRole('button', { name: /Ver todas las fotos de la fiesta/i });","page.getByRole('button', { name: /Ver todas las fotos de la fiesta/i }).first();");
  const marker='// Esperar a que tome los cuadros y cierre el modal\r\n    await page.waitForTimeout(4000);';
  const markerLF=marker.replaceAll('\r\n','\n');
  const replacement='// Wait for the real terminal state only AFTER accepting the selfie.\n    await expect.poll(()=>page.getByRole("heading",{name:/Resultados de tu búsqueda|No encontramos fotos tuyas todavía/i}).evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0;}).length),{timeout:75000}).toBeGreaterThan(0);';
  if(!out.includes(marker)&&!out.includes(markerLF))throw Error('Selfie-specific wait not found');
  out=out.replace(marker,replacement).replace(markerLF,replacement);
 }
 if(file.endsWith('la-web-de-venta-no-se-rompe.spec.ts'))out=out.replace('const context = await browser.newContext();','const context = await browser.newContext(); await context.route("**/*",r=>{const u=new URL(r.request().url());return /^https?:$/.test(u.protocol)&&!["127.0.0.1","localhost","[::1]"].includes(u.hostname)?r.abort("blockedbyclient"):r.continue();});');
 if(file.endsWith('entertainment-stations.spec.ts')||file.endsWith('las-estaciones-respetan-los-ajustes.spec.ts')){
  const tree=ts.createSourceFile(file,out,ts.ScriptTarget.Latest,true),edits=[];
  const visit=n=>{
   if(file.endsWith('las-estaciones-respetan-los-ajustes.spec.ts')&&ts.isVariableDeclaration(n)&&n.name.getText(tree)==='ESTACIONES'&&n.initializer&&ts.isArrayLiteralExpression(n.initializer)){
    const bogue=n.initializer.elements.find(e=>e.getText(tree).includes("nombre: 'Bogue'"));if(!bogue)throw Error('Bogue missing');edits.push({start:n.initializer.getStart(tree),end:n.initializer.end,text:'['+bogue.getText(tree)+']'});
   }
   if(ts.isReturnStatement(n)&&n.expression&&ts.isCallExpression(n.expression)&&ts.isPropertyAccessExpression(n.expression.expression)&&n.expression.expression.name.text==='captureStream'){
    const canvas=n.expression.expression.expression.getText(tree);edits.push({start:n.getStart(tree),end:n.end,text:'const c604='+canvas+';const s604='+n.expression.getText(tree)+';const p604=setInterval(()=>{const c=c604.getContext("2d");c.fillStyle=Date.now()%2?"#fefefe":"#eeeeee";c.fillRect(100,100,15,15);},33);for(const t of s604.getTracks()){const stop=t.stop.bind(t);t.stop=()=>{clearInterval(p604);stop();};}return s604;'});
   }
   ts.forEachChild(n,visit);
  };visit(tree);for(const e of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,e.start)+e.text+out.slice(e.end);
 }
 return out;
}
export const observations604=`
__akAudit207.beforeEach(async({page})=>{
 const events=[];page.__qa604events=events;
 page.on('request',r=>{if(r.method()==='POST')events.push({kind:'request',url:new URL(r.url()).pathname,method:r.method(),contentType:r.headers()['content-type']||''});});
 page.on('response',r=>{if(r.request().method()==='POST')events.push({kind:'response',url:new URL(r.url()).pathname,status:r.status()});});
 page.on('pageerror',e=>events.push({kind:'pageerror',message:e.message}));
 await page.addInitScript(()=>{const Native=window.MediaRecorder;window.__qa604recorders=[];if(Native)window.MediaRecorder=class extends Native{constructor(...args){super(...args);const entry={mime:this.mimeType,tracks:this.stream.getTracks().map(t=>({kind:t.kind,state:t.readyState})),events:[]};window.__qa604recorders.push(entry);for(const name of ['start','stop','error','dataavailable'])this.addEventListener(name,e=>entry.events.push({name,bytes:e.data?.size,message:e.error?.message}));}};});
});
__akAudit207.afterEach(async({page},info)=>{await info.attach('qa604-observations',{contentType:'application/json',body:Buffer.from(JSON.stringify({url:page.url(),events:page.__qa604events||[],body:await page.locator('body').innerText({timeout:3000}).catch(()=>'<unavailable>'),media:await page.evaluate(()=>({recorders:window.__qa604recorders||[],videos:[...document.querySelectorAll('video')].map(v=>({ready:v.readyState,width:v.videoWidth,height:v.videoHeight,paused:v.paused,src:v.src.startsWith('blob:')?'blob':v.src,tracks:v.srcObject?.getTracks?.().map(t=>({kind:t.kind,state:t.readyState}))}))})).catch(()=>null)}))});});
`;
