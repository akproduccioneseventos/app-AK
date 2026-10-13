// @ts-nocheck -- Actual widget/API/storage; provider locally unavailable, no model output stub.
import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import {test,expect} from '@playwright/test';
import {crearFiestaDeEstaNoche,guardarFiesta,borrarFiesta,ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.basename(process.cwd())!=='ak-entorno-aislado-97'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw new Error('Demo97 only');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'qa97-'+process.pid),db=app.firestore();
db.settings({ignoreUndefinedProperties:true});test.afterAll(async()=>app.delete());
test('IA caida no inventa tarea; historial por fiesta persiste en UI y SDK',async({page,context,baseURL},info)=>{
  test.setTimeout(240000);
  const prefix='e2e_97_'+process.pid+'_'+Date.now(),ids=[prefix+'_a',prefix+'_b'];
  const fixtures=ids.map(id=>crearFiestaDeEstaNoche({id}));
  const observations=[];
  const chatsRef=db.collection('multiagent').doc('chats');
  const preguntas=ids.map((id,i)=>'Cre\u00e1 una tarea para confirmar men\u00fa, sonda IA97_'+(i?'B':'A')+' '+id);
  try{
    for(const fiesta of fixtures){guardarFiesta(fiesta);await db.collection('fiestas').doc(fiesta.id).set(JSON.parse(JSON.stringify(fiesta)));}
    await ponerSesionDelEquipo(context,baseURL);
    for(const [i,id] of ids.entries()){
      const before=(await db.collection('fiestas').doc(id).get()).data();
      await page.goto('/fiestas/nueva/tareas?fiestaId='+id,{waitUntil:'domcontentloaded'});
      await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
      const input=page.getByPlaceholder(/Hablar con/);await expect(input).toBeVisible();
      if(i)await expect(page.getByText(preguntas[0],{exact:true})).toHaveCount(0);
      await input.fill(preguntas[i]);
      const pending=page.waitForResponse(r=>r.url().endsWith('/api/multiagent/message')&&r.request().method()==='POST',{timeout:120000});
      await page.getByTitle('Enviar',{exact:true}).click();const response=await pending;
      const result=await response.json();
      const after=(await db.collection('fiestas').doc(id).get()).data();
      const saved=(await chatsRef.get()).data();const sessions=(saved?._data??saved)?.sessions||[];
      const session=sessions.find(s=>s.fiestaId===id&&s.messages.some(m=>m.content===preguntas[i]));
      observations.push({id,status:response.status(),result,beforeTasks:before?.tareas,afterTasks:after?.tareas,session});
      expect(response.status()).toBe(200);expect(result.response).toContain('La IA no est\u00e1 respondiendo ahora; esto es un resumen autom\u00e1tico de tus datos.');
      expect(result.action?.type??'none').toBe('none');expect(after?.tareas).toEqual(before?.tareas);
      expect(session).toBeTruthy();expect(session.messages.filter(m=>m.role==='user'&&m.content===preguntas[i])).toHaveLength(1);
      expect(session.messages.filter(m=>m.role==='assistant')).toHaveLength(1);
      await expect(page.getByText(/La IA no est\u00e1 respondiendo ahora;/)).toBeVisible();
      await expect(page.getByText(/Tarea creada al toque/)).toHaveCount(0);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
      await expect(page.getByText(preguntas[i],{exact:true})).toBeVisible();
      if(i)await expect(page.getByText(preguntas[0],{exact:true})).toHaveCount(0);
    }
    await page.goto('/fiestas/nueva/tareas?fiestaId='+ids[0],{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
    await expect(page.getByText(preguntas[0],{exact:true})).toBeVisible();
    await expect(page.getByText(preguntas[1],{exact:true})).toHaveCount(0);
    await info.attach('ia-final.png',{body:await page.screenshot(),contentType:'image/png'});
  }finally{
    await info.attach('ia-servidor-sdk.json',{body:JSON.stringify(observations,null,2),contentType:'application/json'});
    for(const id of ids){await db.collection('fiestas').doc(id).delete();borrarFiesta(id);}
    for(const c of ['multiagent','json_documents'])for(const doc of (await db.collection(c).get()).docs){
      const data=doc.data(),state=data._data??data;
      if(Array.isArray(state.sessions)){
        const filtered=state.sessions.filter(s=>!ids.includes(s.fiestaId));
        if(filtered.length!==state.sessions.length)await doc.ref.set(data._data?{...data,_data:{...state,sessions:filtered}}:{...data,sessions:filtered});
      }
    }
  }
});

test('respaldo de ESTA fiesta no mezcla otro evento',async({page,context,baseURL},info)=>{
  test.setTimeout(120000);
  const prefix='e2e_97_scope_'+process.pid+'_'+Date.now(),ids=[prefix+'_a',prefix+'_b'];
  const fixtures=ids.map(id=>crearFiestaDeEstaNoche({id}));
  fixtures[0].configuracion.nombreEvento='QA97_ACTUAL_'+prefix;
  fixtures[0].configuracion.fechaEvento='2099-10-11';
  fixtures[1].configuracion.nombreEvento='QA97_AJENA_'+prefix;
  fixtures[1].configuracion.fechaEvento='2026-10-09';
  let observation;
  try{
    for(const f of fixtures){guardarFiesta(f);await db.collection('fiestas').doc(f.id).set(JSON.parse(JSON.stringify(f)));}
    await ponerSesionDelEquipo(context,baseURL);
    await page.goto('/fiestas/nueva/tareas?fiestaId='+ids[0],{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
    await page.getByPlaceholder(/Hablar con/).fill('Qu\u00e9 le falta a ESTA fiesta, sonda alcance '+prefix);
    const pending=page.waitForResponse(r=>r.url().endsWith('/api/multiagent/message')&&r.request().method()==='POST',{timeout:90000});
    await page.getByTitle('Enviar',{exact:true}).click();const response=await pending;
    const result=await response.json(),request=response.request().postDataJSON();
    observation={ids,actual:fixtures[0].configuracion.nombreEvento,ajena:fixtures[1].configuracion.nombreEvento,request,result};
    await info.attach('alcance-real.json',{body:JSON.stringify(observation,null,2),contentType:'application/json'});
    await info.attach('alcance-real.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(request.fiestaId).toBe(ids[0]);expect(result.agentType).toBe('fiesta');
    expect(result.response).toContain('La IA no est\u00e1 respondiendo ahora;');
    expect(result.response).not.toContain(fixtures[1].configuracion.nombreEvento);
  }finally{
    for(const id of ids){await db.collection('fiestas').doc(id).delete();borrarFiesta(id);}
    const ref=db.collection('multiagent').doc('chats'),doc=await ref.get();
    if(doc.exists){const data=doc.data(),state=data._data??data;
      const sessions=(state.sessions||[]).filter(s=>!ids.includes(s.fiestaId));
      await ref.set(data._data?{...data,_data:{...state,sessions}}:{...data,sessions});}
  }
});
