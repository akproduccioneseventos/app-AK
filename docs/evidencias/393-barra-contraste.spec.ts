import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
const empty=crearFiestaDeEstaNoche({id:'e2e_393_empty_'+Date.now()});
const ready=crearFiestaDeEstaNoche({id:'e2e_393_ready_'+Date.now()});
for(const fiesta of[empty,ready]){
 fiesta.modulosContratados={...fiesta.modulosContratados,barraTecnologica:true};
 fiesta.others={...fiesta.others,barraTecnologica:{settings:{enabled:true},orders:[]}};
}
(ready.others!.barraTecnologica as any).orders=[{id:'qa393-order',status:'listo',guestName:'Persona QA393',drinkName:'Trago QA393',createdAt:new Date().toISOString()}];
test.beforeAll(()=>{guardarFiesta(empty);guardarFiesta(ready);});
test.afterAll(()=>{borrarFiesta(empty.id);borrarFiesta(ready.id);});
test('393 contraste computado de barra vacia y pedido listo',async({page,context,baseURL},info)=>{
 test.setTimeout(150000);await ponerSesionDelEquipo(context,baseURL);
 const samples:any[]=[];
 for(const [fiesta,text]of[[empty,'Los tragos se est\u00e1n preparando'],[ready,'Persona QA393']]as const){
  await page.goto('/evento/barra/'+fiesta.id+'/listo',{waitUntil:'domcontentloaded'});
  await expect(page.locator('header')).toContainText(fiesta.configuracion.nombreEvento,{timeout:45000});
  const target=page.getByText(text,{exact:true});await expect(target).toBeVisible();
  const sample=await target.evaluate(element=>{
   const rgb=(color:string)=>color.match(/[\d.]+/g)!.slice(0,3).map(Number);
   const luminance=(channels:number[])=>channels.map(c=>{const s=c/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;}).reduce((n,c,i)=>n+c*[0.2126,0.7152,0.0722][i],0);
   const foreground=getComputedStyle(element).color;let background='',parent:Element|null=element;
   while(parent){const value=getComputedStyle(parent).backgroundColor;if(value!=='transparent'&&!/rgba\([^)]*,\s*0\)$/.test(value)){background=value;break;}parent=parent.parentElement;}
   const a=luminance(rgb(foreground)),b=luminance(rgb(background));
   return{text:element.textContent,foreground,background,ratio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05),mainBackground:getComputedStyle(document.querySelector('main')!).backgroundColor};
  });samples.push(sample);expect(sample.ratio).toBeGreaterThanOrEqual(4.5);
  try{await info.attach('qa393-'+fiesta.id,{contentType:'image/png',body:await page.screenshot({timeout:2000})});}catch(error){await info.attach('qa393-capture-not-available',{contentType:'text/plain',body:String(error)});}
 }
 await info.attach('qa393-computed-styles',{contentType:'application/json',body:Buffer.from(JSON.stringify({samples,realOrdersSent:false}))});
});
