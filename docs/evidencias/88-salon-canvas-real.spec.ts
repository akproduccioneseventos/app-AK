// @ts-nocheck -- Se exige canvas real y pixeles; una foto de respaldo NO aprueba 3D.
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {createPortalSession} from '../../src/lib/security/portal-session';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')
  ||!path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  ||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'salon88-'+process.pid);
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>{await app.delete();});
test('cliente ve canvas no vacio y girar cambia realmente el dibujo',async({page,context,baseURL},info)=>{
  test.setTimeout(180000);const id='e2e_salon88_'+Date.now()+'_'+process.pid;const clave='clave-'+id;
  const fiesta=crearFiestaDeEstaNoche({id,clavePortal:clave});
  fiesta.decoracion={...fiesta.decoracion,salonWidth:20,salonHeight:15,pixelsPerMeter:40,
    salonElements:[
      {id:'mesa88',type:'element',category:'Mesa Redonda',name:'Mesa 88',x:200,y:200,width:80,height:80,rotation:0},
      {id:'pista88',type:'area',category:'Pista de Baile',name:'Pista 88',x:400,y:300,width:150,height:150,rotation:0},
      {id:'barra88',type:'area',category:'Barra',name:'Barra 88',x:50,y:200,width:160,height:60,rotation:90}]};
  const ref=db.collection('fiestas').doc(id);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try{
    guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
    await context.addCookies([{name:'ak_portal_session',value:createPortalSession(id,clave),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
    await page.goto('/portal/'+id+'/decoracion',{waitUntil:'domcontentloaded'});
    const section=page.getByTestId('seccion-salon-3d');
    await expect(section).toBeVisible({timeout:30000});
    const webgl=await page.evaluate(()=>!!document.createElement('canvas').getContext('webgl'));
    await info.attach('capacidad-y-errores.json',{body:JSON.stringify({webgl,errors},null,2),contentType:'application/json'});
    test.skip(!webgl,'Navegador sin WebGL: no acepta ni refuta el dibujo real.');
    const canvas=section.locator('canvas');await expect(canvas).toBeVisible({timeout:25000});
    const box=await canvas.boundingBox();expect(box.width).toBeGreaterThan(200);expect(box.height).toBeGreaterThan(200);
    await page.waitForTimeout(1500);
    const before=await canvas.screenshot();
    const colorCount=await page.evaluate(async(encoded)=>{
      const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
      const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
      const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;
      const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);
      const data=ctx.getImageData(0,0,c.width,c.height).data;const colors=new Set();
      for(let i=0;i<data.length;i+=16)colors.add(data[i]+','+data[i+1]+','+data[i+2]);
      bitmap.close();return colors.size;
    },before.toString('base64'));
    expect(colorCount,'canvas de un solo color no prueba el salon').toBeGreaterThan(30);
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+20,{steps:12});await page.mouse.up();
    await page.waitForTimeout(1000);const after=await canvas.screenshot();
    await info.attach('salon-antes.png',{body:before,contentType:'image/png'});
    await info.attach('salon-girado.png',{body:after,contentType:'image/png'});
    expect(crypto.createHash('sha256').update(after).digest('hex')).not.toBe(crypto.createHash('sha256').update(before).digest('hex'));
    await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByTestId('seccion-salon-3d').locator('canvas')).toBeVisible({timeout:25000});
    expect((await ref.get()).data().decoracion.salonElements).toEqual(fiesta.decoracion.salonElements);
  }finally{await ref.delete();borrarFiesta(id);}
});
