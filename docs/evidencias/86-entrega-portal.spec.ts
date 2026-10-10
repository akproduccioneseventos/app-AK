// @ts-nocheck -- Sonda de aceptacion, copiar a tests/e2e SOLO en TEMP aislado.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { test, expect } from '@playwright/test';
import { createPortalSession } from '../../src/lib/security/portal-session';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== os.tmpdir()
  || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')) throw new Error('Solo TEMP de prueba');
const id = `e2e_entrega86_${process.pid}_${Date.now()}`;
const key = `clave_ficticia_${id}`;
const file = path.join(process.cwd(), 'public', `${id}.pdf`);

test('cliente abre entrega oficial, conserva enlace tras recarga y otra clave no abre el evento', async ({ page, context, browser, baseURL }, info) => {
  test.setTimeout(120000);
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
  const antes = leerFiesta(id);
  await context.addCookies([{name:'ak_portal_session',value:createPortalSession(id,key),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
  await context.addInitScript(({id,key})=>sessionStorage.setItem(`portal_auth_${id}`,key),{id,key});
  try {
    await page.goto(`/portal-cliente/${id}/fotos-video`,{waitUntil:'domcontentloaded'});
    await expect(page.getByText('Album oficial A86',{exact:true})).toBeVisible({timeout:45000});
    const link=page.getByRole('link',{name:/Descargar archivos oficiales/i});
    await expect(link).toHaveAttribute('href',`${baseURL}/${id}.pdf`);
    const abrir=page.waitForEvent('popup');
    await link.click();
    const entrega=await abrir;
    await expect(entrega).toHaveURL(`${baseURL}/${id}.pdf`);
    const respuesta=await entrega.request.get(entrega.url());
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('application/pdf');
    expect((await respuesta.body()).equals(pdf)).toBe(true);
    await info.attach('entrega-oficial-recuperada.pdf',{body:await respuesta.body(),contentType:'application/pdf'});
    await entrega.close();
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
  } finally {borrarFiesta(id); if(fs.existsSync(file))fs.unlinkSync(file);}
});
