# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ak207-portal-activo.spec.ts >> AK-KNOWN-210-A8 portal activo: entrega oficial debe ser accesible
- Location: tests\e2e\ak207-portal-activo.spec.ts:65:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a[href="https://qa.invalid/album-oficial-207"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('a[href="https://qa.invalid/album-oficial-207"]')

```

```yaml
- button "Personalizar portada":
  - img
- text: Portal VIP AK Producciones
- paragraph: XV
- heading "Tecnologia Total" [level=1]
- paragraph: Bienvenido al portal demo de AK Producciones. Todo esta organizado en un solo lugar.
- paragraph: Tu fiesta
- paragraph: domingo, 8 de agosto de 2027
- paragraph: A las 21:00
- paragraph:
  - img
  - text: Club Uruguay
- paragraph: "289"
- paragraph: días
- paragraph: 20h 26m 21s
- img
- paragraph: Próximo paso
- paragraph: Saldo pendiente
- paragraph: "Saldo actual: $ 1.000."
- button "Hacer un pago":
  - img
  - text: Hacer un pago
- link "Hablar con AK":
  - /url: https://wa.me/59898355530?text=Hola%20AK%2C%20soy%20cliente%20del%20evento%20%22Tecnologia%20Total%22%20y%20quiero%20hacer%20una%20consulta.
  - img
  - text: Hablar con AK
- link "Sincronizar":
  - /url: https://calendar.google.com/calendar/render?action=TEMPLATE&text=Tecnologia+Total&dates=20270809T000000Z%2F20270809T050000Z&details=Evento+coordinado+por+AK+Producciones.&location=Club+Uruguay+-+Uruguay+580%2C+Salto
  - img
  - text: Sincronizar
- text: Recordatorio de Pago La próxima cuota de $ 500 vence el 8 jul. 2027 (en 260 días).
- main:
  - img
  - heading "Pagos" [level=3]
  - paragraph: Estado de Cuenta
  - paragraph: Saldo pendiente
  - paragraph: $ 1.000
  - img
  - img
  - heading "Menú" [level=3]
  - paragraph: Opciones y Catering
  - paragraph: Plato principal
  - paragraph: A definir
  - img
  - img
  - heading "Invitados" [level=3]
  - paragraph: Link y Confirmaciones
  - paragraph: Confirmados
  - paragraph: 121 / 158
  - img
  - heading "Organización del evento" [level=3]:
    - button "Organización del evento" [expanded]:
      - img
      - text: Organización del evento
      - img
  - region "Organización del evento":
    - img
    - paragraph: Música
    - text: Cliente participa
    - paragraph: Canciones importantes, lista de no reproducir y momentos especiales.
    - img
    - paragraph: Reuniones y videollamadas
    - text: Cliente participa
    - paragraph: Fechas, acuerdos y próximos encuentros con AK.
    - img
    - paragraph: Fotos y material
    - text: Cliente participa
    - paragraph: Fotos para video, mural social y material de la fiesta.
    - img
    - paragraph: Menú y bebidas
    - text: Solo información
    - paragraph: Menú elegido, bebidas, restricciones y datos gastronómicos.
    - img
    - paragraph: Decoración
    - text: Solo información
    - paragraph: Colores, referencias visuales y estilo del evento.
    - img
    - paragraph: Cronograma
    - text: Solo información
    - paragraph: Momentos importantes del día, ordenados por hora.
    - img
    - paragraph: Música
    - text: Cliente participa
    - paragraph: Imprescindibles
    - img
    - heading "Todavía no hay canciones imprescindibles" [level=2]
    - paragraph: Podés agregarlas desde esta misma sección cuando tengas tus favoritas.
    - paragraph: Si es posible
    - img
    - heading "Todavía no hay sugerencias" [level=2]
    - paragraph: Usá el formulario de música para compartir canciones que te gustaría escuchar.
    - paragraph: No reproducir
    - img
    - heading "No marcaste canciones para evitar" [level=2]
    - paragraph: Si hay algún tema que no querés escuchar, podés indicarlo desde el formulario de música.
    - textbox "Agregar canción importante"
    - button "Agregar":
      - img
      - text: Agregar
    - img
    - paragraph: Reuniones y videollamadas
    - text: Cliente participa
    - paragraph: Reunion de experiencia tecnologica
    - paragraph: 15 nov. 2026 · Se reviso portal, muro, barra, invitacion y pantalla LED.
    - paragraph: Reunion final operativa
    - paragraph: 15 dic. 2026 · Checklist final con responsables y pruebas de pantalla.
    - img
    - paragraph: Fotos, video y redes
    - text: Cliente participa
    - paragraph: "Video de vida activo. Fotos cargadas: 12."
    - paragraph: Entrega oficial ficticia
    - link "Abrir mural social":
      - /url: /evento/social/e2e_207_portal_1792640015968
      - img
      - text: Abrir mural social
    - img
    - paragraph: Menú y bebidas
    - text: Solo información
    - img
    - paragraph: Personalización y decoración
    - text: Solo información
    - paragraph:
      - strong: "Color principal:"
      - text: "#dc2626"
    - paragraph:
      - strong: "Tema:"
      - text: AK premium tecnologico
    - img
    - paragraph: Cronograma
    - text: Solo información
    - paragraph: 22:00
    - paragraph: Comienzo
    - paragraph: 22:15
    - paragraph: Servicio de Entrada 1
    - paragraph: 22:30
    - paragraph: Entrada de la Quinceañera y Vals
    - paragraph: 22:45
    - paragraph: Servicio de Entrada 2
    - paragraph: 00:00
    - paragraph: ¡A Bailar!
    - paragraph: 01:00
    - paragraph: Cena / Cierre de Barra
    - paragraph: 01:45
    - paragraph: Video de Vida
    - paragraph: 02:00
    - paragraph: Reapertura de Barra y Baile
    - paragraph: 02:30
    - paragraph: Plataforma 360 / Fotocabina
    - paragraph: 03:00
    - paragraph: Cotillón
    - paragraph: 03:45
    - paragraph: Fuente de Chocolate
    - paragraph: 04:00
    - paragraph: Apagado de Velas y Torta
    - paragraph: 05:00
    - paragraph: Final de la Fiesta
  - heading "Pagos, contrato y presupuesto" [level=3]:
    - button "Pagos, contrato y presupuesto" [expanded]:
      - img
      - text: Pagos, contrato y presupuesto
      - img
  - region "Pagos, contrato y presupuesto":
    - paragraph: Total contratado
    - paragraph: $ 1.000
    - paragraph: Pagado
    - paragraph: Sin monto
    - paragraph: Saldo
    - paragraph: $ 1.000
    - paragraph: En revisión
    - paragraph: "0"
    - text: Progreso de Pago 0% completado
    - paragraph: Se ha pagado Sin monto de un total de $ 1.000
    - img
    - paragraph: Recordatorio de Próximo Pago
    - paragraph:
      - text: Tu próxima cuota de
      - strong: $ 500
      - text: vence el
      - strong: 8 jul. 2027
      - text: (en
      - strong: 260 días
      - text: ).
    - img
    - paragraph: Contrato y documentos
    - text: Solo información
    - paragraph: "Contrato: pendiente"
    - img
    - heading "Todavía no hay documentos para descargar" [level=2]
    - paragraph: AK los publicará acá cuando estén listos para revisar o firmar.
    - img
    - paragraph: Informar pago
    - text: Cliente participa
    - paragraph: Banco ficticio207-1
    - paragraph: Titular207-1
    - paragraph: CUENTA-QA207-1
    - paragraph: Banco ficticio207-2
    - paragraph: Titular207-2
    - paragraph: CUENTA-QA207-2
    - paragraph: Banco ficticio207-3
    - paragraph: Titular207-3
    - paragraph: CUENTA-QA207-3
    - button "Informar pago":
      - img
      - text: Informar pago
    - img
    - paragraph: Modificaciones y Cancelaciones
    - paragraph: Solicitudes y reprogramaciones de servicios o evento
    - text: Cliente participa
    - paragraph: Podés solicitar la reprogramación de fecha del evento o la cancelación de uno o más servicios contratados de forma directa. Estas acciones requieren verificación de tu PIN/Contraseña y generarán el documento de adenda correspondiente para firma manual.
    - button "Cancelar servicios o fiesta"
    - button "Cambiar fecha del evento"
    - img
    - paragraph: Lo contratado
    - text: Solo información
    - heading "Catering (1)" [level=3]:
      - button "Catering (1)":
        - text: Catering (1)
        - img
    - img
    - paragraph: Simular más invitados
    - text: Requiere aprobación de AK Adultos a agregar
    - spinbutton "Adultos a agregar": "0"
    - text: Niños/adolescentes
    - spinbutton "Niños/adolescentes": "0"
    - paragraph:
      - text: "Extra estimado:"
      - strong: Sin monto
    - paragraph:
      - text: "Nuevo total:"
      - strong: $ 1.000
    - paragraph: Incluye ajuste anual de 15%.
    - 'textbox "Nota para AK, por ejemplo: necesito sumar 10 personas"'
    - button "Enviar solicitud":
      - img
      - text: Enviar solicitud
    - img
    - paragraph: Agregar servicio del catalogo
    - text: Requiere aprobacion de AK Servicio
    - combobox "Servicio":
      - option "20 kilos de Hielo" [selected]
      - option "Peluquería uñas y maquillaje"
      - option "Salón de fiesta - Club Uruguay"
      - option "Asador profesional"
      - option "Chef"
      - option "Mozo"
      - option "Mozo de cocina"
      - option "Portero"
      - option "Album digital"
      - option "Fuegos fríos (2 disparos)"
      - option "Invitaciones digitales"
      - option "Lluvia de burbujas"
      - option "Mesa de café"
      - option "Organizamos de la fiesta"
      - option "Pantalla gigante y proyector"
      - option "Video de vida"
      - option "Barra de tragos"
      - option "Cerveza corona por unidad"
      - option "Refrescos"
      - option "Manteleria básica (sin cubre sillas)"
      - option "Mantelería completa"
      - option "Mobiliario completo"
      - option "Vajilla Completa"
      - option "Alquiler de Centros de mesa florales"
      - option "Banner Gigantografía"
      - option "Cuadro de firmas"
      - option "Decoración Básica (atrás de la torta)"
      - option "Servicio de Decoración"
      - option "Zona de fotografía con sillón diván"
      - option "Pista Led chica"
      - option "Pista Led grande"
      - option "Vogue"
      - option "Espejo Magico Classic (tactil, firmas y stickers)"
      - option "Tótem Touch IA (personajes y estilos con inteligencia artificial)"
      - option "Fotocabina"
      - option "Fuegos fríos (4 disparos)"
      - option "Mesa de Glitter Bar"
      - option "Plataforma 360"
      - option "Filmación de exteriores"
      - option "Filmación de la fiesta"
      - option "Filmacion de la iglesia"
      - option "Filmacion de la pintada"
      - option "Filmación del civil"
      - option "Foto álbum 100 fotos"
      - option "Fotografía 2 horas"
      - option "Fotografía de exteriores"
      - option "Fotografía de la fiesta"
      - option "Fotografía de la Iglesia"
      - option "Fotografía de la pintada"
      - option "Fotografía del civil"
      - option "Candy Bar Temático"
      - option "Mesa dulce con fuente de chocolate"
      - option "Postre Brounnie"
      - option "Postre Chesecake"
      - option "Postre Chesecake de menta y chocolate"
      - option "Postre Chocomenta"
      - option "Postre Chocotorta"
      - option "Postre de Flan de coco"
      - option "Postre de mouse de chocolate"
      - option "Postre de mouse de dulce de leche"
      - option "Postre frutal"
      - option "Postre Imperial Ruso"
      - option "Postre Lemon Pie"
      - option "Postre Mouse de Chocolate"
      - option "Postre oreo"
      - option "Postre Selva negra"
      - option "Torta Principal"
    - text: Cantidad
    - spinbutton "Cantidad": "1"
    - paragraph:
      - text: "Extra ajustado:"
      - strong: $ 529
    - paragraph:
      - text: "Nuevo total estimado:"
      - strong: $ 1.529
    - paragraph: Incluye ajuste anual de 15%.
    - textbox "Nota para AK sobre este servicio"
    - button "Solicitar servicio":
      - img
      - text: Solicitar servicio
  - heading "Invitados" [level=3]:
    - button "Invitados":
      - img
      - text: Invitados
      - img
  - heading "Reglas y preguntas" [level=3]:
    - button "Reglas y preguntas":
      - img
      - text: Reglas y preguntas
      - img
  - paragraph:
    - text: Usamos tus datos sólo para contestarte y para tu evento (Ley 18.331).
    - link "Privacidad":
      - /url: /privacidad
- contentinfo:
  - img "AK Producciones"
  - text: AK Producciones Producción Integral de Eventos • Salto, Uruguay
  - paragraph: Diseñamos bodas, 15 años y eventos empresariales inolvidables. Gastronomía gourmet, discoteca profesional, salones de gala y tecnología interactiva en un solo lugar.
  - link "Consultar disponibilidad por WhatsApp (abre en nueva ventana)":
    - /url: https://wa.me/59898355530?text=%C2%A1Hola%20AK%20Producciones!%20Quisiera%20consultar%20disponibilidad%20para%20mi%20fecha.
    - text: WhatsApp Directo
  - link "Simular mi presupuesto":
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
  - heading "Oficina & Atención" [level=4]
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
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | 
  2  | import { test as __akAudit207 } from '@playwright/test';
  3  | __akAudit207.beforeEach(async ({context}, testInfo) => {
  4  |   await context.route('**/*',async route=>{const url=new URL(route.request().url());if(/^https?:$/.test(url.protocol)&&!['127.0.0.1','localhost','[::1]'].includes(url.hostname)){await testInfo.attach('qa-egress-blocked',{contentType:'text/plain',body:url.origin+url.pathname});await route.abort('blockedbyclient');}else await route.continue();});
  5  | });
  6  | import fs from 'node:fs';
  7  | import path from 'node:path';
  8  | import { expect, test } from '@playwright/test';
  9  | import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';
  10 | 
  11 | const ID=`e2e_207_portal_${Date.now()}`;
  12 | const KEY=`qa207-clave-${Date.now()}`;
  13 | const BUDGET=`e2e_207_budget_${Date.now()}`;
  14 | const fiesta=crearFiestaDeEstaNoche({id:ID,clavePortal:KEY,fechaEvento:'2027-08-08'});
  15 | Object.assign(fiesta,{presupuestoId:BUDGET,clientPaymentNotifications:[],listaMusicaPortal:{imprescindibles:[],siEsPosible:[],noQuiero:[]},
  16 |   fotografiaYFilmacion:{notasGenerales:'Entrega oficial ficticia',servicios:[{id:'qa207-album',nombre:'Album QA207',estado:'Entregado completo',linkEntrega:'https://qa.invalid/album-oficial-207'}]}});
  17 | Object.assign(fiesta.clientPortalSettings!,{enabled:true,accessKey:KEY,accessPhase:'organizacion',musica:{visible:true},menu:{visible:true},
  18 |   cuentasBancarias:[1,2,3].map(n=>({id:`qa207-bank-${n}`,banco:`Banco ficticio207-${n}`,titular:`Titular207-${n}`,numero:`CUENTA-QA207-${n}`}))});
  19 | const budget={id:BUDGET,clienteNombre:'Cliente ficticio207',clienteContacto:'099000207',eventoTipo:'Boda',eventoFecha:'2027-08-08',invitadosCantidad:25,invitadosAdultos:25,invitadosNinos:0,invitadosAdolescentes:0,
  20 |   totalConDescuento:1000,totalFinal:1000,costoTotalEstimado:1000,ajusteAnualPorcentaje:0,ajusteAnualActivo:false,estado:'Aceptado',timestamp:'2026-10-21',pagosCliente:[],
  21 |   itemsPresupuestados:[{idServicioCatalogo:'qa207-menu',nombreServicio:'Menu ficticio207',categoriaServicio:'Catering',cantidad:25,precioUnitario:40,precioUnitarioPresupuesto:40,calculationMethod:'porPersona',costoTotalItem:1000}]};
  22 | test.beforeAll(()=>{
  23 |   guardarFiesta(fiesta);
  24 |   for(const folder of ['data','src/data']){fs.mkdirSync(path.join(process.cwd(),folder),{recursive:true});fs.writeFileSync(path.join(process.cwd(),folder,'presupuestos.json'),JSON.stringify([budget]));}
  25 | });
  26 | test.afterAll(()=>borrarFiesta(ID));
  27 | test.beforeEach(async({page,context})=>{
  28 |   await page.goto(`/portal/c/${KEY}`,{waitUntil:'domcontentloaded'});
  29 |   await expect(page.getByRole('button',{name:'Personalizar portada',exact:true})).toBeVisible();
  30 |   await expect.poll(async()=> (await context.cookies()).some(c=>c.name==='ak_portal_session'),{timeout:30000}).toBe(true);
  31 | });
  32 | test('portal activo: tres bancos visibles y sin desborde',async({page},testInfo)=>{
  33 |   for(const n of [1,2,3])await expect(page.getByText(`CUENTA-QA207-${n}`,{exact:true})).toBeVisible();
  34 |   const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
  35 |   expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
  36 |   await page.screenshot({path:testInfo.outputPath('portal-activo.png'),fullPage:true});
  37 | });
  38 | test('portal activo: musica guarda en servidor y persiste tras recarga',async({page},testInfo)=>{
  39 |   const song=`Cancion real local207-${testInfo.project.name}`;
  40 |   await page.getByPlaceholder('Agregar canción importante').fill(song);
  41 |   await page.getByRole('button',{name:'Agregar',exact:true}).click();
  42 |   await expect(page.getByText('Canción agregada. AK ya la verá dentro del evento.',{exact:true})).toBeVisible();
  43 |   await expect.poll(()=>leerFiesta(ID)?.listaMusicaPortal?.imprescindibles||[]).toContain(song);
  44 |   await page.reload();await expect(page.getByText(song,{exact:true})).toBeVisible();
  45 | });
  46 | test('portal activo: portada abre y cierra con controles alcanzables',async({page},testInfo)=>{
  47 |   await page.getByRole('button',{name:'Personalizar portada',exact:true}).click();
  48 |   const close=page.getByRole('button',{name:'Cerrar',exact:true});await expect(close).toBeVisible();
  49 |   const rect=await close.boundingBox();expect(rect).not.toBeNull();expect(rect!.y).toBeGreaterThanOrEqual(0);
  50 |   expect(rect!.y+rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  51 |   await page.screenshot({path:testInfo.outputPath('portada-modal.png')});await close.click();
  52 |   await expect(close).toHaveCount(0);
  53 | });
  54 | test('portal activo: corte antes de enviar mantiene invitados y muestra error',async({page})=>{
  55 |   const adults=page.getByText('Adultos a agregar',{exact:true}).locator('input');
  56 |   await adults.fill('2');
  57 |   await page.route('**/portal/c/**',async route=>{if(route.request().method()==='POST'&&route.request().headers()['next-action'])await route.abort('internetdisconnected');else await route.continue();});
  58 |   await page.getByRole('button',{name:'Enviar solicitud',exact:true}).click();
  59 |   await expect(page.getByText('No se pudo enviar la solicitud.',{exact:true})).toBeVisible();await expect(adults).toHaveValue('2');
  60 | });
  61 | test('AK-KNOWN-210-A7 portal activo: Informar pago debe abrir formulario',async({page})=>{
  62 |   await page.getByRole('button',{name:'Informar pago',exact:true}).last().click();
  63 |   await expect(page.locator('input[type="file"]')).toBeVisible({timeout:5000});
  64 | });
  65 | test('AK-KNOWN-210-A8 portal activo: entrega oficial debe ser accesible',async({page})=>{
> 66 |   await expect(page.locator('a[href="https://qa.invalid/album-oficial-207"]')).toBeVisible({timeout:5000});
     |                                                                                ^ Error: expect(locator).toBeVisible() failed
  67 | });
  68 | 
```