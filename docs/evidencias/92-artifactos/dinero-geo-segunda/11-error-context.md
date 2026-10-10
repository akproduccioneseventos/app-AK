# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 92-personal-ubicacion.spec.ts >> ubicacion obligatoria correcta
- Location: tests\e2e\92-personal-ubicacion.spec.ts:9:55

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('status').filter({ hasText: /Llegada confirmada/ })
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByRole('status').filter({ hasText: /Llegada confirmada/ })

```

```yaml
- banner:
  - img "AK Producciones"
  - img
  - heading "Personal ficticio92" [level=1]
  - paragraph: "Portal para: Fiesta de esta noche"
- img
- text: ¿Confirmás tu asistencia al evento? Por favor avisanos con tiempo para que el organizador confirme el equipo de la noche.
- button "Confirmar que voy":
  - img
  - text: Confirmar que voy
- button "No puedo ir":
  - img
  - text: No puedo ir
- img
- text: Llegada al Evento Al llegar al salón o lugar del evento, presioná el botón para avisarle al encargado.
- button "Llegué":
  - img
  - text: Llegué
- img
- text: Tu Plan de la Noche Detalles de tu asignación para "Fiesta de esta noche"
- img
- paragraph: Tu Rol
- paragraph: Colaborador
- img
- paragraph: Hora de Inicio
- paragraph: 21:00
- img
- paragraph: Ubicación
- paragraph: Club Uruguay
- paragraph: Uruguay 580, Salto
- heading "Momentos Clave de la Noche" [level=4]
- text: 22:00
- paragraph: Comienzo
- paragraph: Recepción de invitados con música suave.
- text: 22:15
- paragraph: Servicio de Entrada 1
- paragraph: Se sirve la primera tanda de bocaditos.
- text: 22:30
- paragraph: Entrada de la Quinceañera y Vals
- paragraph: Momento emotivo principal.
- text: 22:45
- paragraph: Servicio de Entrada 2
- paragraph: Segunda tanda de bocaditos.
- text: 00:00
- paragraph: ¡A Bailar!
- paragraph: Se abre la pista de baile.
- text: 01:00
- paragraph: Cena / Cierre de Barra
- paragraph: Se sirve el plato principal. La barra se cierra temporalmente.
- text: 01:45
- paragraph: Video de Vida
- paragraph: Proyección del video emotivo.
- text: 02:00
- paragraph: Reapertura de Barra y Baile
- paragraph: Continúa la fiesta.
- text: 02:30
- paragraph: Plataforma 360 / Fotocabina
- paragraph: Activación de entretenimiento fotográfico.
- text: 03:00
- paragraph: Cotillón
- paragraph: Reparto de cotillón para el carnaval carioca.
- text: 03:45
- paragraph: Fuente de Chocolate
- paragraph: Se habilita la mesa de postres o fuente de chocolate.
- text: 04:00
- paragraph: Apagado de Velas y Torta
- paragraph: Momento de cantar y cortar la torta.
- text: 05:00
- paragraph: Final de la Fiesta
- paragraph: Cierre del evento.
- text: Módulos Disponibles Haz clic en un módulo para ver los detalles relevantes para tu rol.
- link "Itinerario del Evento":
  - /url: /fiestas/nueva/itinerario/pdf?fiestaId=e2e_geo92_correcta_18048_1791650452252&token=tok_e2e_geo92_correcta_18048_1791650452252&operatorName=Personal%20ficticio92
  - img
  - paragraph: Itinerario del Evento
  - img
- contentinfo:
  - img "AK Producciones"
  - text: AK Producciones Producción Integral de Eventos • Salto, Uruguay
  - paragraph: Diseñamos bodas, 15 años y eventos empresariales inolvidables. Gastronomía gourmet, discoteca profesional, salones de gala y tecnología interactiva en un solo lugar.
  - link "Consultar disponibilidad por WhatsApp (abre en nueva ventana)":
    - /url: https://wa.me/59898355530?text=%C2%A1Hola%20AK%20Producciones!%20Quisiera%20consultar%20disponibilidad%20para%20mi%20fecha.
    - text: WhatsApp Directo
  - link "Cotizá tu Fiesta":
    - /url: /simulador-de-presupuesto
  - heading "Salones Destacados" [level=4]
  - list:
    - listitem:
      - link "Salón Club Uruguay (Exclusivo)":
        - /url: /club-uruguay
    - listitem:
      - link "Gastronomía Gourmet & Catering":
        - /url: "#landing-services"
    - listitem:
      - link "Discoteca & Pistas de Luces LED":
        - /url: "#landing-services"
    - listitem:
      - link "Plataforma 360° & Fotocabina QR":
        - /url: "#landing-technology"
  - heading "Accesos Rápidos" [level=4]
  - list:
    - listitem:
      - link "→ Simulador de Presupuesto":
        - /url: /simulador-de-presupuesto
    - listitem:
      - link "→ Galería de Eventos Reales":
        - /url: "#landing-gallery"
    - listitem:
      - link "→ Blog & Guías de Organización":
        - /url: /public/blog
    - listitem:
      - link "→ Testimonios & Preguntas Frecuentes":
        - /url: "#landing-testimonials-faq"
    - listitem:
      - link "Acceso Staff & Equipo AK":
        - /url: /login
  - heading "Oficina & Atencion" [level=4]
  - paragraph: Salto, Uruguay
  - paragraph:
    - link "+598 98 355 530":
      - /url: tel:+59898355530
  - paragraph: Coordinación presencial el día de tu celebración.
  - heading "Comunidad & Redes" [level=4]
  - paragraph: Seguinos en redes para ver coberturas en vivo, montajes reales y salones armados.
  - link "Visitar Instagram de AK Producciones (abre en nueva ventana)":
    - /url: https://www.instagram.com/akproduccionesfiestasyeventos/
  - link "Visitar Facebook de AK Producciones (abre en nueva ventana)":
    - /url: https://www.facebook.com/akproduccionessalto/
  - link "Visitar Pinterest de AK Producciones (abre en nueva ventana)":
    - /url: https://es.pinterest.com/akproduccionessalto/
  - link "Visitar WhatsApp de AK Producciones (abre en nueva ventana)":
    - /url: https://wa.me/59898355530?text=%C2%A1Hola%20AK%20Producciones!%20Quisiera%20consultar%20por%20mi%20evento.
  - link "Visitar TikTok de AK Producciones (abre en nueva ventana)":
    - /url: https://www.tiktok.com/@akproduccioneseve
  - paragraph: © 2026 AK Producciones Eventos. Todos los derechos reservados.
  - text: ·
  - paragraph:
    - text: Tus datos se tratan según la
    - link "Ley 18.331":
      - /url: /privacidad
    - text: de Protección de Datos Personales.
  - link "Club Uruguay":
    - /url: /club-uruguay
  - link "Simulador":
    - /url: /simulador-de-presupuesto
  - link "Privacidad":
    - /url: /privacidad
  - link "Acceso Staff":
    - /url: /login
- paragraph:
  - text: Tus datos se usan sólo para el trabajo en los eventos (Ley 18.331).
  - link "Privacidad":
    - /url: /privacidad
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | // @ts-nocheck -- Tres ubicaciones falsas; no prueba GPS fisico.
  2  | import os from 'node:os';import path from 'node:path';import admin from 'firebase-admin';
  3  | import {test,expect} from '@playwright/test';
  4  | import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
  5  | if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  6  |   ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88'))throw new Error('Solo TEMP demo');
  7  | const app=admin.initializeApp({projectId:'demo-ak-producciones'},'loc92-'+process.pid),db=app.firestore();
  8  | db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
  9  | for(const caso of ['correcta','fuera','denegada'])test('ubicacion obligatoria '+caso,async({browser,baseURL},info)=>{
  10 |   test.setTimeout(150000);const id='e2e_geo92_'+caso+'_'+process.pid+'_'+Date.now(),emp='emp_'+id,token='tok_'+id;
  11 |   const fiesta=crearFiestaDeEstaNoche({id});fiesta.configuracion.googleMapsUrl='https://maps.google.com/?q=-34.9065,-56.1998';
  12 |   fiesta.personalAsignado=[{empleadoId:emp,rolId:'rol_ficticio',eventSalary:0}];
  13 |   const fref=db.collection('fiestas').doc(id),aref=db.collection('json_documents').doc('accesos-personal.json'),sref=db.collection('json_documents').doc('ajustes-llegada.json');
  14 |   const prevA=await aref.get(),prevS=await sref.get();let cx;
  15 |   try{
  16 |     guardarFiesta(fiesta);await fref.set(JSON.parse(JSON.stringify(fiesta)));
  17 |     await aref.set({_filePath:'accesos-personal.json',_arrayData:[...(prevA.data()?._arrayData||[]),{id:token,nombreAcceso:'Personal ficticio92',fiestaId:id,empleadoId:emp,permisos:['itinerario'],fechaCreacion:new Date().toISOString()}]});
  18 |     await sref.set({_filePath:'ajustes-llegada.json',llegadaConUbicacion:true,radioMetros:300});
  19 |     cx=await browser.newContext({baseURL});const origin=new URL(baseURL).origin;
  20 |     if(caso!=='denegada'){await cx.grantPermissions(['geolocation'],{origin});await cx.setGeolocation(caso==='correcta'?{latitude:-34.9065,longitude:-56.1998}:{latitude:-34.8,longitude:-56.1});}
  21 |     const pg=await cx.newPage();await pg.goto('/acceso-personal/'+token,{waitUntil:'domcontentloaded'});
  22 |     const llegada=pg.getByRole('button',{name:/Llegu/});await expect(llegada).toBeVisible({timeout:60000});
  23 |     const previo=(await fref.get()).data();await llegada.click();
  24 |     if(caso==='correcta'){
> 25 |       await expect(pg.getByRole('status').filter({hasText:/Llegada confirmada/})).toBeVisible();
     |                                                                                   ^ Error: expect(locator).toBeVisible() failed
  26 |       await expect.poll(async()=>(await fref.get()).data()?.personalAsignado?.[0]?.checkInTimestamp).toBeTruthy();
  27 |       const g=(await fref.get()).data().personalAsignado[0];expect(g.checkInUbicacion).toMatchObject({lat:-34.9065,lng:-56.1998});
  28 |       await pg.reload({waitUntil:'domcontentloaded'});await expect(pg.getByText(/Tu llegada al evento ya fue confirmada/)).toBeVisible();
  29 |     }else{
  30 |       await expect(pg.getByText('No pudimos registrar tu llegada',{exact:true})).toBeVisible({timeout:20000});
  31 |       await expect(llegada).toBeEnabled();expect((await fref.get()).data()).toEqual(previo);
  32 |     }
  33 |     await info.attach('ubicacion-'+caso+'.json',{body:JSON.stringify({caso,ajuste:(await sref.get()).data(),personal:(await fref.get()).data().personalAsignado,avisos:await pg.getByRole('status').allTextContents()},null,2),contentType:'application/json'});
  34 |     await pg.screenshot({path:info.outputPath('ubicacion-'+caso+'.png'),fullPage:true});
  35 |   }finally{await cx?.close();await fref.delete();borrarFiesta(id);if(prevA.exists)await aref.set(prevA.data());else await aref.delete();if(prevS.exists)await sref.set(prevS.data());else await sref.delete();}
  36 | });
  37 | 
```