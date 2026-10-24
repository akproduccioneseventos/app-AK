import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,crearPermisoDeEstacion,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
import {enchufarCamaraFalsa} from './helpers/camara-falsa';
for(const station of['fotocabina','touchpix']as const)for(const moving of[false,true]){
 test('408 '+station+' preview con camara '+(moving?'con frames nuevos':'original estatica'),async({page,context,baseURL},info)=>{
  test.setTimeout(90000);const party=crearFiestaDeEstaNoche({id:'e2e_408_'+station+'_'+moving+'_'+Date.now()});
  party.others={...party.others,entretenimiento:{...party.others?.entretenimiento,modules:{...party.others?.entretenimiento?.modules,[station]:{enabled:true,fotosPorTanda:1,countdownSeconds:2,segundosCuentaRegresiva:2,autoPublish:false}}}};
  const errors:string[]=[],responses:any[]=[],states:any[]=[];guardarFiesta(party);
  await ponerSesionDelEquipo(context,baseURL);
  if(!moving)await enchufarCamaraFalsa(page);
  else await page.addInitScript(()=>{
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d')!;let tick=0;const paint=()=>{ctx.fillStyle='#ffffff';ctx.fillRect(0,0,640,480);ctx.fillStyle='#e11d48';ctx.fillRect((tick++*8)%600,30,40,40);};paint();const stream=c.captureStream(15);setInterval(paint,100);return stream;},enumerateDevices:async()=>[{deviceId:'qa408',kind:'videoinput',label:'QA ficticia',groupId:'qa408'}],addEventListener:()=>{},removeEventListener:()=>{}}});
  });
  await page.addInitScript(()=>{
   (window as any).__qa408=[];const original=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...args:any[]){const v=args[0];if(v instanceof HTMLVideoElement){const list=(window as any).__qa408;list.push({at:performance.now(),ready:v.readyState,width:v.videoWidth,height:v.videoHeight,time:v.currentTime});if(list.length>60)list.shift();}try{return Reflect.apply(original,this,args);}catch(e){(window as any).__qa408.push({drawError:String(e)});throw e;}}as any;
   window.addEventListener('unhandledrejection',e=>(window as any).__qa408.push({rejection:String(e.reason)}));
  });
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',async r=>{if(r.request().method()==='POST'&&r.url().includes('/evento/'+station+'/')&&responses.length<20)try{const text=await r.text();responses.push({status:r.status(),fields:text.match(/.{0,30}"(?:fotosPorTanda|segundosCuentaRegresiva|countdownSeconds|success|error)".{0,160}/g)?.slice(0,12)});}catch{}});
  const state=async(label:string)=>states.push({label,video:await page.locator('video').evaluateAll(list=>list.map(el=>{const v=el as HTMLVideoElement;return{src:!!v.srcObject,ready:v.readyState,width:v.videoWidth,height:v.videoHeight,time:v.currentTime,paused:v.paused};})),draw:await page.evaluate(()=>(window as any).__qa408),text:(await page.locator('body').innerText()).slice(-5000)});
  try{
   const access=crearPermisoDeEstacion(party.id,station);await page.goto('/evento/'+station+'/'+party.id+'?access='+access,{waitUntil:'domcontentloaded'});
   await expect.poll(()=>page.locator('video').evaluateAll(list=>list.some(v=>(v as HTMLVideoElement).readyState>=2&&(v as HTMLVideoElement).videoWidth>0)),{timeout:30000}).toBe(true);
   await state('antes');await page.waitForTimeout(500);await state('frames');
   const capture=station==='fotocabina'?page.locator('[data-testid="boton-sacar-foto"]').or(page.getByRole('button',{name:/preparar foto|sacar/i})).first():page.locator('button[aria-label="Sacar foto"]');
   await expect(capture).toBeVisible();await capture.click();
   const preview=page.getByRole('button',{name:station==='fotocabina'?/publicar en el muro/i:/publicar al muro|guardar foto/i}).first();
   await expect(preview).toBeVisible({timeout:30000});await state('preview');expect(errors).toEqual([]);
  }finally{
   try{await state('final');}catch{}
   await info.attach('qa408-telemetria',{contentType:'application/json',body:Buffer.from(JSON.stringify({station,moving,errors,responses,states,realCamera:false,uploaded:false}))});borrarFiesta(party.id);
  }
 });
}
