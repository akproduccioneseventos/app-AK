import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
const fiesta=crearFiestaDeEstaNoche({id:'e2e_379_cancel_'+Date.now()});
fiesta.modulosContratados={...fiesta.modulosContratados,barraTecnologica:true};
fiesta.others={...fiesta.others,barraTecnologica:{settings:{enabled:true,accentColor:'#dc2626'},orders:[]}};
fiesta.cartaTragos={items:[
 {id:'qa379-empty',nombre:'QA379 agotado',stockDisponible:0,ingredientes:['QA379']},
 {id:'qa379-available',nombre:'QA379 disponible',stockDisponible:10,ingredientes:['QA379']},
],empresa:{linea1:'QA379',linea2:'Datos ficticios',contacto:'099000379'}};
const guest=fiesta.invitados![0];
test.beforeAll(()=>guardarFiesta(fiesta));test.afterAll(()=>borrarFiesta(fiesta.id));
test('379 aisla sugerir y cancelar con estilos reales, sin crear pedidos',async({page},info)=>{
 test.setTimeout(150000);const samples:any[]=[];
 try{
  await page.goto('/invitacion/'+fiesta.id+'/invitado/'+guest.id+'?token='+guest.guestAccessToken,{waitUntil:'domcontentloaded'});
  await expect(page.getByText(guest.nombre).first()).toBeVisible({timeout:45000});
  await page.getByRole('button',{name:/carta de tragos/i}).first().click();
  await expect(page.locator('article',{hasText:'QA379 agotado'})).toBeVisible({timeout:30000});
  for(let attempt=0;attempt<5;attempt++){
   await page.getByRole('button',{name:/sugerirme uno/i}).click({timeout:10000});
   const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
   await expect(dialog).not.toContainText('QA379 agotado');
   await dialog.getByRole('button',{name:/cancelar/i}).click({timeout:10000});
   for(const pause of [0,250,1000]){
    if(pause)await page.waitForTimeout(pause);
    samples.push({attempt,pause,bodyPointer:await page.locator('body').evaluate(el=>getComputedStyle(el).pointerEvents),dialogs:await dialog.evaluateAll(elements=>elements.map(el=>{const css=getComputedStyle(el),box=el.getBoundingClientRect();return{state:el.getAttribute('data-state'),text:el.textContent,animation:css.animationName,duration:css.animationDuration,iterations:css.animationIterationCount,opacity:css.opacity,pointer:css.pointerEvents,display:css.display,visibility:css.visibility,box:{x:box.x,y:box.y,width:box.width,height:box.height}};}))});
   }
   await expect(dialog).toBeHidden({timeout:5000});
  }
 }finally{
  await info.attach('qa379-dialog-styles',{contentType:'application/json',body:Buffer.from(JSON.stringify({samples,realOrdersSent:false,scope:'DOM/styles and actual select/cancel only; local FIS double, fictitious guest'}))});
  try{await info.attach('qa379-viewport',{contentType:'image/png',body:await page.screenshot({timeout:2000})});}catch(error){await info.attach('qa379-capture-unavailable',{contentType:'text/plain',body:String(error)});}
 }
});
