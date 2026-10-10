// @ts-nocheck -- Copiar solo a tests/e2e en el TEMP aislado autorizado.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import JSZip from 'jszip';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== path.join(os.tmpdir(),'ak-codex88')
  || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')) throw new Error('Solo TEMP de prueba');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'album90-'+process.pid);
const db=app.firestore(); db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>{await app.delete();});

async function caso({browser,baseURL,context,page}, info, modo) {
  test.setTimeout(240000);
  const id=`e2e_album90_${modo}_${process.pid}_${Date.now()}`;
  const otro=`${id}_otra`;
  const carpeta=path.join(process.cwd(),'public',id);
  fs.mkdirSync(carpeta,{recursive:true});
  const generador=await browser.newPage();
  await generador.setContent('<canvas width="320" height="180"></canvas>');
  const fuentes=await generador.evaluate(async()=>{
    const canvas=document.querySelector('canvas');
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#178746';ctx.fillRect(0,0,320,180);
    ctx.fillStyle='#fafafa';ctx.fillRect(80,30,160,120);
    const png=canvas.toDataURL('image/png').split(',')[1];
    const jpeg=canvas.toDataURL('image/jpeg').split(',')[1];
    const stream=canvas.captureStream(10);
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
    const chunks=[];
    const listo=new Promise(resolve=>recorder.onstop=resolve);
    recorder.ondataavailable=e=>chunks.push(e.data);
    recorder.start();
    await new Promise(resolve=>setTimeout(resolve,600));
    recorder.stop();await listo;stream.getTracks().forEach(t=>t.stop());
    const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());
    return {png,jpeg,webm:btoa(String.fromCharCode(...bytes))};
  });
  await generador.close();
  const nombres=modo==='video'?['foto.png','video.webm']:['foto.png','foto.jpg'];
  const bytes=nombres.map(n=>Buffer.from(n.endsWith('.webm')?fuentes.webm:n.endsWith('.jpg')?fuentes.jpeg:fuentes.png,'base64'));
  nombres.forEach((n,i)=>fs.writeFileSync(path.join(carpeta,n),bytes[i]));
  const fiesta=crearFiestaDeEstaNoche({id});
  fiesta.configuracion.nombreEvento='Album ficticio A90';
  guardarFiesta(fiesta);
  await db.collection('fiestas').doc(id).set(JSON.parse(JSON.stringify(fiesta)));
  const filas=nombres.map((n,i)=>({id:`${id}_${i}`,fiestaId:id,imageUrl:`${baseURL}/${id}/${n}`,
    mediaType:n.endsWith('.webm')?'video':'image',moderationStatus:'approved',authorName:`Recuerdo A90 ${i}`,
    timestamp:new Date(Date.now()-i*1000).toISOString(),likes:0,comments:[],sourceModule:i?'plataforma_360':'fotocabina'}));
  filas.push({...filas[0],id:`${id}_pendiente`,moderationStatus:'pending',authorName:'NO APROBADO A90'});
  filas.push({...filas[0],id:`${id}_oculto`,moderationStatus:'hidden',authorName:'OCULTO A90'});
  filas.push({...filas[0],id:`otro}_0`,fiestaId:otro,authorName:'OTRA FIESTA A90'});
  for(const fila of filas) await db.collection('social_gallery_posts').doc(fila.id).set(fila);
  const solicitudes=[];
  page.on('request',r=>{if(r.url().includes('download-recuerdos'))solicitudes.push(r.url());});
  try {
    await page.goto(`/evento/album/${id}`,{waitUntil:'domcontentloaded'});
    await expect(page.getByText(/2 recuerdos seleccionados/)).toBeVisible({timeout:45000});
    await page.getByRole('button',{name:/Galer.a Completa/}).click();
    await expect(page.getByText('Recuerdo A90 0',{exact:true})).toBeVisible({timeout:45000});
    await expect(page.getByText('Recuerdo A90 1',{exact:true})).toBeVisible();
    for(const nombre of ['NO APROBADO A90','OCULTO A90','OTRA FIESTA A90']) await expect(page.getByText(nombre,{exact:true})).toHaveCount(0);
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    if(modo==='video') {
      const control=await page.evaluate(async(url)=>{
        const video=document.createElement('video');video.src=url;video.muted=true;
        document.body.append(video);
        await video.play();
        const result={width:video.videoWidth,height:video.videoHeight};video.remove();return result;
      },filas[1].imageUrl);
      expect(control).toEqual({width:320,height:180});
      await info.attach('video-fuente-control.json',{body:JSON.stringify(control),contentType:'application/json'});
    }
    if(modo==='corte') await page.route(`${baseURL}/${id}/*`,route=>route.abort('failed'));
    const descargaPromise=page.waitForEvent('download');
    await page.getByTestId('boton-descargar-album').click();
    const descarga=await descargaPromise;
    const archivo=await descarga.path();
    const contenido=fs.readFileSync(archivo);
    const zip=await JSZip.loadAsync(contenido);
    const items=Object.values(zip.files).filter(f=>!f.dir&&!f.name.endsWith('info-evento.txt'));
    const registros=[];
    for(const item of items) {
      const cuerpo=await item.async('nodebuffer');
      registros.push({name:item.name,size:cuerpo.length,magic:cuerpo.subarray(0,8).toString('hex'),fuente:bytes.findIndex(b=>b.equals(cuerpo))});
    }
    await expect(page.getByTestId('boton-descargar-album')).toBeEnabled();
    const anuncio=await page.getByRole('status').allTextContents();
    await info.attach(`album-${modo}.zip`,{body:contenido,contentType:'application/zip'});
    await info.attach(`resultado-${modo}.json`,{body:JSON.stringify({modo,registros,anuncio,solicitudes,nombre:descarga.suggestedFilename()},null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath(`album-${modo}.png`),fullPage:false});
    expect(solicitudes).toEqual([]);
    if(modo==='corte') {
      expect(items).toHaveLength(0);
      // Un paquete sin un solo recuerdo no puede anunciar dos entregados.
      expect(anuncio.join(' ')).not.toMatch(/Se empaquetaron 2 recuerdos/);
    } else {
      expect(items).toHaveLength(2);
      expect(registros.map(r=>r.fuente).sort()).toEqual([0,1]);
      if(modo==='video') {
        const video=registros.find(r=>r.fuente===1);
        expect(video.magic.startsWith('1a45dfa3')).toBe(true);
        expect(video.name).toMatch(/\.webm$/);
      }
      expect(anuncio.join(' ')).toMatch(/Se empaquetaron 2 recuerdos/);
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.getByText(/2 recuerdos seleccionados/)).toBeVisible({timeout:30000});
      await page.getByRole('button',{name:/Galer.a Completa/}).click();
      await expect(page.getByText('Recuerdo A90 1',{exact:true})).toBeVisible({timeout:30000});
    }
  } finally {
    for(const fila of filas) await db.collection('social_gallery_posts').doc(fila.id).delete();
    await db.collection('fiestas').doc(id).delete();borrarFiesta(id);
    for(const n of nombres) fs.unlinkSync(path.join(carpeta,n));fs.rmdirSync(carpeta);
  }
}

test('fotos aprobadas llegan al ZIP con bytes exactos sin cuenta ni otra fiesta',async({browser,baseURL,context,page},info)=>caso({browser,baseURL,context,page},info,'fotos'));
test('video reproducible debe conservar formato de video en el ZIP',async({browser,baseURL,context,page},info)=>caso({browser,baseURL,context,page},info,'video'));
test('si no baja ningun archivo no anuncia dos recuerdos entregados',async({browser,baseURL,context,page},info)=>caso({browser,baseURL,context,page},info,'corte'));
