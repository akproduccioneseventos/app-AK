// @ts-nocheck -- QA only, copied to the reserved TEMP. No product modifications.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import JSZip from 'jszip';
import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo,crearPermisoDeEstacion} from './helpers/fiesta-de-prueba';

if(process.env.AK_ENTORNO_AISLADO!=='true' || path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88') ||
  path.basename(process.cwd())!=='ak-entorno-aislado-94' || process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085' ||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST!=='127.0.0.1:9195') throw new Error('Solo TEMP94/demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'qa94-'+process.pid);
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});const bucket=app.storage().bucket();
test.afterAll(async()=>app.delete());
const idNuevo=(kind)=>'e2e_94_'+kind+'_'+process.pid+'_'+Date.now();
test.use({launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function poner(fiesta){guardarFiesta(fiesta);const ref=db.collection('fiestas').doc(fiesta.id);await ref.set(JSON.parse(JSON.stringify(fiesta)));return ref;}
async function borrar(id){await db.collection('fiestas').doc(id).delete();borrarFiesta(id);}

test.describe('fotocabina corregida140',()=>{
  test('fotocabina guarda una fotografia con imagen de camara',async({page,context},info)=>{
    test.setTimeout(210000);const id=idNuevo('foto'),fiesta=crearFiestaDeEstaNoche({id});
    fiesta.others={...fiesta.others,entretenimiento:{...fiesta.others?.entretenimiento,modules:{...fiesta.others?.entretenimiento?.modules,
      fotocabina:{enabled:true,fotosPorTanda:1,segundosCuentaRegresiva:2,countdownSeconds:2,autoPublish:true,reviewSeconds:120,deliveryChannels:['qr','galeria']}}}};
    const ref=await poner(fiesta),prefix='entertainment/'+id+'/';
    try{
      await page.goto('/evento/fotocabina/'+id+'?access='+crearPermisoDeEstacion(id,'fotocabina'),{waitUntil:'domcontentloaded'});
      expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
      const disparar=page.getByTestId('boton-sacar-foto');await expect(disparar).toBeEnabled({timeout:60000});await disparar.click();
      const foto=page.locator('img[alt="Captura Final"]');await expect(foto).toBeVisible({timeout:60000});
      const src=await foto.getAttribute('src');expect(src).toMatch(/^data:image\/(jpeg|png)/);
      const pixeles=await page.evaluate(async(src)=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');
        c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);
        const d=x.getImageData(200,300,800,350).data;let n=0;for(let p=0;p<d.length;p+=4)if(d[p]+d[p+1]+d[p+2]>30)n++;
        return {width:c.width,height:c.height,nonBlack:n,total:d.length/4};},src);
      expect(pixeles.nonBlack/pixeles.total).toBeGreaterThan(0.1);
      await expect.poll(async()=>((await ref.get()).data()?.others?.entretenimiento?.modules?.fotocabina?.media||[]).length,{timeout:60000}).toBe(1);
      const row=(await ref.get()).data().others.entretenimiento.modules.fotocabina.media[0];
      const object=decodeURIComponent(new URL(row.url).pathname.split('/o/')[1]);const bytes=(await bucket.file(object).download())[0];
      const r=await page.request.get(row.url);expect(r.status()).toBe(200);expect(await r.body()).toEqual(bytes);
      await info.attach('foto140-resultado.json',{body:JSON.stringify({pixeles,url:row.url,bytes:bytes.length,noTeamCookie:true},null,2),contentType:'application/json'});
      await info.attach('foto140-final.jpg',{body:bytes,contentType:'image/jpeg'});
    }finally{for(const f of (await bucket.getFiles({prefix}))[0])await f.delete();
      const posts=await db.collection('social_gallery_posts').where('fiestaId','==',id).get();for(const p of posts.docs)await p.ref.delete();await borrar(id);}
  });
});

for(const caso of ['cerca','fuera'])test('personal con ubicacion NATIVA '+caso,async({browser,baseURL},info)=>{
  test.setTimeout(180000);const id=idNuevo('geo'),emp='emp_'+id,token='tok_'+id,fiesta=crearFiestaDeEstaNoche({id});
  fiesta.configuracion.googleMapsUrl='https://maps.google.com/?q=-34.9065,-56.1998';fiesta.personalAsignado=[{empleadoId:emp,rolId:'rol94',eventSalary:0}];
  const ref=await poner(fiesta),acceso=db.collection('json_documents').doc('accesos-personal.json'),ajustes=db.collection('json_documents').doc('ajustes-llegada.json');
  const prevA=await acceso.get(),prevS=await ajustes.get();let cx;
  try{
    await acceso.set({_filePath:'accesos-personal.json',_arrayData:[{id:token,nombreAcceso:'QA94',fiestaId:id,empleadoId:emp,permisos:['itinerario'],fechaCreacion:new Date().toISOString()}]});
    await ajustes.set({_filePath:'ajustes-llegada.json',llegadaConUbicacion:true,radioMetros:300});
    const coordenadas=caso==='cerca'?{latitude:-34.9065,longitude:-56.1998}:{latitude:-34.8,longitude:-56.1};
    cx=await browser.newContext({baseURL,geolocation:coordenadas,permissions:['geolocation']});const pg=await cx.newPage();
    const res=await pg.goto('/acceso-personal/'+token,{waitUntil:'domcontentloaded'});
    const boton=pg.getByRole('button',{name:/Llegu/});await expect(boton).toBeVisible({timeout:60000});
    const native=await pg.evaluate(()=>new Promise(resolve=>navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude}),e=>resolve({error:e.message}),{timeout:10000})));
    expect(native.error).toBeUndefined();expect(native.lat).toBeCloseTo(coordenadas.latitude,5);
    expect(res.headers()['permissions-policy']).toContain('geolocation=(self)');
    const antes=(await ref.get()).data();await boton.click();
    if(caso==='cerca'){
      await expect(pg.getByRole('status').filter({hasText:/Llegada confirmada/})).toBeVisible({timeout:30000});
      await expect.poll(async()=>(await ref.get()).data().personalAsignado[0].checkInTimestamp).toBeTruthy();
      expect((await ref.get()).data().personalAsignado[0].checkInUbicacion).toMatchObject({lat:-34.9065,lng:-56.1998});
      await pg.reload({waitUntil:'domcontentloaded'});await expect(pg.getByText(/Tu llegada al evento ya fue confirmada/)).toBeVisible();
    }else{
      await expect(pg.getByRole('status').filter({hasText:/No pudimos registrar tu llegada/})).toBeVisible({timeout:30000});
      await expect(pg.getByRole('status')).toContainText(/cerca|metros|sal.n|distancia/i);await expect(boton).toBeEnabled();expect((await ref.get()).data()).toEqual(antes);
    }
    await info.attach('geo-'+caso+'.json',{body:JSON.stringify({native,headers:res.headers()['permissions-policy'],personal:(await ref.get()).data().personalAsignado,avisos:await pg.getByRole('status').allTextContents()},null,2),contentType:'application/json'});
  }finally{await cx?.close();await borrar(id);if(prevA.exists)await acceso.set(prevA.data());else await acceso.delete();if(prevS.exists)await ajustes.set(prevS.data());else await ajustes.delete();}
});

for(const caso of ['formatos','todo-falla'])test('album '+caso+' no miente sobre descarga',async({page,context},info)=>{
  test.setTimeout(180000);const id=idNuevo('album'),ref=await poner(crearFiestaDeEstaNoche({id})),prefix='qa94/'+id+'/';
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
  const video=Buffer.from(await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=120;c.height=120;const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,120,120);
    const s=c.captureStream(10),r=new MediaRecorder(s,{mimeType:'video/webm'}),chunks=[];r.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>r.onstop=resolve);
    r.start();await new Promise(resolve=>setTimeout(resolve,350));r.stop();await done;for(const t of s.getTracks())t.stop();return btoa(String.fromCharCode(...new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer())));}), 'base64');
  const files=[['foto.png','image/png',png],['clip.webm','video/webm',video]],posts=[];
  try{
    for(let i=0;i<files.length;i++){const [name,mime,bytes]=files[i],object=prefix+name;await bucket.file(object).save(bytes,{metadata:{contentType:mime}});
      const url='http://127.0.0.1:9195/v0/b/'+bucket.name+'/o/'+encodeURIComponent(object)+'?alt=media';
      const p={id:id+'_'+i,fiestaId:id,imageUrl:url,mediaType:i?'video':'image',moderationStatus:'approved',authorName:'QA94 '+i,timestamp:new Date().toISOString(),likes:0,comments:[],sourceModule:'fotocabina'};
      await db.collection('social_gallery_posts').doc(p.id).set(p);posts.push(p);}
    if(caso==='todo-falla')await page.route('**/v0/b/**',route=>route.fulfill({status:403,body:'QA94 denied'}));
    await page.goto('/evento/album/'+id,{waitUntil:'domcontentloaded'});await expect(page.getByText(/2 recuerdos seleccionados/)).toBeVisible({timeout:60000});
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    const descargas=[];page.on('download',d=>descargas.push(d));
    if(caso==='formatos'){
      const dp=page.waitForEvent('download');await page.getByTestId('boton-descargar-album').click();const d=await dp;
      const zip=await JSZip.loadAsync(fs.readFileSync(await d.path()));const rows=Object.values(zip.files).filter(f=>!f.dir&&!f.name.endsWith('info-evento.txt'));
      expect(rows).toHaveLength(2);const photo=rows.find(f=>f.name.endsWith('.png')),clip=rows.find(f=>f.name.endsWith('.webm'));
      expect(photo).toBeTruthy();expect(clip).toBeTruthy();expect(await photo.async('nodebuffer')).toEqual(png);expect(await clip.async('nodebuffer')).toEqual(video);
      await info.attach('album-formatos.json',{body:JSON.stringify({names:rows.map(f=>f.name),bytesCorrectos:true},null,2),contentType:'application/json'});
    }else{
      await page.getByTestId('boton-descargar-album').click();await expect(page.getByTestId('boton-reintentar-descarga')).toBeVisible({timeout:30000});
      const aviso=(await page.getByRole('status').allTextContents()).join(' ');expect(aviso).not.toMatch(/Se empaquetaron 2|Descarga completa/);expect(descargas).toHaveLength(0);
      expect(aviso).toMatch(/No se pudo|Ning.n|No se descarg|ning.n/i);
      await info.attach('album-todo-falla.json',{body:JSON.stringify({aviso,downloads:descargas.length},null,2),contentType:'application/json'});
      await page.unroute('**/v0/b/**');
      const retry=page.waitForEvent('download');await page.getByTestId('boton-reintentar-descarga').click();const recovered=await retry;
      const zip=await JSZip.loadAsync(fs.readFileSync(await recovered.path()));const rows=Object.values(zip.files).filter(f=>!f.dir&&!f.name.endsWith('info-evento.txt'));
      expect(rows).toHaveLength(2);expect(await rows.find(f=>f.name.endsWith('.png')).async('nodebuffer')).toEqual(png);
      expect(await rows.find(f=>f.name.endsWith('.webm')).async('nodebuffer')).toEqual(video);
      expect((await ref.get()).exists).toBe(true);for(const p of posts)expect((await db.collection('social_gallery_posts').doc(p.id).get()).data().moderationStatus).toBe('approved');
      await info.attach('album-reintento-entregado.json',{body:JSON.stringify({names:rows.map(f=>f.name),downloads:descargas.length,bytesCorrectos:true,postsIntactos:true},null,2),contentType:'application/json'});
    }
  }finally{for(const p of posts)await db.collection('social_gallery_posts').doc(p.id).delete();for(const f of (await bucket.getFiles({prefix}))[0])await f.delete();await borrar(id);}
});

test('hoja de cocina se abre por su enlace sin URL directa de rescate',async({page,context,baseURL},info)=>{
  test.setTimeout(180000);const id=idNuevo('cocina'),fiesta=crearFiestaDeEstaNoche({id}),mid='menu_'+id,pid='pres_'+id;
  const dish={id:'dish_'+id,name:'Principal adulto94',ingredients:[]};
  fiesta.configuracion.nombreEvento='Cocina QA94';fiesta.presupuestoId=pid;fiesta.menuAsignadoId=mid;
  const ref=await poner(fiesta),mr=db.collection('menus_catering').doc(mid),pr=db.collection('presupuestos').doc(pid);
  try{
    await mr.set({id:mid,name:'Menu QA94',items:[dish]});
    await pr.set({id:pid,clienteNombre:'Ficticio94',eventoTipo:'Cumpleanos',invitadosCantidad:28,invitadosAdultos:20,invitadosNinos:5,invitadosAdolescentes:3,
      estado:'Aceptado',timestamp:new Date().toISOString(),costoTotalEstimado:2800,totalConDescuento:2800,
      itemsPresupuestados:[{id:'item_'+id,idServicioCatalogo:dish.id,nombreServicio:dish.name,categoriaServicio:'Plato Principal',cantidad:20,precioUnitario:100,costoTotalItem:2000,calculationMethod:'por_persona'}]});
    await ponerSesionDelEquipo(context,baseURL);await page.goto('/fiestas/nueva/catering?fiestaId='+id,{waitUntil:'domcontentloaded'});
    const link=page.getByRole('link',{name:'Hoja de cocina',exact:true});await expect(link).toBeVisible({timeout:60000});
    const href=await link.getAttribute('href'),t=Date.now();await link.click();
    await expect(page.getByRole('heading',{name:'Cocina QA94',exact:true})).toBeVisible({timeout:90000});
    const row=page.getByRole('row').filter({hasText:dish.name});await expect(row.locator('td').last()).toContainText('20');
    await info.attach('cocina-link.json',{body:JSON.stringify({href,actual:page.url(),elapsedMs:Date.now()-t,porciones:await row.innerText(),directFallback:false},null,2),contentType:'application/json'});
  }finally{await mr.delete();await pr.delete();await borrar(id);}
});

test('voz en vivo sin clave devuelve error real sin reservar ni cobrar',async({page,context,baseURL},info)=>{
  test.setTimeout(180000);await ponerSesionDelEquipo(context,baseURL);
  const uso=db.collection('json_documents').where('_filePath','==','asistente/voz-en-vivo-uso.json');
  const before=(await uso.get()).docs.map(d=>({id:d.id,data:d.data()}));const res=await context.request.post('/api/asistente/voz-en-vivo');
  expect(res.status()).toBe(503);const body=await res.json();expect(body.error).toMatch(/No hay clave de Gemini/);expect(body.token).toBeUndefined();
  expect((await uso.get()).docs.map(d=>({id:d.id,data:d.data()}))).toEqual(before);
  await info.attach('live-sin-clave.json',{body:JSON.stringify({status:res.status(),body,usageUnchanged:true},null,2),contentType:'application/json'});
});
