// @ts-nocheck -- Credencial real en navegador, revocacion solo fixture demo.
import os from 'node:os';import path from 'node:path';import admin from 'firebase-admin';
import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
import {enchufarCamaraFalsa} from './helpers/camara-falsa';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88'))throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'entrada92-'+process.pid),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
for(const modo of ['reentrada','revocada'])test('QR '+modo+' con lector real y pagina abierta',async({page,context,browser,baseURL},info)=>{
  test.setTimeout(180000);const id='q92'+modo[0]+Date.now().toString(36),gid='g'+id,token='qa92token'+Date.now().toString(36);
  const fiesta=crearFiestaDeEstaNoche({id});fiesta.invitados=[{id:gid,nombre:'Invitado ficticio A92',rsvp:'Confirmado',categoria:'Adulto',partySize:2,guestAccessToken:token,checkedIn:false}];
  const ref=db.collection('fiestas').doc(id);let cx;
  try{
    guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
    await page.goto('/invitacion/'+id+'/invitado/'+gid+'?token='+token,{waitUntil:'domcontentloaded'});
    await expect(page.getByTestId('guest-portal-qr')).toBeVisible({timeout:60000});
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    const descargaP=page.waitForEvent('download');await page.getByRole('button',{name:'Guardar QR',exact:true}).click();
    const descarga=await descargaP;const png=info.outputPath('credencial-'+modo+'.png');await descarga.saveAs(png);
    cx=await browser.newContext({baseURL});await ponerSesionDelEquipo(cx,baseURL);const op=await cx.newPage();
    await enchufarCamaraFalsa(op);await op.goto('/evento/accesos/'+id,{waitUntil:'domcontentloaded'});
    const cambiar=op.locator('#html5-qrcode-anchor-scan-type-change');await expect(cambiar).toBeVisible({timeout:60000});await cambiar.click();
    const input=op.locator('#qr-acceso-reader input[type=file]');await expect(input).toBeAttached();
    if(modo==='revocada'){
      // Revocar DESPUES de cargar tanto invitado como operador; no recargarlos.
      fiesta.invitados[0].guestAccessToken='nuevo_'+token;guardarFiesta(fiesta);await ref.update({invitados:fiesta.invitados});
      const antes=(await ref.get()).data();await input.setInputFiles(png);
      await expect.poll(async()=>await op.getByText(/ACCESO PERMITIDO|ACCESO DENEGADO|QR INV/).count()).toBeGreaterThan(0);
      const despues=(await ref.get()).data();
      await info.attach('qr-revocado.json',{body:JSON.stringify({antes,despues,lector:await op.locator('body').innerText()},null,2),contentType:'application/json'});
      await op.screenshot({path:info.outputPath('qr-revocado-lector.png')});
      expect(despues.invitados[0].checkedIn).toBe(false);expect(despues.invitados[0].checkInTimestamp).toBeUndefined();
      await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByTestId('guest-portal-qr')).toHaveCount(0);
    }else{
      await input.setInputFiles(png);await expect(op.getByText(/ACCESO PERMITIDO/)).toBeVisible({timeout:30000});
      const first=(await ref.get()).data();expect(first.invitados[0].checkedIn).toBe(true);expect(first.invitados[0].checkInTimestamp).toBeTruthy();
      await expect(op.getByText(/ACCESO PERMITIDO/)).toBeHidden({timeout:15000});
      await input.setInputFiles([]);await input.setInputFiles(png);
      await expect(op.getByText(/Este QR ya fue utilizado anteriormente/)).toBeVisible({timeout:30000});
      const second=(await ref.get()).data();expect(second.invitados).toHaveLength(1);expect(second.invitados[0].checkInTimestamp).toBe(first.invitados[0].checkInTimestamp);
      await info.attach('qr-reentrada.json',{body:JSON.stringify({primera:first.invitados,segunda:second.invitados},null,2),contentType:'application/json'});
      await op.screenshot({path:info.outputPath('qr-reentrada-lector.png')});
    }
  }finally{await cx?.close();await ref.delete();borrarFiesta(id);}
});
