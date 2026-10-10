// @ts-nocheck -- Sonda aislada; copiar a tests/e2e SOLO en TEMP autorizado.
import os from 'node:os';
import path from 'node:path';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88'))throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'dinero92-'+process.pid);
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>app.delete());

test('catering contratado llega a cocina compras y pago persistido',async({page,context,browser,baseURL},info)=>{
  test.setTimeout(300000);
  const id='e2e_catering92_'+process.pid+'_'+Date.now(),menuId='menu_'+id,presId='pres_'+id;
  const nombres=['Principal adultos A92','Infantil A92','Entrada todos A92'];
  const categorias=['Plato Principal','Menu Infantil','Entrada'];
  const cantidades=[20,8,28],recetas=[0.25,0.2,0.1],precios=[100,50,20];
  const proveedor='Proveedor ficticio A92 '+id;
  const insumos=nombres.map((n,i)=>({id:'ins_'+id+'_'+i,nombre:'Ingrediente '+n,unidad:'kg',cantidadDisponible:0,valorUnitarioEstimado:precios[i],proveedor}));
  const platos=nombres.map((n,i)=>({id:'dish_'+id+'_'+i,name:n,ingredients:[{id:'ing_'+id+'_'+i,name:insumos[i].nombre,
    quantityPerPerson:recetas[i],unit:'kg',origenId:insumos[i].id,costoUnitario:precios[i],proveedor}]}));
  const menu={id:menuId,name:'Menu aprobado A92',items:platos};
  const menuControl={...menu,id:menuId+'_control',name:'Menu control A92'};
  const presupuesto={id:presId,clienteNombre:'Cliente ficticio A92',eventoTipo:'Cumpleanos',invitadosCantidad:28,invitadosAdultos:20,
    invitadosNinos:5,invitadosAdolescentes:3,costoTotalEstimado:2800,totalConDescuento:2800,timestamp:new Date().toISOString(),estado:'Aceptado',
    itemsPresupuestados:platos.map((p,i)=>({id:'it_'+p.id,idServicioCatalogo:p.id,nombreServicio:p.name,categoriaServicio:categorias[i],
      cantidad:cantidades[i],precioUnitario:100,costoTotalItem:100*cantidades[i],calculationMethod:'por_persona'}))};
  const fiesta=crearFiestaDeEstaNoche({id});fiesta.presupuestoId=presId;fiesta.configuracion.nombreEvento='Catering integrado A92';
  fiesta.configuracion.invitadosEstimados=28;fiesta.reposteria={categorias:[]};fiesta.bebidas={categorias:[]};
  fiesta.invitados=[{id:'g_'+id,nombre:'Familia ficticia A92',rsvp:'Confirmado',partySize:3,categoria:'Adulto',
    dietaryRestriction:'Celiaco',alergiasEspecificas:'Sin gluten; utensilios separados'},
    {id:'p_'+id,nombre:'Familia pendiente A92',rsvp:'Pendiente',partySize:7,categoria:'Adulto',dietaryRestriction:'Celiaco'}];
  const refs=[db.collection('fiestas').doc(id),db.collection('presupuestos').doc(presId),db.collection('menus_catering').doc(menuId),
    ...insumos.map(i=>db.collection('insumos').doc(i.id)),db.collection('menus_catering').doc(menuControl.id)];let consumidor;
  const diagnostico=[];page.on('pageerror',e=>diagnostico.push({error:e.message}));page.on('framenavigated',f=>{if(f===page.mainFrame())diagnostico.push({url:f.url()});});
  try{
    guardarFiesta(fiesta);await Promise.all(refs.map((r,i)=>r.set(JSON.parse(JSON.stringify([fiesta,presupuesto,menu,...insumos,menuControl][i])))));
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto('/fiestas/nueva/catering?fiestaId='+id,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#menu-select')).toBeVisible({timeout:60000});
    await page.locator('#menu-select').click();await page.getByRole('option',{name:menuControl.name,exact:true}).click();
    await expect.poll(async()=>(await refs[0].get()).data()?.menuAsignadoId).toBe(menuControl.id);
    await page.locator('#menu-select').click();await page.getByRole('option',{name:menu.name,exact:true}).click();
    await expect.poll(async()=>(await refs[0].get()).data()?.menuAsignadoId).toBe(menuId);
    await info.attach('menu-y-fiesta-persistidos.json',{body:JSON.stringify({fiesta:(await refs[0].get()).data(),presupuesto:(await refs[1].get()).data()},null,2),contentType:'application/json'});
    await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#menu-select')).toContainText(menu.name);
    await page.getByRole('link',{name:'Hoja de cocina',exact:true}).click();
    const cocina=page.getByRole('heading',{name:'Catering integrado A92',exact:true});
    try{await expect(cocina).toBeVisible({timeout:15000});}catch{
      await info.attach('cocina-antes-recarga.png',{body:await page.screenshot(),contentType:'image/png'});
      await page.goto('/fiestas/nueva/catering/hoja-de-cocina?fiestaId='+id,{waitUntil:'domcontentloaded'});await expect(cocina).toBeVisible({timeout:60000});
      await info.attach('cocina-control-recarga.txt',{body:'La navegacion Link no completo en15s; la recarga directa si. No demuestra causa.',contentType:'text/plain'});
    }
    const cantidadesReales=[];
    for(let i=0;i<nombres.length;i++){
      const row=page.getByRole('row').filter({hasText:nombres[i]});
      await expect(row.locator('td').last()).toContainText(String(cantidades[i]));
      cantidadesReales.push(await row.innerText());
    }
    const especial=page.locator('li').filter({hasText:'Celiaco'});
    await expect(especial).toContainText('Sin gluten; utensilios separados');
    await expect(especial.locator('span')).toHaveText('3');
    await info.attach('cocina-real.json',{body:JSON.stringify({cantidadesReales,especial:await especial.innerText()},null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath('cocina-integrada.png'),fullPage:true});
    await page.goto('/fiestas/nueva/catering/lista-compras?fiestaId='+id,{waitUntil:'domcontentloaded'});
    const datos=[];
    for(let i=0;i<insumos.length;i++){
      const row=page.getByRole('row').filter({hasText:insumos[i].nombre});await expect(row).toHaveCount(1,{timeout:60000});
      await expect(row.getByRole('cell').nth(1)).toHaveText((recetas[i]*cantidades[i]).toFixed(2));
      await expect(row.getByRole('cell').nth(2)).toHaveText(/^kg$/i);
      const texto=await row.getByRole('cell').last().innerText();
      const numero=Number(texto.replace(/[^\d,]/g,'').replace(',','.'));
      const esperado=Math.ceil(recetas[i]*cantidades[i])*precios[i];expect(numero).toBe(esperado);
      datos.push({ingrediente:insumos[i].nombre,necesario:recetas[i]*cantidades[i],comprar:Math.ceil(recetas[i]*cantidades[i]),costo:numero});
    }
    expect(datos.reduce((s,d)=>s+d.costo,0)).toBe(660);
    await page.getByRole('switch',{name:'PEDIDO',exact:true}).click();
    await expect.poll(async()=>(await refs[0].get()).data()?.estadosCompra?.[0]?.pedido).toBe(true);
    await page.getByRole('switch',{name:'PAGADO TOTAL',exact:true}).click();
    await expect.poll(async()=>(await refs[0].get()).data()?.estadosCompra?.[0]?.pagado).toBe(true);
    const guardado=(await refs[0].get()).data();
    expect(guardado.invitados).toEqual(fiesta.invitados);expect(guardado.menuAsignadoId).toBe(menuId);
    await info.attach('compra-y-pago-real.json',{body:JSON.stringify({datos,estadosCompra:guardado.estadosCompra,menuAsignadoId:guardado.menuAsignadoId},null,2),contentType:'application/json'});
    consumidor=await browser.newContext();await ponerSesionDelEquipo(consumidor,baseURL);
    const otra=await consumidor.newPage();await otra.goto('/fiestas/nueva/catering/lista-compras?fiestaId='+id,{waitUntil:'domcontentloaded'});
    await expect(otra.getByRole('switch',{name:'PEDIDO',exact:true})).toBeChecked({timeout:60000});
    await expect(otra.getByRole('switch',{name:'PAGADO TOTAL',exact:true})).toBeChecked();
    await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('switch',{name:'PAGADO TOTAL',exact:true})).toBeChecked();
    await page.screenshot({path:info.outputPath('compras-pagadas.png'),fullPage:true});
  }finally{await info.attach('catering-diagnostico.json',{body:JSON.stringify({url:page.url(),diagnostico,fiesta:(await refs[0].get()).data()},null,2),contentType:'application/json'});await consumidor?.close();await Promise.all(refs.map(r=>r.delete()));borrarFiesta(id);}
});

test('impresion conjunta conserva tres recibos y filtro por empleado',async({page,context,baseURL},info)=>{
  test.setTimeout(240000);
  const id='e2e_recibos92_'+process.pid+'_'+Date.now(),a='emp_'+id,b='otro_'+id,rol='rol_'+id;
  const e1={id:a,nombre:'Empleado A92 <texto literal>',cedula:'FICTICIA A',rolIds:[rol]},e2={id:b,nombre:'Otro empleado B92',cedula:'FICTICIA B',rolIds:[rol]};
  const fiesta=crearFiestaDeEstaNoche({id});fiesta.configuracion.nombreEvento='Evento uno A92';
  fiesta.personalAsignado=[{empleadoId:a,rolId:rol,eventSalary:1000},{empleadoId:b,rolId:rol,eventSalary:500}];
  const otra=crearFiestaDeEstaNoche({id:id+'_otra'});otra.configuracion.nombreEvento='Evento dos A92';
  otra.personalAsignado=[{empleadoId:a,rolId:rol,eventSalary:2000}];
  const refs=[db.collection('fiestas').doc(id),db.collection('fiestas').doc(otra.id),db.collection('empleados').doc(a),db.collection('empleados').doc(b),db.collection('roles').doc(rol)];
  const values=[fiesta,otra,e1,e2,{id:rol,nombre:'Rol ficticio92',sueldoPorEvento:1000,porcentajeSalarioVacacional:0,porcentajeAguinaldo:0,porcentajeAportesPatronales:0}];
  try{
    guardarFiesta(fiesta);guardarFiesta(otra);await Promise.all(refs.map((r,i)=>r.set(JSON.parse(JSON.stringify(values[i])))));
    await ponerSesionDelEquipo(context,baseURL);await page.goto('/fiestas/nueva/personal/recibos?fiestaId='+id,{waitUntil:'domcontentloaded'});
    // Evitar cierre200ms de popup en headless; observar papel, no impresora OS.
    await page.evaluate(()=>{const abrir=window.open.bind(window);window.open=(...args)=>{const w=abrir(...args);if(w){w.print=()=>{w.__print92=true;};w.close=()=>{};}return w;};});
    const btn=page.getByRole('button',{name:'Imprimir recibos de todas las fiestas',exact:true});await expect(btn).toBeVisible({timeout:60000});
    await expect(page.getByRole('combobox')).toContainText('Todos los empleados');
    const capture=async(nombre,expected)=>{
      const popupPromise=page.waitForEvent('popup');await btn.click();const popup=await popupPromise;
      try{
        await expect(popup.locator('section.receipt-page')).toHaveCount(expected,{timeout:10000});
        const texto=await popup.locator('body').innerText();
        expect(texto).toContain('Evento uno A92');expect(texto).toContain('Evento dos A92');expect(texto).toContain(e1.nombre);
        expect(texto).toContain('1.000,00');expect(texto).toContain('2.000,00');
        if(expected===3)expect(texto).toContain(e2.nombre);else expect(texto).not.toContain(e2.nombre);
        await info.attach(nombre+'.txt',{body:texto,contentType:'text/plain'});
        await info.attach(nombre+'.pdf',{body:await popup.pdf({format:'A4',printBackground:true}),contentType:'application/pdf'});
        await popup.screenshot({path:info.outputPath(nombre+'.png'),fullPage:true});
      }finally{await popup.close();}
    };
    await capture('recibos-todas',3);
    await page.getByRole('combobox').click();await page.getByRole('option',{name:e1.nombre,exact:true}).click();
    await capture('recibos-filtrados',2);
    const saved=await Promise.all(refs.slice(0,2).map(async r=>(await r.get()).data()));
    expect(saved[0].personalAsignado).toEqual(fiesta.personalAsignado);expect(saved[1].personalAsignado).toEqual(otra.personalAsignado);
  }finally{await Promise.all(refs.map(r=>r.delete()));borrarFiesta(id);borrarFiesta(otra.id);}
});
