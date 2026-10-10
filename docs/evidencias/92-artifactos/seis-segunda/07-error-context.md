# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 92-catering-recibos.spec.ts >> catering contratado llega a cocina compras y pago persistido
- Location: tests\e2e\92-catering-recibos.spec.ts:13:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Catering integrado A92', exact: true })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for getByRole('heading', { name: 'Catering integrado A92', exact: true })

```

```yaml
- link "Logo de la Empresa":
  - /url: /admin
  - img "Logo de la Empresa"
- list:
  - listitem:
    - link "Centro de Control":
      - /url: /admin
      - img
      - text: Centro de Control
- text: Mi Día ☀️
- list:
  - listitem:
    - link "Mi Día":
      - /url: /mi-dia
      - img
      - text: Mi Día
- text: Fiestas 🎉
- list:
  - listitem:
    - link "Eventos Activos":
      - /url: /eventos
      - img
      - text: Eventos Activos
  - listitem:
    - link "Calendario":
      - /url: /calendario
      - img
      - text: Calendario
  - listitem:
    - link "Muro Social":
      - /url: /empresa/red-social-eventos
      - img
      - text: Muro Social
  - listitem:
    - link "Incidentes":
      - /url: /incidentes
      - img
      - text: Incidentes
  - listitem:
    - link "Guias de Armado":
      - /url: /playbooks
      - img
      - text: Guias de Armado
  - listitem:
    - link "Alergias y Dietas":
      - /url: /fiestas/nueva/alergias
      - img
      - text: Alergias y Dietas
  - listitem:
    - link "Portal de Proveedores":
      - /url: /fiestas/nueva/proveedores-portal
      - img
      - text: Portal de Proveedores
  - listitem:
    - link "Personal en dos fiestas":
      - /url: /recursos-multi-evento
      - img
      - text: Personal en dos fiestas
- text: La Empresa 🏢
- list:
  - listitem:
    - link "Gestión de Empresa":
      - /url: /empresa
      - img
      - text: Gestión de Empresa
  - text: Vender
  - listitem:
    - link "Prospectos":
      - /url: /contabilidad/crm
      - img
      - text: Prospectos
  - listitem:
    - link "Presupuestos":
      - /url: /presupuestos/nuevo
      - img
      - text: Presupuestos
  - listitem:
    - link "Clientes":
      - /url: /customers
      - img
      - text: Clientes
  - listitem:
    - link "Simulador IA":
      - /url: /simulador-ak
      - img
      - text: Simulador IA
  - text: Plata
  - listitem:
    - link "Pagos Rápidos":
      - /url: /pagos-rapidos
      - img
      - text: Pagos Rápidos
  - listitem:
    - link "Panel Contable":
      - /url: /empresa/contabilidad
      - img
      - text: Panel Contable
  - listitem:
    - link "Facturas":
      - /url: /invoices
      - img
      - text: Facturas
  - listitem:
    - link "Cambios a Aprobar":
      - /url: /aprobaciones
      - img
      - text: Cambios a Aprobar
  - listitem:
    - link "Métricas del Negocio":
      - /url: /empresa/dashboard
      - img
      - text: Métricas del Negocio
  - text: Recursos
  - listitem:
    - link "Comida / Menús":
      - /url: /empresa/menus
      - img
      - text: Comida / Menús
  - listitem:
    - link "Lista de Compras":
      - /url: /compras
      - img
      - text: Lista de Compras
  - listitem:
    - link "Salones":
      - /url: /empresa/salones
      - img
      - text: Salones
  - listitem:
    - link "Catálogo de Servicios":
      - /url: /empresa/servicios
      - img
      - text: Catálogo de Servicios
  - listitem:
    - link "Proveedores":
      - /url: /proveedores
      - img
      - text: Proveedores
  - listitem:
    - link "Empleados":
      - /url: /empleados
      - img
      - text: Empleados
  - text: Marketing
  - listitem:
    - link "Marketing y Difusión":
      - /url: /empresa/marketing
      - img
      - text: Marketing y Difusión
  - listitem:
    - link "Redes Sociales":
      - /url: /empresa/redes-sociales
      - img
      - text: Redes Sociales
  - listitem:
    - link "WhatsApp del Día":
      - /url: /contabilidad/crm/outbox
      - img
      - text: WhatsApp del Día
  - listitem:
    - link "Rendimiento Anuncios":
      - /url: /contabilidad/crm/marketing-ads
      - img
      - text: Rendimiento Anuncios
  - listitem:
    - link "Presentación LED":
      - /url: /empresa/presentacion-led/configuracion
      - img
      - text: Presentación LED
- text: Configuración ⚙️
- list:
  - listitem:
    - link "Ajustes Generales":
      - /url: /settings
      - img
      - text: Ajustes Generales
  - listitem:
    - link "Tareas Automáticas":
      - /url: /settings/tareas-automaticas
      - img
      - text: Tareas Automáticas
  - listitem:
    - link "Conexiones":
      - /url: /settings/sincronizaciones
      - img
      - text: Conexiones
  - listitem:
    - link "WhatsApp":
      - /url: /settings/whatsapp
      - img
      - text: WhatsApp
  - listitem:
    - link "Cláusulas de Contrato":
      - /url: /settings/contratos/clausulas
      - img
      - text: Cláusulas de Contrato
  - listitem:
    - link "Seguridad":
      - /url: /settings/account
      - img
      - text: Seguridad
  - listitem:
    - link "Promociones":
      - /url: /settings/promos
      - img
      - text: Promociones
  - listitem:
    - link "Asistente IA":
      - /url: /settings/ai-assistant
      - img
      - text: Asistente IA
  - listitem:
    - link "Mapa Tecnológico":
      - /url: /settings/mapa-tecnologico-ak
      - img
      - text: Mapa Tecnológico
  - listitem:
    - link "Laboratorio Experimental":
      - /url: /settings/feature-flags
      - img
      - text: Laboratorio Experimental
- list:
  - listitem:
    - link "Alertas 2":
      - /url: /alertas
      - img
      - text: Alertas 2
- main:
  - img
  - heading "Catering y Menú del Evento" [level=1]
  - link "Ingreso/Egreso Rápido":
    - /url: /pagos-rapidos
    - button "Ingreso/Egreso Rápido":
      - img
      - text: Ingreso/Egreso Rápido
  - button "Abrir notificaciones":
    - img
    - text: Abrir notificaciones
  - button
  - main:
    - img
    - heading "Gastronomía del Evento" [level=1]
    - text: Resumen de Invitados Base para el cálculo automático de cantidades e insumos.
    - button "Sincronizar":
      - img
      - text: Sincronizar
    - paragraph: Adultos
    - paragraph: "0"
    - paragraph: Niños/Adol.
    - paragraph: "0"
    - paragraph: Total
    - paragraph: "0"
    - paragraph:
      - img
      - text: Los cambios se guardan automáticamente al modificar menús, bebidas o repostería.
    - link "Hoja de cocina":
      - /url: /fiestas/nueva/catering/hoja-de-cocina?fiestaId=e2e_catering92_16164_1791651231846
      - img
      - text: Hoja de cocina
    - link "Ver Lista de Compras":
      - /url: /fiestas/nueva/catering/lista-compras?fiestaId=e2e_catering92_16164_1791651231846
      - img
      - text: Ver Lista de Compras
    - img
- navigation "Navegacion del modulo":
  - button "Volver":
    - img
  - button "Ir al panel principal":
    - img
- button "Abrir Asistente IA AK":
  - img
- button "Mover el asistente":
  - img
- button "Bruno Responsable general de fiesta":
  - img
  - text: Bruno Responsable general de fiesta
- link "Personalizar asistentes":
  - /url: /settings/asistentes-contextuales
  - img
- link "Ver sincronizaciones":
  - /url: /settings/sincronizaciones
  - img
- button "Minimizar el asistente":
  - img
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1   | // @ts-nocheck -- Sonda aislada; copiar a tests/e2e SOLO en TEMP autorizado.
  2   | import os from 'node:os';
  3   | import path from 'node:path';
  4   | import {test,expect} from '@playwright/test';
  5   | import admin from 'firebase-admin';
  6   | import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
  7   | if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  8   |   ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88'))throw new Error('Solo TEMP demo');
  9   | const app=admin.initializeApp({projectId:'demo-ak-producciones'},'dinero92-'+process.pid);
  10  | const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
  11  | test.afterAll(async()=>app.delete());
  12  | 
  13  | test('catering contratado llega a cocina compras y pago persistido',async({page,context,browser,baseURL},info)=>{
  14  |   test.setTimeout(300000);
  15  |   const id='e2e_catering92_'+process.pid+'_'+Date.now(),menuId='menu_'+id,presId='pres_'+id;
  16  |   const nombres=['Principal adultos A92','Infantil A92','Entrada todos A92'];
  17  |   const categorias=['Plato Principal','Menu Infantil','Entrada'];
  18  |   const cantidades=[20,8,28],recetas=[0.25,0.2,0.1],precios=[100,50,20];
  19  |   const proveedor='Proveedor ficticio A92 '+id;
  20  |   const insumos=nombres.map((n,i)=>({id:'ins_'+id+'_'+i,nombre:'Ingrediente '+n,unidad:'kg',cantidadDisponible:0,valorUnitarioEstimado:precios[i],proveedor}));
  21  |   const platos=nombres.map((n,i)=>({id:'dish_'+id+'_'+i,name:n,ingredients:[{id:'ing_'+id+'_'+i,name:insumos[i].nombre,
  22  |     quantityPerPerson:recetas[i],unit:'kg',origenId:insumos[i].id,costoUnitario:precios[i],proveedor}]}));
  23  |   const menu={id:menuId,name:'Menu aprobado A92',items:platos};
  24  |   const presupuesto={id:presId,clienteNombre:'Cliente ficticio A92',eventoTipo:'Cumpleanos',invitadosCantidad:28,invitadosAdultos:20,
  25  |     invitadosNinos:5,invitadosAdolescentes:3,costoTotalEstimado:2800,totalConDescuento:2800,timestamp:new Date().toISOString(),estado:'Aceptado',
  26  |     itemsPresupuestados:platos.map((p,i)=>({id:'it_'+p.id,idServicioCatalogo:p.id,nombreServicio:p.name,categoriaServicio:categorias[i],
  27  |       cantidad:cantidades[i],precioUnitario:100,costoTotalItem:100*cantidades[i],calculationMethod:'por_persona'}))};
  28  |   const fiesta=crearFiestaDeEstaNoche({id});fiesta.presupuestoId=presId;fiesta.configuracion.nombreEvento='Catering integrado A92';
  29  |   fiesta.configuracion.invitadosEstimados=28;fiesta.reposteria={categorias:[]};fiesta.bebidas={categorias:[]};
  30  |   fiesta.invitados=[{id:'g_'+id,nombre:'Familia ficticia A92',rsvp:'Confirmado',partySize:3,categoria:'Adulto',
  31  |     dietaryRestriction:'Celiaco',alergiasEspecificas:'Sin gluten; utensilios separados'},
  32  |     {id:'p_'+id,nombre:'Familia pendiente A92',rsvp:'Pendiente',partySize:7,categoria:'Adulto',dietaryRestriction:'Celiaco'}];
  33  |   const refs=[db.collection('fiestas').doc(id),db.collection('presupuestos').doc(presId),db.collection('menus_catering').doc(menuId),
  34  |     ...insumos.map(i=>db.collection('insumos').doc(i.id))];let consumidor;
  35  |   try{
  36  |     guardarFiesta(fiesta);await Promise.all(refs.map((r,i)=>r.set(JSON.parse(JSON.stringify([fiesta,presupuesto,menu,...insumos][i])))));
  37  |     await ponerSesionDelEquipo(context,baseURL);
  38  |     await page.goto('/fiestas/nueva/catering?fiestaId='+id,{waitUntil:'domcontentloaded'});
  39  |     await expect(page.locator('#menu-select')).toBeVisible({timeout:60000});
  40  |     await page.locator('#menu-select').click();await page.getByRole('option',{name:'Ninguno',exact:true}).click();
  41  |     await expect(page.getByRole('status').filter({hasText:/actualizado autom/})).toBeVisible();
  42  |     await page.locator('#menu-select').click();await page.getByRole('option',{name:menu.name,exact:true}).click();
  43  |     await expect.poll(async()=>(await refs[0].get()).data()?.menuAsignadoId).toBe(menuId);
  44  |     await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#menu-select')).toContainText(menu.name);
  45  |     await page.getByRole('link',{name:'Hoja de cocina',exact:true}).click();
  46  |     const cocina=page.getByRole('heading',{name:'Catering integrado A92',exact:true});
  47  |     try{await expect(cocina).toBeVisible({timeout:15000});}catch{
  48  |       await info.attach('cocina-antes-recarga.png',{body:await page.screenshot(),contentType:'image/png'});
> 49  |       await page.reload({waitUntil:'domcontentloaded'});await expect(cocina).toBeVisible({timeout:60000});
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  50  |       await info.attach('cocina-control-recarga.txt',{body:'La navegacion Link no completo en15s; la recarga directa si. No demuestra causa.',contentType:'text/plain'});
  51  |     }
  52  |     const cantidadesReales=[];
  53  |     for(let i=0;i<nombres.length;i++){
  54  |       const row=page.getByRole('row').filter({hasText:nombres[i]});
  55  |       await expect(row.locator('td').last()).toContainText(String(cantidades[i]));
  56  |       cantidadesReales.push(await row.innerText());
  57  |     }
  58  |     const especial=page.locator('li').filter({hasText:'Celiaco'});
  59  |     await expect(especial).toContainText('Sin gluten; utensilios separados');
  60  |     await expect(especial.locator('span')).toHaveText('3');
  61  |     await info.attach('cocina-real.json',{body:JSON.stringify({cantidadesReales,especial:await especial.innerText()},null,2),contentType:'application/json'});
  62  |     await page.screenshot({path:info.outputPath('cocina-integrada.png'),fullPage:true});
  63  |     await page.goto('/fiestas/nueva/catering/lista-compras?fiestaId='+id,{waitUntil:'domcontentloaded'});
  64  |     const datos=[];
  65  |     for(let i=0;i<insumos.length;i++){
  66  |       const row=page.getByRole('row').filter({hasText:insumos[i].nombre});await expect(row).toHaveCount(1,{timeout:60000});
  67  |       await expect(row.getByRole('cell').nth(1)).toHaveText((recetas[i]*cantidades[i]).toFixed(2));
  68  |       await expect(row.getByRole('cell').nth(2)).toHaveText(/^kg$/i);
  69  |       const texto=await row.getByRole('cell').last().innerText();
  70  |       const numero=Number(texto.replace(/[^\d,]/g,'').replace(',','.'));
  71  |       const esperado=Math.ceil(recetas[i]*cantidades[i])*precios[i];expect(numero).toBe(esperado);
  72  |       datos.push({ingrediente:insumos[i].nombre,necesario:recetas[i]*cantidades[i],comprar:Math.ceil(recetas[i]*cantidades[i]),costo:numero});
  73  |     }
  74  |     expect(datos.reduce((s,d)=>s+d.costo,0)).toBe(660);
  75  |     await page.getByRole('switch',{name:'PEDIDO',exact:true}).click();
  76  |     await expect.poll(async()=>(await refs[0].get()).data()?.estadosCompra?.[0]?.pedido).toBe(true);
  77  |     await page.getByRole('switch',{name:'PAGADO TOTAL',exact:true}).click();
  78  |     await expect.poll(async()=>(await refs[0].get()).data()?.estadosCompra?.[0]?.pagado).toBe(true);
  79  |     const guardado=(await refs[0].get()).data();
  80  |     expect(guardado.invitados).toEqual(fiesta.invitados);expect(guardado.menuAsignadoId).toBe(menuId);
  81  |     await info.attach('compra-y-pago-real.json',{body:JSON.stringify({datos,estadosCompra:guardado.estadosCompra,menuAsignadoId:guardado.menuAsignadoId},null,2),contentType:'application/json'});
  82  |     consumidor=await browser.newContext();await ponerSesionDelEquipo(consumidor,baseURL);
  83  |     const otra=await consumidor.newPage();await otra.goto('/fiestas/nueva/catering/lista-compras?fiestaId='+id,{waitUntil:'domcontentloaded'});
  84  |     await expect(otra.getByRole('switch',{name:'PEDIDO',exact:true})).toBeChecked({timeout:60000});
  85  |     await expect(otra.getByRole('switch',{name:'PAGADO TOTAL',exact:true})).toBeChecked();
  86  |     await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('switch',{name:'PAGADO TOTAL',exact:true})).toBeChecked();
  87  |     await page.screenshot({path:info.outputPath('compras-pagadas.png'),fullPage:true});
  88  |   }finally{await consumidor?.close();await Promise.all(refs.map(r=>r.delete()));borrarFiesta(id);}
  89  | });
  90  | 
  91  | test('impresion conjunta conserva tres recibos y filtro por empleado',async({page,context,baseURL},info)=>{
  92  |   test.setTimeout(240000);
  93  |   const id='e2e_recibos92_'+process.pid+'_'+Date.now(),a='emp_'+id,b='otro_'+id,rol='rol_'+id;
  94  |   const e1={id:a,nombre:'Empleado A92 <texto literal>',cedula:'FICTICIA A',rolIds:[rol]},e2={id:b,nombre:'Otro empleado B92',cedula:'FICTICIA B',rolIds:[rol]};
  95  |   const fiesta=crearFiestaDeEstaNoche({id});fiesta.configuracion.nombreEvento='Evento uno A92';
  96  |   fiesta.personalAsignado=[{empleadoId:a,rolId:rol,eventSalary:1000},{empleadoId:b,rolId:rol,eventSalary:500}];
  97  |   const otra=crearFiestaDeEstaNoche({id:id+'_otra'});otra.configuracion.nombreEvento='Evento dos A92';
  98  |   otra.personalAsignado=[{empleadoId:a,rolId:rol,eventSalary:2000}];
  99  |   const refs=[db.collection('fiestas').doc(id),db.collection('fiestas').doc(otra.id),db.collection('empleados').doc(a),db.collection('empleados').doc(b),db.collection('roles').doc(rol)];
  100 |   const values=[fiesta,otra,e1,e2,{id:rol,nombre:'Rol ficticio92',sueldoPorEvento:1000,porcentajeSalarioVacacional:0,porcentajeAguinaldo:0,porcentajeAportesPatronales:0}];
  101 |   try{
  102 |     guardarFiesta(fiesta);guardarFiesta(otra);await Promise.all(refs.map((r,i)=>r.set(JSON.parse(JSON.stringify(values[i])))));
  103 |     await ponerSesionDelEquipo(context,baseURL);await page.goto('/fiestas/nueva/personal/recibos?fiestaId='+id,{waitUntil:'domcontentloaded'});
  104 |     // Evitar cierre200ms de popup en headless; observar papel, no impresora OS.
  105 |     await page.evaluate(()=>{const abrir=window.open.bind(window);window.open=(...args)=>{const w=abrir(...args);if(w){w.print=()=>{w.__print92=true;};w.close=()=>{};}return w;};});
  106 |     const btn=page.getByRole('button',{name:'Imprimir recibos de todas las fiestas',exact:true});await expect(btn).toBeVisible({timeout:60000});
  107 |     await expect(page.getByRole('combobox')).toContainText('Todos los empleados');
  108 |     const capture=async(nombre,expected)=>{
  109 |       const popupPromise=page.waitForEvent('popup');await btn.click();const popup=await popupPromise;
  110 |       try{
  111 |         await expect(popup.locator('section.receipt-page')).toHaveCount(expected,{timeout:10000});
  112 |         const texto=await popup.locator('body').innerText();
  113 |         expect(texto).toContain('Evento uno A92');expect(texto).toContain('Evento dos A92');expect(texto).toContain(e1.nombre);
  114 |         expect(texto).toContain('1.000,00');expect(texto).toContain('2.000,00');
  115 |         if(expected===3)expect(texto).toContain(e2.nombre);else expect(texto).not.toContain(e2.nombre);
  116 |         await info.attach(nombre+'.txt',{body:texto,contentType:'text/plain'});
  117 |         await info.attach(nombre+'.pdf',{body:await popup.pdf({format:'A4',printBackground:true}),contentType:'application/pdf'});
  118 |         await popup.screenshot({path:info.outputPath(nombre+'.png'),fullPage:true});
  119 |       }finally{await popup.close();}
  120 |     };
  121 |     await capture('recibos-todas',3);
  122 |     await page.getByRole('combobox').click();await page.getByRole('option',{name:e1.nombre,exact:true}).click();
  123 |     await capture('recibos-filtrados',2);
  124 |     const saved=await Promise.all(refs.slice(0,2).map(async r=>(await r.get()).data()));
  125 |     expect(saved[0].personalAsignado).toEqual(fiesta.personalAsignado);expect(saved[1].personalAsignado).toEqual(otra.personalAsignado);
  126 |   }finally{await Promise.all(refs.map(r=>r.delete()));borrarFiesta(id);borrarFiesta(otra.id);}
  127 | });
  128 | 
```