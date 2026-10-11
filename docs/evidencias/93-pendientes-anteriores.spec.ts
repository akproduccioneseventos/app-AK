// @ts-nocheck -- Sondas de comportamiento, solo TEMP y emuladores demo.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,crearPermisoDeEstacion,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST!=='127.0.0.1:9195'||process.env.FIREBASE_PROJECT_ID!=='demo-ak-producciones'||
  path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')) throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'pendientes93-'+process.pid);
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
const bucket=app.storage().bucket();
test.afterAll(async()=>app.delete());
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');

async function camara(page){
  await page.addInitScript(()=>{
    const armar=()=>{
      const c=document.createElement('canvas');c.width=640;c.height=480;const x=c.getContext('2d');
      let frame=0;const timer=setInterval(()=>{x.fillStyle=frame++%2?'#27ad78':'#2586cc';x.fillRect(0,0,640,480);x.fillStyle='#ffd447';x.fillRect((frame*9)%500,100,100,100);},33);
      const stream=c.captureStream(30);for(const t of stream.getTracks())t.addEventListener('ended',()=>clearInterval(timer));return stream;
    };
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>armar(),
      enumerateDevices:async()=>[{deviceId:'qa93',kind:'videoinput',label:'Camara ficticia',groupId:'qa93'}],addEventListener(){},removeEventListener(){}}});
  });
}
async function cleanup(id){
  for(const col of ['social_gallery_posts','bar_drink_orders','buzon_messages']){
    const rows=await db.collection(col).where('fiestaId','==',id).get();await Promise.all(rows.docs.map(d=>d.ref.delete()));
  }
  const [files]=await bucket.getFiles();await Promise.all(files.filter(f=>f.name.includes('/'+id+'/')).map(f=>f.delete()));
  await db.collection('fiestas').doc(id).delete();borrarFiesta(id);
}

for(const station of [{route:'espejo-magico',module:'espejoMagicoFoto'},{route:'touchpix',module:'espejoMagicoIA'}]){
  test(station.route+': captura descarga y archivo final sin falsear servidor',async({page},info)=>{
    test.setTimeout(240000);const id='e2e_93_'+station.route.replaceAll('-','')+'_'+process.pid+'_'+Date.now();
    const fiesta=crearFiestaDeEstaNoche({id});fiesta.socialWallEnabled=true;
    fiesta.others={...fiesta.others,entretenimiento:{...fiesta.others?.entretenimiento,modules:{...fiesta.others?.entretenimiento?.modules,
      [station.module]:{enabled:true,countdownSeconds:1,segundosCuentaRegresiva:1,reviewSeconds:180,allowGuestRetake:true,maxRetakes:3,consentRequired:false,autoPublish:false}}}};
    const ref=db.collection('fiestas').doc(id);const errors=[],responses=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('response',async r=>{if(r.request().method()==='POST')responses.push({status:r.status(),body:(await r.text().catch(()=>'' )).slice(0,16000)});});
    try{
      guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));await camara(page);
      const access=crearPermisoDeEstacion(id,station.module);
      await page.goto('/evento/'+station.route+'/'+id+'?access='+access+(station.route==='espejo-magico'?'&mode=foto':''),{waitUntil:'domcontentloaded'});
      if(station.route==='touchpix'){
        await expect(page.getByTestId('touchpix-tab-foto')).toBeVisible({timeout:60000});
        const abrir=page.getByRole('button',{name:'Abrir Cámara',exact:true});if(await abrir.isVisible())await abrir.click();
        await expect(page.getByRole('button',{name:'Sacar foto',exact:true})).toBeVisible({timeout:30000});
        const inputState=await page.evaluate(async()=>{
          const videos=[...document.querySelectorAll('video')];
          const original=videos.find(v=>v.srcObject instanceof MediaStream);
          const pixelCount=v=>{
            if(!v||v.readyState<2||!v.videoWidth)return 0;
            const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
            const x=c.getContext('2d');x.drawImage(v,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let count=0;
            for(let i=0;i<d.length;i+=4)if(d[i+2]>100&&d[i+1]>70&&d[i]<80)count++;return count;
          };
          const control=document.createElement('video');control.muted=true;control.autoplay=true;control.playsInline=true;
          control.srcObject=original?.srcObject;control.style.cssText='position:fixed;bottom:0;left:0;width:160px;height:120px;z-index:99999';
          document.body.appendChild(control);await control.play();
          await new Promise(resolve=>control.requestVideoFrameCallback(()=>resolve()));
          const proof={videos:videos.map(v=>({width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,paused:v.paused,display:getComputedStyle(v).display,hasStream:!!v.srcObject,colorPixels:pixelCount(v)})),controlColorPixels:pixelCount(control)};
          control.srcObject=null;control.remove();return proof;
        });
        await info.attach('camara-estado.json',{body:JSON.stringify(inputState,null,2),contentType:'application/json'});
        expect(inputState.controlColorPixels,'Control independiente de la MISMA senal').toBeGreaterThan(500);
        await expect.poll(async()=>page.evaluate(()=>{
          const v=[...document.querySelectorAll('video')].find(v=>v.srcObject instanceof MediaStream);if(!v||v.readyState<2||!v.videoWidth)return 0;
          const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
          const x=c.getContext('2d');x.drawImage(v,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let colors=0;
          for(let i=0;i<d.length;i+=4)if(d[i+2]>100&&d[i+1]>70&&d[i]<80)colors++;return colors;
        }),{timeout:15000}).toBeGreaterThan(500);
        await info.attach('camara-antes.png',{body:await page.evaluate(()=>{
          const v=[...document.querySelectorAll('video')].find(v=>v.srcObject instanceof MediaStream),c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
          c.getContext('2d').drawImage(v,0,0);return c.toDataURL().split(',')[1];
        }).then(b=>Buffer.from(b,'base64')),contentType:'image/png'});
        await page.getByRole('button',{name:'Sacar foto',exact:true}).click();
        await expect(page.locator('img[alt="Captura Touchpix"]')).toBeVisible({timeout:30000});
      }else{
        await expect(page.getByRole('button',{name:'Tocar para foto',exact:true})).toBeVisible({timeout:60000});
        const consent=page.getByRole('checkbox');if(await consent.count())await consent.check();
        await page.getByRole('button',{name:'Tocar para foto',exact:true}).click();
        await expect(page.getByRole('button',{name:'Guardar en el celular',exact:true})).toBeVisible({timeout:90000});
      }
      const [file]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.getByRole('button',{name:station.route==='touchpix'?'Guardar':'Guardar en el celular',exact:true}).click({timeout:20000})]);
      const bytes=fs.readFileSync(await file.path());expect(bytes.length).toBeGreaterThan(2000);
      await info.attach('foto-descargada.jpg',{body:bytes,contentType:'image/jpeg'});
      const colorPixels=await page.evaluate(async b=>{
        const image=await createImageBitmap(new Blob([Uint8Array.from(atob(b),c=>c.charCodeAt(0))]));
        const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
        const x=c.getContext('2d');x.drawImage(image,0,0);const d=x.getImageData(0,0,c.width,c.height-80).data;let colors=0;
        for(let i=0;i<d.length;i+=4)if(d[i+2]>100&&d[i+1]>70&&d[i]<80)colors++;image.close();return colors;
      },bytes.toString('base64'));
      await info.attach('contenido-foto.json',{body:JSON.stringify({colorPixels,bytes:bytes.length}),contentType:'application/json'});
      expect(colorPixels,'El recuerdo debe contener la imagen de camara, no solo una marca').toBeGreaterThan(500);
      if(station.route==='touchpix')await page.getByRole('button',{name:'Publicar al muro',exact:true}).click();
      await expect.poll(async()=>(await db.collection('social_gallery_posts').where('fiestaId','==',id).get()).size,{timeout:20000}).toBe(1);
      const posts=await db.collection('social_gallery_posts').where('fiestaId','==',id).get();const row=posts.docs[0].data();
      const url=row.mediaUrl||row.url||row.imageUrl;expect(url).toBeTruthy();
      const parsed=new URL(url);expect(parsed.hostname).toBe('127.0.0.1');expect(parsed.port).toBe('9195');
      const fetched=await page.request.get(url);expect(fetched.status()).toBe(200);const final=await fetched.body();
      const name=decodeURIComponent(parsed.pathname.split('/o/')[1]);const b=app.storage().bucket(decodeURIComponent(parsed.pathname.split('/b/')[1].split('/')[0]));
      expect(await b.file(name).download().then(v=>hash(v[0]))).toBe(hash(final));
      expect(final.length).toBeGreaterThan(2000);
      await info.attach('archivo-final.json',{body:JSON.stringify({row,downloadBytes:bytes.length,finalBytes:final.length,http:200,sha256:hash(final),errors},null,2),contentType:'application/json'});
      await page.reload({waitUntil:'domcontentloaded'});expect((await db.collection('social_gallery_posts').where('fiestaId','==',id).get()).size).toBe(1);
    }finally{
      await info.attach('fiesta-y-respuestas.json',{body:JSON.stringify({fiesta:(await ref.get()).data(),responses,errors},null,2),contentType:'application/json'});
      await info.attach('pantalla-final.txt',{body:await page.locator('body').innerText().catch(()=>''),contentType:'text/plain'});
      await page.screenshot({path:info.outputPath('pantalla-final.png'),fullPage:true}).catch(()=>{});await cleanup(id);
    }
  });
}

test('barra: invitado pide barman entrega y el stock baja una sola vez',async({page,browser,baseURL},info)=>{
  test.setTimeout(360000);const id='e2e_barra93_'+process.pid+'_'+Date.now();const ins='ins_'+id;
  const fiesta=crearFiestaDeEstaNoche({id}),guest=fiesta.invitados[0],drinkId='custom_'+id;
  fiesta.modulosContratados.barraTecnologica=true;
  fiesta.others={...fiesta.others,barraTecnologica:{settings:{enabled:true,openingTime:'',closingTime:''},orders:[]}};
  fiesta.cartaTragos={items:[{id:drinkId,nombre:'Trago QA93',stockDisponible:5,ingredientes:['Insumo QA93'],
    recetaIngredientes:[{insumoId:ins,nombre:'Insumo QA93',cantidad:2,unidad:'Uds.'}]}]};
  const ref=db.collection('fiestas').doc(id),supply=db.collection('insumos').doc(ins);let equipo;
  try{
    guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));await supply.set({id:ins,nombre:'Insumo QA93',cantidadDisponible:10,unidad:'Uds.',valorUnitarioEstimado:0});
    await page.goto('/invitacion/'+id+'/invitado/'+guest.id+'?token='+guest.guestAccessToken,{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('button',{name:/carta de tragos/i}).first()).toBeVisible({timeout:60000});await page.getByRole('button',{name:/carta de tragos/i}).first().click();
    const card=page.locator('article').filter({hasText:'Trago QA93'});await expect(card).toBeVisible({timeout:30000});await card.getByTestId('boton-pedir-trago').click();
    await page.getByTestId('boton-confirmar-pedido').click();
    await expect.poll(async()=>(await db.collection('bar_drink_orders').where('fiestaId','==',id).get()).size,{timeout:30000}).toBe(1);
    const row=(await db.collection('bar_drink_orders').where('fiestaId','==',id).get()).docs[0];expect(row.data().status).toBe('nuevo');expect(row.data().guestId).toBe(guest.id);
    expect((await supply.get()).data().cantidadDisponible).toBe(8);
    equipo=await browser.newContext();await ponerSesionDelEquipo(equipo,baseURL);const barman=await equipo.newPage();
    await barman.goto('/evento/barra/'+id+'/barman',{waitUntil:'domcontentloaded'});
    for(const [button,status] of [['Preparar','preparando'],['Listo','listo'],['Entregado','entregado']]){
      await expect(barman.getByRole('button',{name:button,exact:true})).toBeVisible({timeout:60000});await barman.getByRole('button',{name:button,exact:true}).click();
      await expect.poll(async()=>(await row.ref.get()).data().status,{timeout:90000}).toBe(status).catch(async e=>{
        await info.attach('barman-final.txt',{body:await barman.locator('body').innerText(),contentType:'text/plain'});throw e;
      });
      expect((await supply.get()).data().cantidadDisponible).toBe(8);
    }
    await barman.reload({waitUntil:'domcontentloaded'});await expect(barman.getByText('Entregado',{exact:true}).first()).toBeVisible({timeout:30000});
    await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:/carta de tragos/i}).first().click();
    expect((await db.collection('bar_drink_orders').where('fiestaId','==',id).get()).size).toBe(1);expect((await supply.get()).data().cantidadDisponible).toBe(8);
    await info.attach('pedido-entregado.json',{body:JSON.stringify({order:(await row.ref.get()).data(),stock:(await supply.get()).data()},null,2),contentType:'application/json'});
  }finally{
    await info.attach('barra-final.txt',{body:await page.locator('body').innerText().catch(()=>''),contentType:'text/plain'});
    await equipo?.close();await supply.delete();await cleanup(id);
  }
});
