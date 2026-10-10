// @ts-nocheck -- Sonda aislada; copiar a tests/e2e SOLO en TEMP autorizado.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {ponerSesionDelEquipo,crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')
  ||!path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  ||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085') throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones',storageBucket:'demo-ak-producciones.appspot.com'},'personal91-'+process.pid);
const db=app.firestore();db.settings({ignoreUndefinedProperties:true});
const bucket=app.storage().bucket();
test.afterAll(async()=>{await app.delete();});

async function sembrar() {
  const id='e2e_personal91_'+process.pid+'_'+Date.now();
  const empleadoId='emp_'+id,otroEmpleadoId='otro_'+id,rolId='rol_'+id,otraId=id+'_otra';
  const empleados=[{id:empleadoId,nombre:'Trabajador ficticio A91',cedula:'CI-FICTICIA-A91',fechaNacimiento:'1990-01-01',rolIds:[rolId]},
    {id:otroEmpleadoId,nombre:'Otro trabajador ficticio A91',cedula:'CI-FICTICIA-B91',fechaNacimiento:'1991-01-01',rolIds:[rolId]}];
  const rol={id:rolId,nombre:'Rol ficticio A91',sueldoPorEvento:1000,porcentajeSalarioVacacional:8.33,
    porcentajeAguinaldo:8.33,porcentajeAportesPatronales:20};
  const fiesta=crearFiestaDeEstaNoche({id});fiesta.configuracion.nombreEvento='Evento principal A91';
  fiesta.configuracion.fechaEvento='2026-10-10';
  fiesta.personalAsignado=[{empleadoId,rolId,eventSalary:1000},{empleadoId:otroEmpleadoId,rolId,eventSalary:500}];
  const otra=crearFiestaDeEstaNoche({id:otraId});otra.configuracion.nombreEvento='Otro evento A91';
  otra.configuracion.fechaEvento='2026-10-09';otra.personalAsignado=[{empleadoId,rolId,eventSalary:2000}];
  const now=new Date().toISOString();
  const prev=[{id:'r_'+id+'_ajeno',fiestaId:id,empleadoId:otroEmpleadoId,monto:500,fecha:'2026-10-10',estado:'pagado',createdAt:now,updatedAt:now},
    {id:'r_'+id+'_otra',fiestaId:otraId,empleadoId,monto:2000,fecha:'',estado:'pendiente',createdAt:now,updatedAt:now}];
  const ref=db.collection('json_documents').doc('personal-recibos.json');
  const anterior=await ref.get();
  const value=anterior.exists?anterior.data():null;
  const existentes=value?._arrayData||[];
  await ref.set({_filePath:'personal-recibos.json',_arrayData:[...existentes,...prev]});
  for(const e of empleados)await db.collection('empleados').doc(e.id).set(e);
  await db.collection('roles').doc(rolId).set(rol);
  for(const f of [fiesta,otra]){guardarFiesta(f);await db.collection('fiestas').doc(f.id).set(JSON.parse(JSON.stringify(f)));}
  return {id,empleadoId,otroEmpleadoId,rolId,otraId,prev,ref,
    async limpiar(){
      for(const f of [fiesta,otra]){await db.collection('fiestas').doc(f.id).delete();borrarFiesta(f.id);}
      for(const e of empleados)await db.collection('empleados').doc(e.id).delete();
      await db.collection('roles').doc(rolId).delete();
      if(value)await ref.set(value);else await ref.delete();
      const [archivos]=await bucket.getFiles({prefix:`public-page-assets/personal-recibos/${empleadoId}/`});
      for(const a of archivos)await a.delete();
    }};
}

test('papel firmado llega al deposito, al recibo correcto y a otra sesion',async({page,context,browser,baseURL},info)=>{
  test.setTimeout(240000);
  const s=await sembrar();let otraSesion;
  try {
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto(`/empleados/${s.empleadoId}/historial`,{waitUntil:'domcontentloaded'});
    const fila=page.getByRole('row').filter({hasText:'Evento principal A91'});
    await expect(fila).toBeVisible({timeout:45000});
    await expect(fila.locator('input[type=number]')).toHaveValue('1000');
    await fila.locator('input[type=date]').fill('2026-10-10');
    await fila.getByRole('combobox').click();
    await page.getByRole('option',{name:'Pagado',exact:true}).click();
    await fila.getByRole('button',{name:'Guardar',exact:true}).click();
    await expect(page.getByText('Recibo guardado',{exact:true})).toBeVisible({timeout:30000});
    await expect.poll(async()=>{
      const filas=(await s.ref.get()).data()?._arrayData||[];
      const propio=filas.find(r=>r.fiestaId===s.id&&r.empleadoId===s.empleadoId);
      return {estado:propio?.estado,monto:propio?.monto,fecha:propio?.fecha};
    }).toEqual({estado:'pagado',monto:1000,fecha:'2026-10-10'});
    const generador=await browser.newPage();
    await generador.setContent('<h1>Recibo firmado ficticio A91</h1><p>Documento de ensayo; no representa pago real.</p>');
    const pdf=await generador.pdf({format:'A4'});await generador.close();
    await fila.locator('input[type=file]').setInputFiles({name:'recibo-ficticio-a91.pdf',mimeType:'application/pdf',buffer:pdf});
    await expect(page.getByText('Recibo firmado subido',{exact:true})).toBeVisible({timeout:30000});
    const filas=(await s.ref.get()).data()?._arrayData||[];
    const propio=filas.find(r=>r.fiestaId===s.id&&r.empleadoId===s.empleadoId);
    expect(propio.estado).toBe('firmado_subido');expect(propio.archivoNombre).toBe('recibo-ficticio-a91.pdf');
    expect(filas.filter(r=>s.prev.some(p=>p.id===r.id))).toEqual(s.prev);
    const [archivos]=await bucket.getFiles({prefix:`public-page-assets/personal-recibos/${s.empleadoId}/`});
    expect(archivos).toHaveLength(1);
    const [guardado]=await archivos[0].download();expect(guardado.equals(pdf)).toBe(true);
    const verificar=async(p)=>{
      const row=p.getByRole('row').filter({hasText:'Evento principal A91'});
      await expect(row.getByRole('link',{name:'recibo-ficticio-a91.pdf'})).toBeVisible({timeout:30000});
      await expect(row.locator('input[type=number]')).toBeDisabled();
      await expect(row.getByRole('combobox')).toContainText('Con recibo firmado');
      const ajena=p.getByRole('row').filter({hasText:'Otro evento A91'});
      await expect(ajena.getByRole('link')).toHaveCount(0);
      await expect(ajena.getByRole('combobox')).toContainText('Pendiente');
      const link=row.getByRole('link',{name:'recibo-ficticio-a91.pdf'});
      const request=p.context().waitForEvent('request',r=>r.url()===propio.archivoUrl);
      await link.click();const clicked=await request;
      const res=await p.context().request.get(clicked.url());
      expect(res.status()).toBe(200);expect(res.headers()['content-type']).toContain('application/pdf');
      expect((await res.body()).equals(pdf)).toBe(true);
      for(const popup of p.context().pages())if(popup!==p)await popup.close();
    };
    await page.reload({waitUntil:'domcontentloaded'});await verificar(page);
    otraSesion=await browser.newContext();await ponerSesionDelEquipo(otraSesion,baseURL);
    const consumidor=await otraSesion.newPage();await consumidor.goto(`/empleados/${s.empleadoId}/historial`,{waitUntil:'domcontentloaded'});
    await verificar(consumidor);
    await consumidor.goto(`/empleados/${s.otroEmpleadoId}/historial`,{waitUntil:'domcontentloaded'});
    await expect(consumidor.getByRole('row').filter({hasText:'Evento principal A91'})).toBeVisible({timeout:30000});
    await expect(consumidor.getByRole('link',{name:'recibo-ficticio-a91.pdf'})).toHaveCount(0);
    await info.attach('recibos-persistidos.json',{body:JSON.stringify(filas,null,2),contentType:'application/json'});
    await info.attach('recibo-firmado-recuperado.pdf',{body:guardado,contentType:'application/pdf'});
    await page.screenshot({path:info.outputPath('recibo-firmado.png'),fullPage:true});
  }finally{await otraSesion?.close();await s.limpiar();}
});

test('el papel de pago suma sus conceptos redondeados exactamente al total',async({page,context,baseURL},info)=>{
  test.setTimeout(240000);
  const s=await sembrar();
  try {
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto(`/fiestas/nueva/personal/recibos?fiestaId=${s.id}`,{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('heading',{name:'Recibos de Pago de Personal',exact:true})).toBeVisible({timeout:45000});
    const bloque=page.getByText('Trabajador ficticio A91',{exact:true}).locator('..').locator('..').locator('..');
    await expect(bloque.locator('input[type=number]')).toHaveValue('1000');
    const conceptos=[];
    for(const nombre of ['Sueldo Base Evento','Salario Vacacional (8.33%)','Aguinaldo (8.33%)']){
      const texto=await bloque.getByRole('row').filter({hasText:nombre}).locator('td').last().innerText();
      const importe=texto.match(/\d[\d.]*,\d{2}/)?.[0];
      if(!importe)throw new Error('Moneda no encontrada: '+texto);
      conceptos.push({nombre,texto,centavos:Math.round(Number(importe.replaceAll('.','').replace(',','.'))*100)});
    }
    await page.addInitScript(()=>{window.print=()=>{window.__pruebaImprimir91=true;};});
    // Se observa el print real sin abrir el dialogo de sistema de headless.
    await page.evaluate(()=>{window.print=()=>{window.__pruebaImprimir91=true;};});
    await page.getByRole('button',{name:'Descargar Todo (PDF)',exact:true}).click();
    expect(await page.evaluate(()=>window.__pruebaImprimir91)).toBe(true);
    const pdf=await page.pdf({format:'A4',printBackground:true});
    await info.attach('recibos-papel-real.pdf',{body:pdf,contentType:'application/pdf'});
    const suma=conceptos.reduce((s,c)=>s+c.centavos,0);
    await info.attach('desglose-papel.json',{body:JSON.stringify({conceptos,sumaCentavos:suma,totalCentavos:100000},null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath('desglose-recibo.png'),fullPage:true});
    expect(suma).toBe(100000);
  }finally{await s.limpiar();}
});

test('Reemplazar debe permitir cambiar el papel firmado sin deshacer el pago',async({page,context,browser,baseURL},info)=>{
  test.setTimeout(180000);
  const s=await sembrar();
  try {
    const gen=await browser.newPage();
    await gen.setContent('<h1>Recibo firmado anterior A91</h1>');
    const anterior=await gen.pdf({format:'A4'});
    await gen.setContent('<h1>Recibo firmado reemplazado A91</h1>');
    const nuevo=await gen.pdf({format:'A4'});await gen.close();
    const oldPath=`public-page-assets/personal-recibos/${s.empleadoId}/anterior-a91.pdf`;
    await bucket.file(oldPath).save(anterior,{metadata:{contentType:'application/pdf',metadata:{firebaseStorageDownloadTokens:'ficticio-a91'}}});
    const own={id:'r_'+s.id,fiestaId:s.id,empleadoId:s.empleadoId,monto:1000,fecha:'2026-10-10',estado:'firmado_subido',
      archivoUrl:`http://127.0.0.1:9195/v0/b/${bucket.name}/o/${encodeURIComponent(oldPath)}?alt=media&token=ficticio-a91`,
      archivoNombre:'anterior-a91.pdf',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    const datos=(await s.ref.get()).data();
    await s.ref.set({...datos,_arrayData:[...datos._arrayData,own]});
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto(`/empleados/${s.empleadoId}/historial`,{waitUntil:'domcontentloaded'});
    const fila=page.getByRole('row').filter({hasText:'Evento principal A91'});
    await expect(fila.getByRole('link',{name:'anterior-a91.pdf'})).toBeVisible({timeout:45000});
    await expect(fila.getByRole('combobox')).toContainText('Con recibo firmado');
    const chooser=page.waitForEvent('filechooser');
    await fila.getByRole('button',{name:'Reemplazar',exact:true}).click();
    await (await chooser).setFiles({name:'reemplazo-a91.pdf',mimeType:'application/pdf',buffer:nuevo});
    await expect(page.getByRole('status').filter({hasText:/Estado requerido|Recibo firmado subido|Error de subida/})).toBeVisible({timeout:30000});
    const despues=(await s.ref.get()).data()._arrayData.find(r=>r.id===own.id);
    const avisos=await page.getByRole('status').allTextContents();
    const [archivos]=await bucket.getFiles({prefix:`public-page-assets/personal-recibos/${s.empleadoId}/`});
    await info.attach('reemplazo-firmado.json',{body:JSON.stringify({antes:own,despues,avisos,archivos:archivos.map(a=>a.name)},null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath('reemplazo-rechazado.png'),fullPage:true});
    expect(despues.estado).toBe('firmado_subido');
    expect(despues.monto).toBe(1000);expect(despues.fecha).toBe('2026-10-10');
    expect(despues.archivoNombre).toBe('reemplazo-a91.pdf');
  }finally{await s.limpiar();}
});

test('fecha calendario del evento no retrocede un dia en el recibo',async({page,context,baseURL},info)=>{
  test.setTimeout(120000);
  const s=await sembrar();
  try {
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto(`/fiestas/nueva/personal/recibos?fiestaId=${s.id}`,{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('heading',{name:'Recibos de Pago de Personal',exact:true})).toBeVisible({timeout:45000});
    await expect(page.getByText('Evento principal A91',{exact:true}).first()).toBeVisible({timeout:45000});
    const header=page.locator('header').filter({hasText:'Evento principal A91'});
    const guardada=(await db.collection('fiestas').doc(s.id).get()).data().configuracion.fechaEvento;
    const visible=await header.innerText();
    const zona=await page.evaluate(()=>Intl.DateTimeFormat().resolvedOptions().timeZone);
    await info.attach('fecha-recibo.json',{body:JSON.stringify({guardada,visible,zona},null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath('fecha-recibo.png'),fullPage:false});
    expect(guardada).toBe('2026-10-10');
    await expect(header).toContainText('10 de octubre de 2026',{timeout:5000});
  }finally{await s.limpiar();}
});
