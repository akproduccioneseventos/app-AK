import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
const sharp=createRequire(process.cwd()+'/package.json')('sharp');
const fixture=crearFiestaDeEstaNoche({id:'e2e_423_'+Date.now()});
fixture.others={...fixture.others,barraTecnologica:{settings:{enabled:true},orders:[]}};
test.beforeAll(()=>guardarFiesta(fixture));test.afterAll(()=>borrarFiesta(fixture.id));
test('423 contraste con fondo realmente rasterizado, no solo backgroundColor',async({page,context,baseURL},info)=>{
 test.setTimeout(90000);await ponerSesionDelEquipo(context,baseURL);
 await page.goto('/evento/barra/'+fixture.id+'/listo',{waitUntil:'domcontentloaded'});
 const title=page.getByRole('heading',{name:/los tragos se est.n preparando/i});await expect(title).toBeVisible({timeout:40000});
 const state=await title.evaluate(el=>{const box=el.getBoundingClientRect(),chain:any[]=[];for(let p:Element|null=el;p;p=p.parentElement){const s=getComputedStyle(p);chain.push({tag:p.tagName,class:p.className,background:s.backgroundColor,image:s.backgroundImage,color:s.color});}
  return{box:{x:box.x,y:box.y,width:box.width,height:box.height},foreground:getComputedStyle(el).color,chain,viewport:{width:innerWidth,height:innerHeight}};});
 const cdp=await context.newCDPSession(page);let png:Buffer;
 try{const capture=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});png=Buffer.from(capture.data,'base64');}finally{await cdp.detach();}
 const raw=await sharp(png!).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const sx=raw.info.width/state.viewport.width,sy=raw.info.height/state.viewport.height,samples:number[][]=[];
 for(let i=0;i<15;i++){const x=Math.min(raw.info.width-1,Math.max(0,Math.floor((state.box.x+state.box.width*(i+.5)/15)*sx))),y=Math.min(raw.info.height-1,Math.max(0,Math.floor((state.box.y+1)*sy))),offset=(y*raw.info.width+x)*raw.info.channels;samples.push([...raw.data.subarray(offset,offset+3)]);}
 const background=[0,1,2].map(c=>samples.map(p=>p[c]).sort((a,b)=>a-b)[7]);
 const foreground=state.foreground.match(/[\d.]+/g)!.slice(0,3).map(Number);
 const luminance=(rgb:number[])=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
 const a=luminance(background),b=luminance(foreground),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 await info.attach('qa423-screen',{contentType:'image/png',body:png!});
 await info.attach('qa423-pixels-and-css',{contentType:'application/json',body:Buffer.from(JSON.stringify({state,samples,background,foreground,ratio,method:'Median15 samples at top+1 of actual text linebox; CDP raster, dimensions scaled to viewport. No ignoring gradient background images.'}))});
 expect(ratio,'El fondo que ve la persona, no un backgroundColor transparente').toBeGreaterThanOrEqual(4.5);
});
