// @ts-nocheck -- Sonda de aceptacion, copiar a tests/e2e SOLO en TEMP aislado.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import { createPortalSession } from '../../src/lib/security/portal-session';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== path.join(os.tmpdir(),'ak-codex88')
  || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')) throw new Error('Solo TEMP de prueba');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'portal88-'+process.pid);
const db=app.firestore(); db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>{await app.delete();});
const id = `e2e_entrega88_${process.pid}_${Date.now()}`;
const key = `clave_ficticia_${id}`;
const file = path.join(process.cwd(), 'public', `${id}.pdf`);

test('cliente abre entrega oficial, conserva enlace tras recarga y otra clave no abre el evento', async ({ page, context, browser, baseURL }, info) => {
  test.setTimeout(240000);
  const genero = await browser.newPage();
  await genero.setContent('<h1>Entrega oficial ficticia A86</h1><p>Solo prueba aislada, sin datos reales.</p>');
  const pdf = await genero.pdf({format:'A4'});
  await genero.close();
  fs.writeFileSync(file, pdf);
  const fiesta = crearFiestaDeEstaNoche({id, clavePortal:key});
  fiesta.configuracion.nombreEvento = 'Fiesta de prueba A86';
  fiesta.modulosContratados = {...fiesta.modulosContratados, fotografia:true, filmacion:true};
  fiesta.fotografiaYFilmacion = {servicios:[{id:'entrega-a86',nombre:'Album oficial A86',estado:'Entregado completo',linkEntrega:`${baseURL}/${id}.pdf`}],notasGenerales:'Solo entrega ficticia'};
  guardarFiesta(fiesta);
  await db.collection('fiestas').doc(id).set(JSON.parse(JSON.stringify(fiesta)));
  const antes = leerFiesta(id);
  await context.addCookies([{name:'ak_portal_session',value:createPortalSession(id,key),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
  await context.addInitScript(({id,key})=>sessionStorage.setItem(`portal_auth_${id}`,key),{id,key});
  try {
    await page.goto(`/portal-cliente/${id}/fotos-video`,{waitUntil:'domcontentloaded'});
    await expect(page.getByText('Album oficial A86',{exact:true})).toBeVisible({timeout:45000});
    const link=page.getByRole('link',{name:/Descargar archivos oficiales/i});
    await expect(link).toHaveAttribute('href',`${baseURL}/${id}.pdf`);
    // Headless Chromium can download a PDF instead of navigating its popup.
    const solicitudAlClick=context.waitForEvent('request',r=>r.url()===`${baseURL}/${id}.pdf`);
    await link.click();
    const solicitud=await solicitudAlClick;
    const respuesta=await context.request.get(solicitud.url());
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('application/pdf');
    expect((await respuesta.body()).equals(pdf)).toBe(true);
    await info.attach('entrega-oficial-recuperada.pdf',{body:await respuesta.body(),contentType:'application/pdf'});
    for(const otra of context.pages()) if(otra!==page) await otra.close();
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.getByText('Album oficial A86',{exact:true})).toBeVisible({timeout:30000});
    await expect(page.getByRole('link',{name:/Descargar archivos oficiales/i})).toHaveAttribute('href',`${baseURL}/${id}.pdf`);
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    const ajeno=await browser.newContext();
    await ajeno.addCookies([{name:'ak_portal_session',value:createPortalSession(`${id}_otra`,key),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
    await ajeno.addInitScript(({id})=>sessionStorage.setItem(`portal_auth_${id}`,'clave-incorrecta-a86'),{id});
    const mala=await ajeno.newPage();
    try {
      await mala.goto(`/portal-cliente/${id}/fotos-video`,{waitUntil:'domcontentloaded'});
      await expect(mala.getByText('La sesión del portal venció o no corresponde a este evento.')).toBeVisible({timeout:45000});
      await expect(mala.getByText('Album oficial A86',{exact:true})).toHaveCount(0);
      await expect(mala.getByRole('link',{name:/Descargar archivos oficiales/i})).toHaveCount(0);
    } finally {await ajeno.close();}
    expect(leerFiesta(id).fotografiaYFilmacion).toEqual(antes.fotografiaYFilmacion);
  } finally {await db.collection('fiestas').doc(id).delete();borrarFiesta(id); if(fs.existsSync(file))fs.unlinkSync(file);}
});
