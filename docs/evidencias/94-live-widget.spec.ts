// @ts-nocheck -- Browser and provider controlled only in reserved QA runtime.
import os from 'node:os';
import path from 'node:path';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.basename(process.cwd())!=='ak-entorno-aislado-94'||
  path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Solo TEMP94');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'voz94-'+process.pid),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
test.use({launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function abrir(page,context,baseURL){
  const id='e2e_94_live_'+process.pid+'_'+Date.now(),fiesta=crearFiestaDeEstaNoche({id});guardarFiesta(fiesta);
  await db.collection('fiestas').doc(id).set(JSON.parse(JSON.stringify(fiesta)));await ponerSesionDelEquipo(context,baseURL);
  await page.goto('/fiestas/nueva/tareas?fiestaId='+id,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();await expect(page.getByTestId('boton-hablar-en-vivo')).toBeVisible();
  return async()=>{await db.collection('fiestas').doc(id).delete();borrarFiesta(id);};
}
test('voz fallida permite REINTENTAR con un solo clic',async({page,context,baseURL},info)=>{
  test.setTimeout(180000);let llamadas=0;
  await page.route('**/api/asistente/voz-en-vivo',async(route)=>{llamadas++;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'QA94: no hay clave de prueba'})});});
  const limpiar=await abrir(page,context,baseURL);
  try{
    const b=page.getByTestId('boton-hablar-en-vivo');await b.click();await expect(page.getByText('QA94: no hay clave de prueba',{exact:true})).toBeVisible();
    await expect(b).toHaveAttribute('title',/Hablar en vivo/);expect(llamadas).toBe(1);
    await b.click();await page.waitForTimeout(1200);const segundo=llamadas;
    if(segundo===1){await b.click();await expect.poll(()=>llamadas).toBe(2);}
    await info.attach('live-reintento.json',{body:JSON.stringify({first:1,afterRetry:segundo,afterThirdClick:llamadas,provider:'controlled HTTP503',buttonTitle:await b.getAttribute('title')},null,2),contentType:'application/json'});
    expect(segundo,'el segundo toque tiene que iniciar otro pedido, no limpiar una sesion cerrada').toBe(2);
  }finally{await limpiar();}
});
test('Cortar mientras conecta impide abrir despues microfono y socket',async({page,context,baseURL},info)=>{
  test.setTimeout(180000);let liberar;let pedido=0;
  const espera=new Promise(resolve=>liberar=resolve);
  await page.addInitScript(()=>{
    window.__voz94={micro:0,sockets:0,closes:0,tracks:[]};
    const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async(...args)=>{window.__voz94.micro++;const s=await original(...args);window.__voz94.tracks.push(...s.getTracks());return s;};
    const NativeSocket=window.WebSocket;
    window.WebSocket=class{
      readyState=1;constructor(url,protocols){if(!String(url).startsWith('wss://qa94.invalid/'))return new NativeSocket(url,protocols);
        window.__voz94.sockets++;setTimeout(()=>this.onopen?.({}),0);}
      send(raw){const msg=JSON.parse(raw);if(msg.setup)setTimeout(()=>this.onmessage?.({data:JSON.stringify({setupComplete:{}})}),0);}
      close(){this.readyState=3;window.__voz94.closes++;}
    };
  });
  await page.route('**/api/asistente/voz-en-vivo',async(route)=>{pedido++;await espera;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({token:'auth_tokens/QA94',model:'gemini-3.8-live',voz:'Kore',segundosMaximos:30,wsUrl:'wss://qa94.invalid/controlled'})});});
  const limpiar=await abrir(page,context,baseURL);
  try{
    const b=page.getByTestId('boton-hablar-en-vivo');await b.click();await expect.poll(()=>pedido).toBe(1);
    await expect(b).toHaveAttribute('title',/Cortar/);await b.click();await expect(page.getByTestId('panel-voz-en-vivo')).toHaveCount(0);
    liberar();await page.waitForTimeout(2000);
    const after=await page.evaluate(()=>({micro:window.__voz94.micro,sockets:window.__voz94.sockets,closes:window.__voz94.closes,tracks:window.__voz94.tracks.map(t=>({kind:t.kind,state:t.readyState}))}));
    await info.attach('live-cortar-conectando.json',{body:JSON.stringify({after,provider:'delayed controlled response',panelReopened:await page.getByTestId('panel-voz-en-vivo').count(),buttonTitle:await b.getAttribute('title')},null,2),contentType:'application/json'});
    // Release every resource in the QA even when the product reopens after cancellation.
    await b.click();await page.evaluate(()=>window.__voz94.tracks.forEach(t=>t.stop()));
    expect(after.micro,'Cortar antes de la ficha debe evitar adquirir el microfono').toBe(0);expect(after.sockets).toBe(0);
  }finally{liberar();await limpiar();}
});
