// @ts-nocheck -- Documento ficticio: contenido imprimible y aislamiento, no firma legal.
import os from 'node:os';
import path from 'node:path';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {createPortalSession} from '../../src/lib/security/portal-session';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')
  ||!path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  ||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'papel88-'+process.pid);
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>{await app.delete();});
test('papel incluye inicio y fin del texto largo, otra fiesta no lee el contrato',async({page,context,browser,baseURL},info)=>{
  test.setTimeout(240000);
  const id='e2e_papel88_'+Date.now()+'_'+process.pid;const clave='solo-prueba-'+id;
  const inicio='INICIO CONTRATO FICTICIO AUDITORIA88';
  const fin='FINAL CONTRATO FICTICIO AUDITORIA88';
  const texto=[inicio,...Array.from({length:45},(_,i)=>'Clausula '+(i+1)+': Solo datos ficticios. El documento de prueba debe conservar el texto completo sin recortes ni atribuir una reserva real. Se mantienen todos los acuerdos de esta prueba.'),fin].join('\n\n');
  const fiesta=crearFiestaDeEstaNoche({id,clavePortal:clave});
  fiesta.contratoServicioTexto=texto;fiesta.contratoDatos={planPagos:{activo:false}};fiesta.estado='Presupuestada';
  delete fiesta.contratoFirmaInfo;delete fiesta.firmaDigitalConstancia;
  const ref=db.collection('fiestas').doc(id);let ajeno;
  try{
    guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));
    await context.addCookies([{name:'ak_portal_session',value:createPortalSession(id,clave),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
    await page.goto('/portal/'+id+'/contrato',{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('heading',{name:'Contrato de Servicio',exact:true})).toBeVisible({timeout:30000});
    await expect(page.getByText(texto,{exact:true})).toBeVisible();
    await page.emulateMedia({media:'print'});
    const pdf=await page.pdf({format:'A4',printBackground:true});
    expect(pdf.subarray(0,4).toString()).toBe('%PDF');
    await info.attach('contrato-papel-largo.pdf',{body:pdf,contentType:'application/pdf'});
    await page.emulateMedia({media:'screen'});
    ajeno=await browser.newContext();
    await ajeno.addCookies([{name:'ak_portal_session',value:createPortalSession(id+'_otro',clave),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
    const otra=await ajeno.newPage();await otra.goto('/portal/'+id+'/contrato',{waitUntil:'domcontentloaded'});
    await expect(otra.getByText(texto,{exact:true})).toHaveCount(0);
    await expect(otra.getByText('No pudimos cargar tu contrato',{exact:true})).toBeVisible({timeout:45000});
    expect((await ref.get()).data().estado).toBe('Presupuestada');
  }finally{await ajeno?.close();await ref.delete();borrarFiesta(id);}
});
