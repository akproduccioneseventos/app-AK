// @ts-nocheck -- isolated QA evidence, no product changes.
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.basename(process.cwd())!=='ak-entorno-aislado-101'||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw Error('Demo101 only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'mural101-'+process.pid),db=app.firestore();
db.settings({ignoreUndefinedProperties:true}); test.afterAll(async()=>app.delete());
for(const withPhoto of [false,true])test('Mural painted without CSS override: '+(withPhoto?'approved photo':'genuine empty'),async({page},info)=>{
  test.setTimeout(180000);
  const id='e2e_101_mural_'+process.pid+'_'+Date.now(),fiesta=crearFiestaDeEstaNoche({id});
  fiesta.socialWallEnabled=true;
  fiesta.socialGallerySettings={...fiesta.socialGallerySettings,enabled:true,privateDedicationsMode:false,forcedScreenItem:'mural'};
  guardarFiesta(fiesta); await db.collection('fiestas').doc(id).set(JSON.parse(JSON.stringify(fiesta)));
  const post=db.collection('social_gallery_posts').doc('e2e_101_post_'+id);
  const photoUrl='/media/catalogo-servicios/barra-tragos-ak-01.jpeg';
  if(withPhoto)await post.set({id:post.id,fiestaId:id,imageUrl:photoUrl,authorName:'Invitado ficticio QA101',caption:'Foto aprobada QA101',timestamp:new Date(Date.now()-60000).toISOString(),approved:true,moderationStatus:'approved',mediaType:'image',likes:0});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    expect((await page.goto('/evento/muro-en-vivo/'+id,{waitUntil:'domcontentloaded'}))?.status()).toBe(200);
    const content=withPhoto?page.locator('.ak-live-stage img[src*="barra-tragos-ak-01"]:not([class*="blur"])').first():page.getByTestId('live-wall-empty');
    await expect(content).toBeVisible({timeout:60000});await page.waitForTimeout(4000);
    const measure=await page.evaluate(({withPhoto})=>{
      const root=document.querySelector('.ak-live-stage'),content=withPhoto?document.querySelector('.ak-live-stage img[src*="barra-tragos-ak-01"]:not([class*="blur"])'):document.querySelector('[data-testid="live-wall-empty"]');
      let panel=content;while(panel&&panel.parentElement!==root)panel=panel.parentElement;
      const title=withPhoto?content:content?.querySelector('h1,h2'),rect=e=>{const r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null;};
      const r=title?.getBoundingClientRect(),top=r?document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,r.x+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.y+r.height/2))):null;
      return {viewport:{w:innerWidth,h:innerHeight},root:rect(root),position:root?getComputedStyle(root).position:null,panel:rect(panel),content:rect(content),contentClass:content?.className,contentFilter:content?getComputedStyle(content).filter:null,title:rect(title),pointReceives:!!title&&!!top&&(title===top||title.contains(top)),natural:withPhoto?content?.naturalWidth:null,opacity:content?getComputedStyle(content).opacity:null};
    },{withPhoto});
    await info.attach('mural-measured.json',{body:JSON.stringify({id,withPhoto,measure,errors,fixtureExists:(await db.collection('fiestas').doc(id).get()).exists,postExists:(await post.get()).exists},null,2),contentType:'application/json'});
    await info.attach('mural-painted.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(measure.position).toBe('fixed');expect(measure.root.h).toBeGreaterThanOrEqual(measure.viewport.h*0.9);expect(measure.panel.h).toBeGreaterThan(300);
    // Photo captions can legitimately receive the point above a painted image.
    if(!withPhoto)expect(measure.pointReceives).toBe(true);expect(errors).toEqual([]);
    if(withPhoto){expect(measure.natural).toBeGreaterThan(0);expect(Number(measure.opacity)).toBeGreaterThan(0);expect(Math.min(measure.content.x+measure.content.w,measure.viewport.w)-Math.max(0,measure.content.x)).toBeGreaterThan(50);expect(Math.min(measure.content.y+measure.content.h,measure.viewport.h)-Math.max(0,measure.content.y)).toBeGreaterThan(50);}
  }finally{await post.delete();await db.collection('fiestas').doc(id).delete();borrarFiesta(id);}
});
