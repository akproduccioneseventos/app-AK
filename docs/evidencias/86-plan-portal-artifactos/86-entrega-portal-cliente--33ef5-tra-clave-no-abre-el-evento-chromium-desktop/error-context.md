# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 86-entrega-portal.spec.ts >> cliente abre entrega oficial, conserva enlace tras recarga y otra clave no abre el evento
- Location: tests\e2e\86-entrega-portal.spec.ts:15:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Album oficial A86', { exact: true })
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByText('Album oficial A86', { exact: true })

```

```yaml
- banner:
  - button:
    - img
  - paragraph: 📸 Fotos & Video
  - paragraph: Fiesta de prueba A86
- main:
  - heading "📸 Recuerdos & Entregables" [level=1]
  - paragraph: Accedé a todo el material digital de tu fiesta
  - img
  - heading "Álbum Digital Oficial" [level=3]
  - paragraph: Todo el material fotográfico y recuerdos aprobados de tu fiesta listos para ver y compartir con tu familia por WhatsApp.
  - link "Ver Álbum Oficial":
    - /url: /evento/album/e2e_entrega86_11708_1791591149024
    - button "Ver Álbum Oficial":
      - img
      - text: Ver Álbum Oficial
  - link "Compartir con Invitados":
    - /url: /evento/album/e2e_entrega86_11708_1791591149024
    - button "Compartir con Invitados":
      - img
      - text: Compartir con Invitados
  - img
  - heading "Tu video de la fiesta" [level=3]
  - paragraph: Montaje vertical cinematográfico de 60 a 90 segundos con las mejores fotos, música de fondo y efecto Ken Burns.
  - button "Ver y Compartir":
    - img
    - text: Ver y Compartir
  - button "Descargar Video":
    - img
    - text: Descargar Video
  - heading "Recuerdos Sociales de Invitados" [level=2]
  - img
  - paragraph: Fotos de los Invitados
  - paragraph: 0 fotos compartidas en el muro
  - link "Descargar":
    - /url: /evento/album/e2e_entrega86_11708_1791591149024
    - button "Descargar":
      - img
      - text: Descargar
  - heading "Servicios de Fotografía & Filmación Oficial" [level=2]
  - paragraph: Aún no hay servicios de fotografía o filmación oficiales registrados.
  - text: 📝 Notas Generales
  - paragraph: Solo entrega ficticia
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | // @ts-nocheck -- Sonda de aceptacion, copiar a tests/e2e SOLO en TEMP aislado.
  2  | import fs from 'node:fs';
  3  | import path from 'node:path';
  4  | import os from 'node:os';
  5  | import { test, expect } from '@playwright/test';
  6  | import { createPortalSession } from '../../src/lib/security/portal-session';
  7  | import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';
  8  | 
  9  | if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== os.tmpdir()
  10 |   || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')) throw new Error('Solo TEMP de prueba');
  11 | const id = `e2e_entrega86_${process.pid}_${Date.now()}`;
  12 | const key = `clave_ficticia_${id}`;
  13 | const file = path.join(process.cwd(), 'public', `${id}.pdf`);
  14 | 
  15 | test('cliente abre entrega oficial, conserva enlace tras recarga y otra clave no abre el evento', async ({ page, context, browser, baseURL }, info) => {
  16 |   test.setTimeout(120000);
  17 |   const genero = await browser.newPage();
  18 |   await genero.setContent('<h1>Entrega oficial ficticia A86</h1><p>Solo prueba aislada, sin datos reales.</p>');
  19 |   const pdf = await genero.pdf({format:'A4'});
  20 |   await genero.close();
  21 |   fs.writeFileSync(file, pdf);
  22 |   const fiesta = crearFiestaDeEstaNoche({id, clavePortal:key});
  23 |   fiesta.configuracion.nombreEvento = 'Fiesta de prueba A86';
  24 |   fiesta.modulosContratados = {...fiesta.modulosContratados, fotografia:true, filmacion:true};
  25 |   fiesta.fotografiaYFilmacion = {servicios:[{id:'entrega-a86',nombre:'Album oficial A86',estado:'Entregado completo',linkEntrega:`${baseURL}/${id}.pdf`}],notasGenerales:'Solo entrega ficticia'};
  26 |   guardarFiesta(fiesta);
  27 |   const antes = leerFiesta(id);
  28 |   await context.addCookies([{name:'ak_portal_session',value:createPortalSession(id,key),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
  29 |   await context.addInitScript(({id,key})=>sessionStorage.setItem(`portal_auth_${id}`,key),{id,key});
  30 |   try {
  31 |     await page.goto(`/portal-cliente/${id}/fotos-video`,{waitUntil:'domcontentloaded'});
> 32 |     await expect(page.getByText('Album oficial A86',{exact:true})).toBeVisible({timeout:45000});
     |                                                                    ^ Error: expect(locator).toBeVisible() failed
  33 |     const link=page.getByRole('link',{name:/Descargar archivos oficiales/i});
  34 |     await expect(link).toHaveAttribute('href',`${baseURL}/${id}.pdf`);
  35 |     const abrir=page.waitForEvent('popup');
  36 |     await link.click();
  37 |     const entrega=await abrir;
  38 |     await expect(entrega).toHaveURL(`${baseURL}/${id}.pdf`);
  39 |     const respuesta=await entrega.request.get(entrega.url());
  40 |     expect(respuesta.status()).toBe(200);
  41 |     expect(respuesta.headers()['content-type']).toContain('application/pdf');
  42 |     expect((await respuesta.body()).equals(pdf)).toBe(true);
  43 |     await info.attach('entrega-oficial-recuperada.pdf',{body:await respuesta.body(),contentType:'application/pdf'});
  44 |     await entrega.close();
  45 |     await page.reload({waitUntil:'domcontentloaded'});
  46 |     await expect(page.getByText('Album oficial A86',{exact:true})).toBeVisible({timeout:30000});
  47 |     await expect(page.getByRole('link',{name:/Descargar archivos oficiales/i})).toHaveAttribute('href',`${baseURL}/${id}.pdf`);
  48 |     expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
  49 |     const ajeno=await browser.newContext();
  50 |     await ajeno.addCookies([{name:'ak_portal_session',value:createPortalSession(`${id}_otra`,key),url:baseURL,httpOnly:true,sameSite:'Lax'}]);
  51 |     await ajeno.addInitScript(({id})=>sessionStorage.setItem(`portal_auth_${id}`,'clave-incorrecta-a86'),{id});
  52 |     const mala=await ajeno.newPage();
  53 |     try {
  54 |       await mala.goto(`/portal-cliente/${id}/fotos-video`,{waitUntil:'domcontentloaded'});
  55 |       await expect(mala.getByText('La sesión del portal venció o no corresponde a este evento.')).toBeVisible({timeout:45000});
  56 |       await expect(mala.getByText('Album oficial A86',{exact:true})).toHaveCount(0);
  57 |       await expect(mala.getByRole('link',{name:/Descargar archivos oficiales/i})).toHaveCount(0);
  58 |     } finally {await ajeno.close();}
  59 |     expect(leerFiesta(id).fotografiaYFilmacion).toEqual(antes.fotografiaYFilmacion);
  60 |   } finally {borrarFiesta(id); if(fs.existsSync(file))fs.unlinkSync(file);}
  61 | });
  62 | 
```