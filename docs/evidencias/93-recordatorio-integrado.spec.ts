// @ts-nocheck -- Backend real de prueba, sin cuentas Gmail/Meta ni envios.
import os from 'node:os';
import path from 'node:path';
import {test,expect} from '@playwright/test';
import admin from 'firebase-admin';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
import {getUruguayParts} from '../../src/lib/utils';
if(process.env.AK_ENTORNO_AISLADO!=='true'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085'||
process.env.FIREBASE_PROJECT_ID!=='demo-ak-producciones'||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88'))throw new Error('Solo demo TEMP');
if(process.env.META_WHATSAPP_TOKEN||process.env.GOOGLE_SERVICE_ACCOUNT_KEY)throw new Error('Sin proveedores reales');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'recordatorio93-'+process.pid);const db=app.firestore();
test.afterAll(async()=>app.delete());
test('recordatorio sin proveedor prepara un mensaje real y tres llamadas no lo duplican',async({context,baseURL},info)=>{
  test.setTimeout(180000);const id='e2e_recordatorio93_'+process.pid+'_'+Date.now();const fiesta=crearFiestaDeEstaNoche({id});
  const fecha=getUruguayParts(new Date(Date.now()+21*86400000));
  fiesta.configuracion.fechaEvento=`${fecha.year}-${String(fecha.month).padStart(2,'0')}-${String(fecha.day).padStart(2,'0')}`;
  fiesta.invitados=[{id:'guest_'+id,nombre:'Invitado ficticio93',rsvp:'Pendiente',contacto:'000000000',guestAccessToken:'qa93'}];
  const ref=db.collection('fiestas').doc(id);const results=[];
  try{
    guardarFiesta(fiesta);await ref.set(JSON.parse(JSON.stringify(fiesta)));await ponerSesionDelEquipo(context,baseURL);
    for(let i=0;i<3;i++){
      const r=await context.request.get('/api/cron/recordar-invitacion-no-abierta',{timeout:60000});results.push({status:r.status(),body:await r.json()});expect(r.status()).toBe(200);
    }
    const rows=await db.collection('scheduled_messages').where('fiestaId','==',id).get();expect(rows.size).toBe(1);
    const message=rows.docs[0].data();expect(message.status).toBe('pendiente');expect(message.sendingMode).toBe('manual_click');expect(message.messageText).toContain(id);
    const saved=(await ref.get()).data();expect(saved.invitados[0].recordatoriosApertura).toHaveLength(1);
    expect(results.every(r=>r.body.enviados===0)).toBe(true);
    await info.attach('recordatorio-persistido.json',{body:JSON.stringify({results,message,guest:saved.invitados[0]},null,2),contentType:'application/json'});
  }finally{
    await info.attach('resultado.json',{body:JSON.stringify({results,fiesta:(await ref.get()).data()},null,2),contentType:'application/json'});
    const rows=await db.collection('scheduled_messages').where('fiestaId','==',id).get();await Promise.all(rows.docs.map(d=>d.ref.delete()));await ref.delete();borrarFiesta(id);
  }
});
