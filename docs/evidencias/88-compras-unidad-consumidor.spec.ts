// @ts-nocheck -- Recetas/stock ficticios, consumidor real, SDK demo solamente.
import os from 'node:os';
import path from 'node:path';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')) throw new Error('Solo copia demo reservada');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'compras88-'+process.pid);
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>{await app.delete();});
test('compras suma 200 gramos y 2 kilos en 2.20 kg, no 202 gramos',async({page,context,baseURL},info)=>{
  test.setTimeout(180000);
  const id='e2e_compras88_'+Date.now()+'_'+process.pid;
  const ingrediente='Manteca ficticia '+id;
  const insumoId='insumo-'+id;
  const menuId='menu-'+id;
  const presupuestoId='pres-'+id;
  const platos=['dish_'+id+'_g','dish_'+id+'_kg'];
  const fiesta=crearFiestaDeEstaNoche({id});
  fiesta.presupuestoId=presupuestoId;
  fiesta.configuracion.invitadosEstimados=1;
  fiesta.bebidas={categorias:[]};fiesta.reposteria={categorias:[]};
  const menu={id:menuId,name:'Menu ficticio '+id,items:platos.map((p,i)=>({id:p,name:'Plato principal '+i,
    ingredients:[{id:'ing-'+p,name:ingrediente,quantityPerPerson:i?2:200,unit:i?'kg':'g',
      origenId:insumoId,costoUnitario:100,proveedor:'Proveedor ficticio '+id}]}))};
  const presupuesto={id:presupuestoId,clienteNombre:'Cliente ficticio',eventoTipo:'Cumpleaños',invitadosCantidad:1,
    invitadosAdultos:1,invitadosNinos:0,invitadosAdolescentes:0,costoTotalEstimado:200,totalConDescuento:200,
    timestamp:new Date().toISOString(),estado:'Aceptado',itemsPresupuestados:platos.map((p,i)=>({id:'it-'+p,
      idServicioCatalogo:p,nombreServicio:'Plato principal '+i,categoriaServicio:'Plato Principal',cantidad:1,
      precioUnitario:100,costoTotalItem:100,calculationMethod:'fijo'}))};
  const refs=[db.collection('fiestas').doc(id),db.collection('presupuestos').doc(presupuestoId),
    db.collection('menus_catering').doc(menuId),db.collection('insumos').doc(insumoId)];
  try{
    guardarFiesta(fiesta);
    await Promise.all(refs.map((r,i)=>r.set(JSON.parse(JSON.stringify([fiesta,presupuesto,menu,
      {id:insumoId,nombre:ingrediente,unidad:'kg',cantidadDisponible:0,valorUnitarioEstimado:100,proveedor:'Proveedor ficticio '+id}][i])))));
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto('/fiestas/nueva/catering/lista-compras?fiestaId='+id,{waitUntil:'domcontentloaded'});
    const row=page.getByRole('row').filter({hasText:ingrediente});
    await expect(row).toHaveCount(1,{timeout:60000});
    await info.attach('recetas-sembradas.json',{body:JSON.stringify({menu,presupuesto},null,2),contentType:'application/json'});
    await info.attach('renglon-real.txt',{body:await row.innerText(),contentType:'text/plain'});
    await page.screenshot({path:info.outputPath('compras-unidades.png'),fullPage:true});
    await expect(row.getByRole('cell').nth(1)).toHaveText('2.20');
    await expect(row.getByRole('cell').nth(2)).toHaveText(/^kg$/i);
  }finally{await Promise.all(refs.map(r=>r.delete()));borrarFiesta(id);}
});
