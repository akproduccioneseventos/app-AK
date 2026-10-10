# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 88-compras-unidad-consumidor.spec.ts >> compras suma 200 gramos y 2 kilos en 2.20 kg, no 202 gramos
- Location: tests\e2e\88-compras-unidad-consumidor.spec.ts:12:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('row').filter({ hasText: 'Manteca ficticia e2e_compras88_1791637037741_6700' }).getByRole('cell').nth(1)
Expected: "2.20"
Received: "202.00"
Timeout:  45000ms

Call log:
  - Expect "toHaveText" with timeout 45000ms
  - waiting for getByRole('row').filter({ hasText: 'Manteca ficticia e2e_compras88_1791637037741_6700' }).getByRole('cell').nth(1)
    91 × locator resolved to <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right font-black text-slate-800">202.00</td>
       - unexpected value "202.00"

```

```yaml
- cell "202.00"
```

# Test source

```ts
  1  | // @ts-nocheck -- Recetas/stock ficticios, consumidor real, SDK demo solamente.
  2  | import os from 'node:os';
  3  | import path from 'node:path';
  4  | import {test,expect} from '@playwright/test';
  5  | import admin from 'firebase-admin';
  6  | import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
  7  | if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'
  8  |   ||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')) throw new Error('Solo copia demo reservada');
  9  | const app=admin.initializeApp({projectId:'demo-ak-producciones'},'compras88-'+process.pid);
  10 | const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
  11 | test.afterAll(async()=>{await app.delete();});
  12 | test('compras suma 200 gramos y 2 kilos en 2.20 kg, no 202 gramos',async({page,context,baseURL},info)=>{
  13 |   test.setTimeout(180000);
  14 |   const id='e2e_compras88_'+Date.now()+'_'+process.pid;
  15 |   const ingrediente='Manteca ficticia '+id;
  16 |   const insumoId='insumo-'+id;
  17 |   const menuId='menu-'+id;
  18 |   const presupuestoId='pres-'+id;
  19 |   const platos=['dish_'+id+'_g','dish_'+id+'_kg'];
  20 |   const fiesta=crearFiestaDeEstaNoche({id});
  21 |   fiesta.presupuestoId=presupuestoId;
  22 |   fiesta.configuracion.invitadosEstimados=1;
  23 |   fiesta.bebidas={categorias:[]};fiesta.reposteria={categorias:[]};
  24 |   const menu={id:menuId,name:'Menu ficticio '+id,items:platos.map((p,i)=>({id:p,name:'Plato principal '+i,
  25 |     ingredients:[{id:'ing-'+p,name:ingrediente,quantityPerPerson:i?2:200,unit:i?'kg':'g',
  26 |       origenId:insumoId,costoUnitario:100,proveedor:'Proveedor ficticio '+id}]}))};
  27 |   const presupuesto={id:presupuestoId,clienteNombre:'Cliente ficticio',eventoTipo:'Cumpleaños',invitadosCantidad:1,
  28 |     invitadosAdultos:1,invitadosNinos:0,invitadosAdolescentes:0,costoTotalEstimado:200,totalConDescuento:200,
  29 |     timestamp:new Date().toISOString(),estado:'Aceptado',itemsPresupuestados:platos.map((p,i)=>({id:'it-'+p,
  30 |       idServicioCatalogo:p,nombreServicio:'Plato principal '+i,categoriaServicio:'Plato Principal',cantidad:1,
  31 |       precioUnitario:100,costoTotalItem:100,calculationMethod:'fijo'}))};
  32 |   const refs=[db.collection('fiestas').doc(id),db.collection('presupuestos').doc(presupuestoId),
  33 |     db.collection('menus_catering').doc(menuId),db.collection('insumos').doc(insumoId)];
  34 |   try{
  35 |     guardarFiesta(fiesta);
  36 |     await Promise.all(refs.map((r,i)=>r.set(JSON.parse(JSON.stringify([fiesta,presupuesto,menu,
  37 |       {id:insumoId,nombre:ingrediente,unidad:'kg',cantidadDisponible:0,valorUnitarioEstimado:100,proveedor:'Proveedor ficticio '+id}][i])))));
  38 |     await ponerSesionDelEquipo(context,baseURL);
  39 |     await page.goto('/fiestas/nueva/catering/lista-compras?fiestaId='+id,{waitUntil:'domcontentloaded'});
  40 |     const row=page.getByRole('row').filter({hasText:ingrediente});
  41 |     await expect(row).toHaveCount(1,{timeout:60000});
  42 |     await info.attach('recetas-sembradas.json',{body:JSON.stringify({menu,presupuesto},null,2),contentType:'application/json'});
  43 |     await info.attach('renglon-real.txt',{body:await row.innerText(),contentType:'text/plain'});
  44 |     await page.screenshot({path:info.outputPath('compras-unidades.png'),fullPage:true});
> 45 |     await expect(row.getByRole('cell').nth(1)).toHaveText('2.20');
     |                                                ^ Error: expect(locator).toHaveText(expected) failed
  46 |     await expect(row.getByRole('cell').nth(2)).toHaveText(/^kg$/i);
  47 |   }finally{await Promise.all(refs.map(r=>r.delete()));borrarFiesta(id);}
  48 | });
  49 |
```
