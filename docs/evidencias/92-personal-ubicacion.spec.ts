// @ts-nocheck -- Tres ubicaciones falsas; no prueba GPS fisico.
import os from 'node:os';import path from 'node:path';import admin from 'firebase-admin';
import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88'))throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'loc92-'+process.pid),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
for(const caso of ['nativa-bloqueada','correcta','fuera','denegada'])test('ubicacion obligatoria '+caso,async({browser,baseURL},info)=>{
  test.setTimeout(150000);const id='e2e_geo92_'+caso+'_'+process.pid+'_'+Date.now(),emp='emp_'+id,token='tok_'+id;
  const fiesta=crearFiestaDeEstaNoche({id});fiesta.configuracion.googleMapsUrl='https://maps.google.com/?q=-34.9065,-56.1998';
  fiesta.personalAsignado=[{empleadoId:emp,rolId:'rol_ficticio',eventSalary:0}];
  const fref=db.collection('fiestas').doc(id),aref=db.collection('json_documents').doc('accesos-personal.json'),sref=db.collection('json_documents').doc('ajustes-llegada.json');
  const prevA=await aref.get(),prevS=await sref.get();let cx;
  try{
    guardarFiesta(fiesta);await fref.set(JSON.parse(JSON.stringify(fiesta)));
    await aref.set({_filePath:'accesos-personal.json',_arrayData:[...(prevA.data()?._arrayData||[]),{id:token,nombreAcceso:'Personal ficticio92',fiestaId:id,empleadoId:emp,permisos:['itinerario'],fechaCreacion:new Date().toISOString()}]});
    await sref.set({_filePath:'ajustes-llegada.json',llegadaConUbicacion:true,radioMetros:300});
    cx=await browser.newContext({baseURL});const origin=new URL(baseURL).origin;
    if(caso!=='denegada'){await cx.grantPermissions(['geolocation'],{origin});await cx.setGeolocation(caso==='correcta'?{latitude:-34.9065,longitude:-56.1998}:{latitude:-34.8,longitude:-56.1});}
    // Coordenadas simuladas SOLO en dos controles del flujo servidor. La prueba
    // nativa conserva el navegador y la cabecera reales, sin esconder el bloqueo.
    if(caso==='correcta'||caso==='fuera')await cx.addInitScript(({caso})=>{
      Object.defineProperty(navigator.geolocation,'getCurrentPosition',{configurable:true,value:(ok)=>ok({coords:{latitude:caso==='correcta'?-34.9065:-34.8,longitude:caso==='correcta'?-56.1998:-56.1,accuracy:1},timestamp:Date.now()})});
    },{caso});
    const pg=await cx.newPage();const response=await pg.goto('/acceso-personal/'+token,{waitUntil:'domcontentloaded'});
    const llegada=pg.getByRole('button',{name:/Llegu/});await expect(llegada).toBeVisible({timeout:60000});
    const politica=await pg.evaluate(async()=>({url:location.href,permiso:(await navigator.permissions.query({name:'geolocation'})).state,permitido:document.featurePolicy?.allowsFeature('geolocation')}));
    if(caso==='nativa-bloqueada'){
      const nativa=await pg.evaluate(()=>new Promise(resolve=>navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude}),e=>resolve({code:e.code,message:e.message}),{timeout:8000})));
      await info.attach('ubicacion-nativa-politica.json',{body:JSON.stringify({cabecera:response.headers()['permissions-policy'],politica,nativa},null,2),contentType:'application/json'});
      expect(politica.permitido).toBe(false);expect(nativa.code).toBe(1);
    }
    const previo=(await fref.get()).data();await llegada.click();
    if(caso==='correcta'){
      await expect(pg.getByRole('status').filter({hasText:/Llegada confirmada/})).toBeVisible({timeout:20000});
      await expect.poll(async()=>(await fref.get()).data()?.personalAsignado?.[0]?.checkInTimestamp).toBeTruthy();
      const g=(await fref.get()).data().personalAsignado[0];expect(g.checkInUbicacion).toMatchObject({lat:-34.9065,lng:-56.1998});
      await pg.reload({waitUntil:'domcontentloaded'});await expect(pg.getByText(/Tu llegada al evento ya fue confirmada/)).toBeVisible();
    }else{
      await expect(pg.getByText('No pudimos registrar tu llegada',{exact:true})).toBeVisible({timeout:20000});
      if(caso==='fuera')await expect(pg.getByRole('status')).toContainText(/cerca|metros|sal.n|distancia/i);
      await expect(llegada).toBeEnabled();expect((await fref.get()).data()).toEqual(previo);
    }
    await info.attach('ubicacion-'+caso+'.json',{body:JSON.stringify({caso,coordenadasSimuladas:caso==='correcta'||caso==='fuera',politica,ajuste:(await sref.get()).data(),personal:(await fref.get()).data().personalAsignado,avisos:await pg.getByRole('status').allTextContents()},null,2),contentType:'application/json'});
    await pg.screenshot({path:info.outputPath('ubicacion-'+caso+'.png'),fullPage:true});
  }finally{await cx?.close();await fref.delete();borrarFiesta(id);if(prevA.exists)await aref.set(prevA.data());else await aref.delete();if(prevS.exists)await sref.set(prevS.data());else await sref.delete();}
});
