import {test,expect} from '@playwright/test';import {createRequire} from 'node:module';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,crearPermisoDeEstacion,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';import {enchufarCamaraFalsa} from './helpers/camara-falsa';
const require438=createRequire(process.cwd()+'/package.json'),apps=require438('firebase-admin/app'),fire=require438('firebase-admin/firestore'),app=apps.initializeApp({projectId:'demo-ak-producciones'},'qa438-'+Math.random()),db=fire.getFirestore(app);
test.afterAll(async()=>{await db.terminate();await apps.deleteApp(app);});
for(const [mode,count]of[['neutral',1],['neutral',3],['red',1],['rechazo',1]]as const)test('438 '+mode+' fotos'+count,async({page,context,baseURL},info)=>{
 test.setTimeout(120000);expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8085');
 const fiesta=crearFiestaDeEstaNoche({id:'e2e_438_'+mode+'_'+count+'_'+Date.now()});
 fiesta.others={...fiesta.others,entretenimiento:{...fiesta.others?.entretenimiento,modules:{...fiesta.others?.entretenimiento?.modules,fotocabina:{enabled:true,fotosPorTanda:count,countdownSeconds:2,segundosCuentaRegresiva:2,autoPublish:false}}}};
 const responses:any[]=[],states:any[]=[];let uploadsIntercepted=0;guardarFiesta(fiesta);await db.collection('fiestas').doc(fiesta.id).set(JSON.parse(JSON.stringify(fiesta)));
 expect((await db.collection('fiestas').doc(fiesta.id).get()).data().others.entretenimiento.modules.fotocabina.fotosPorTanda).toBe(count);
 await ponerSesionDelEquipo(context,baseURL);await enchufarCamaraFalsa(page);
 page.on('response',async r=>{if(r.request().method()==='POST'&&r.url().includes(fiesta.id))try{for(const line of(await r.text()).split('\n')){const match=line.match(/^[0-9a-z]+:(\{.*\})$/);if(!match)continue;let value;try{value=JSON.parse(match[1]);}catch{continue;}if(value.event?.station||value.error||value.session?.status)responses.push({success:value.success,error:value.error,station:value.event?.station?{fotos:value.event.station.fotosPorTanda,countdown:value.event.station.segundosCuentaRegresiva}:undefined,status:value.session?.status});}}catch{}});
 const record=async(label:string)=>states.push({label,text:(await page.locator('body').innerText()).slice(-5000),savedConfig:(await db.collection('fiestas').doc(fiesta.id).get()).data()?.others?.entretenimiento?.modules?.fotocabina});
 try{
  const access=crearPermisoDeEstacion(fiesta.id,'fotocabina');await page.goto('/evento/fotocabina/'+fiesta.id+'?access='+access,{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.locator('video').evaluateAll(list=>list.some(el=>(el as HTMLVideoElement).readyState>=2&&(el as HTMLVideoElement).videoWidth>0)),{timeout:30000}).toBe(true);
  await record('antes');const capture=page.locator('[data-testid="boton-sacar-foto"]').or(page.getByRole('button',{name:/preparar foto|sacar/i})).first();await expect(capture).toBeVisible();await capture.click();
  const publish=page.getByRole('button',{name:/publicar en el muro/i});await expect(publish).toBeVisible({timeout:45000});await page.waitForTimeout(2600);await expect(publish,'La vista previa no debe ser descartada por el siguiente sondeo').toBeVisible();await record('preview-estable');
  if(mode==='neutral')return;
  await page.route('**/evento/fotocabina/**',async route=>{const req=route.request(),bytes=req.postDataBuffer();if(req.method()==='POST'&&req.headers()['content-type']?.includes('multipart/form-data')&&bytes?.includes(Buffer.from('filename='))){uploadsIntercepted++;if(mode==='red')return route.abort('internetdisconnected');const response=await route.fetch(),body=await response.text();const changed=body.includes('"error"')?body.replace(/"error"\s*:\s*"[^"]*"/g,'"error":"Contenido inapropiado"').replace(/"success"\s*:\s*true/g,'"success":false'):body.replace(/"success"\s*:\s*(true|false)/,'"success":false,"error":"Contenido inapropiado"');return route.fulfill({response,body:changed});}return route.continue();});
  const consent=page.getByRole('checkbox');if(await consent.count())for(const box of await consent.all())if(await box.isVisible())await box.check();
  await expect(publish).toBeEnabled();await publish.click();
  if(mode==='red'){await expect(page.getByText(/guardada en este equipo|quedó guardada/i).first()).toBeVisible({timeout:30000});expect((await page.locator('body').innerText()).toLowerCase()).not.toMatch(/ya se subió|ya está subida|en la galería de la fiesta|tu recuerdo esta listo/i);}
  else{await expect(page.getByText(/contenido inapropiado/i).first()).toBeVisible({timeout:30000});expect((await page.locator('body').innerText()).toLowerCase()).not.toMatch(/se sube sola|se subirá sola|ya está subida/);}
  expect(uploadsIntercepted).toBeGreaterThan(0);
 }finally{try{await record('final');}catch{}await info.attach('qa438-neutro-y-frontera',{contentType:'application/json',body:Buffer.from(JSON.stringify({mode,count,uploadsIntercepted,responses,states,scope:'Real localSDK configuration and camera pipeline; failure injection installed ONLY after preview and ONLY file upload. Rejection is a controlled client response, not a real provider/backend rejection certification.'}))});borrarFiesta(fiesta.id);await db.collection('fiestas').doc(fiesta.id).delete();}
});
