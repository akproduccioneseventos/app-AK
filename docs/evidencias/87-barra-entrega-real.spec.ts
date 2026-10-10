// @ts-nocheck -- Copied into tests/e2e, real UI and SDK, only owned demo fixtures.
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { borrarFiesta, crearFiestaDeEstaNoche, ponerSesionDelEquipo, guardarFiesta } from './helpers/fiesta-de-prueba';

if (path.dirname(process.cwd()) !== os.tmpdir()
  || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  || process.env.AK_ENTORNO_AISLADO !== 'true'
  || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085'
  || process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones') throw new Error('Solo TEMP aislado + emulador demo');

const app = initializeApp({projectId:'demo-ak-producciones'}, 'barra87-' + process.pid);
const db = getFirestore(app);
db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>{ await deleteApp(app); });

test('invitado pide, barman prepara/listo/entrega, reload y stock final; otra fiesta intacta', async({page,context,baseURL,browser},info)=>{
  test.setTimeout(120000);
  const suffix = Date.now() + '_' + process.pid;
  const fiesta = crearFiestaDeEstaNoche({id:'e2e_barra87_' + suffix});
  fiesta.modulosContratados.barraTecnologica = true;
  fiesta.others = {...fiesta.others, barraTecnologica:{settings:{enabled:true,openingTime:'',closingTime:''},orders:[]}};
  const invitado = fiesta.invitados[0];
  const insumoId = 'e2e_barra87_insumo_' + suffix;
  const trago = {id:'custom_87_' + suffix,nombre:'Trago sonda87 ' + suffix,stockDisponible:20,ingredientes:['Limon sonda'],
    recetaIngredientes:[{insumoId,cantidad:25,unidad:'ml'}]};
  fiesta.cartaTragos.items = [trago];
  const stockRef = db.collection('insumos').doc(insumoId);
  const fiestaRef = db.collection('fiestas').doc(fiesta.id);
  const otroId = 'bar87_otro_' + suffix;
  const other = {id:otroId,fiestaId:'e2e_otra_barra87_' + suffix,drinkId:trago.id,drinkName:'OTRO pedido ' + suffix,
    guestName:'OTRO invitado ' + suffix,status:'nuevo',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),source:'touchscreen'};
  const otherRef = db.collection('bar_drink_orders').doc(otroId);
  const staff = await browser.newContext();
  let orderId;
  try {
    guardarFiesta(fiesta);
    await fiestaRef.set(JSON.parse(JSON.stringify(fiesta)));
    await stockRef.set({id:insumoId,nombre:'Insumo sonda87',cantidadDisponible:1000,unidad:'ml'});
    await otherRef.set(other);
    await page.goto('/invitacion/' + fiesta.id + '/invitado/' + invitado.id + '?token=' + invitado.guestAccessToken,{waitUntil:'domcontentloaded'});
    await expect(page.getByText(/Estamos preparando tu información/i)).toBeHidden({timeout:30000});
    await page.getByRole('button',{name:/carta de tragos/i}).first().click();
    const article = page.locator('article',{hasText:trago.nombre});
    await expect(article).toBeVisible({timeout:20000});
    await article.getByTestId('boton-pedir-trago').click();
    await page.getByTestId('boton-confirmar-pedido').click();
    await expect(page.getByText('Mi pedido actual',{exact:true})).toBeVisible({timeout:20000});
    const orders = ()=>db.collection('bar_drink_orders').where('fiestaId','==',fiesta.id).get();
    await expect.poll(async()=>(await orders()).size,{timeout:20000}).toBe(1);
    const initial = (await orders()).docs[0].data();
    orderId = initial.id;
    const ref = db.collection('bar_drink_orders').doc(orderId);
    expect(initial).toMatchObject({status:'nuevo',drinkId:trago.id,guestId:invitado.id,guestName:invitado.nombre});
    expect((await stockRef.get()).data().cantidadDisponible).toBe(975);
    expect((await context.cookies()).some(c=>c.name==='ak_session')).toBe(false);
    await ponerSesionDelEquipo(staff,baseURL);
    const operator = await staff.newPage();
    await operator.goto('/evento/barra/' + fiesta.id + '/barman',{waitUntil:'domcontentloaded'});
    await expect(operator.getByText(other.drinkName,{exact:true})).toHaveCount(0);
    for(const [button,from,to] of [['Preparar','Nuevo','preparando'],['Listo','Preparando','listo'],['Entregado','Listo','entregado']]){
      const label = trago.nombre + ', ' + from + ', ' + invitado.nombre;
      const exactCard = operator.locator('[aria-label="'+label+'"]');
      await expect(exactCard).toBeVisible({timeout:20000});
      if(from==='Nuevo') await operator.screenshot({path:info.outputPath('barman-pedido-nuevo.png'),fullPage:true});
      await exactCard.getByRole('button',{name:button,exact:true}).click();
      await expect.poll(async()=>(await ref.get()).data().status,{timeout:20000}).toBe(to);
    }
    await operator.reload({waitUntil:'domcontentloaded'});
    const history=operator.locator('section').filter({has:operator.getByRole('heading',{name:'Ultimos cerrados'})});
    await expect(history.getByText(trago.nombre,{exact:true})).toBeVisible();
    await expect(history.getByText('Entregado',{exact:true})).toBeVisible();
    expect((await ref.get()).data().status).toBe('entregado');
    expect((await stockRef.get()).data().cantidadDisponible).toBe(975);
    expect((await orders()).size).toBe(1);
    expect((await otherRef.get()).data()).toEqual(other);
    await info.attach('resultado-real-barra.json',{body:JSON.stringify({order:(await ref.get()).data(),stock:(await stockRef.get()).data(),otraFiestaIntacta:true}),contentType:'application/json'});
    await operator.screenshot({path:info.outputPath('barra-entregada.png')});
  } finally {
    const own = await db.collection('bar_drink_orders').where('fiestaId','==',fiesta.id).get();
    await Promise.all(own.docs.map(d=>d.ref.delete()));
    await Promise.all([otherRef.delete(),stockRef.delete(),fiestaRef.delete()]);
    borrarFiesta(fiesta.id);
    await staff.close();
  }
});

test('retest BAR82: cancelar con corte recupera controles; reintento persiste cancelado',async({page},info)=>{
  test.setTimeout(90000);
  const suffix=Date.now()+'_'+process.pid;
  const fiesta=crearFiestaDeEstaNoche({id:'e2e_barra87_corte_'+suffix});
  fiesta.modulosContratados.barraTecnologica=true;
  const invitado=fiesta.invitados[0];
  const order={id:'bar87_corte_'+suffix,fiestaId:fiesta.id,drinkId:'daiquiri-durazno',drinkName:'Daiquiri de durazno',
    guestId:invitado.id,guestName:invitado.nombre,status:'nuevo',source:'touchscreen',
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  fiesta.others={...fiesta.others,barraTecnologica:{settings:{enabled:true},orders:[]}};
  const ref=db.collection('bar_drink_orders').doc(order.id);
  const fref=db.collection('fiestas').doc(fiesta.id);
  try {
    guardarFiesta(fiesta); await fref.set(JSON.parse(JSON.stringify(fiesta)));await ref.set(order);
    const route='/invitacion/'+fiesta.id+'/invitado/'+invitado.id;
    await page.goto(route+'?token='+invitado.guestAccessToken,{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:/carta de tragos/i}).first().click();
    await expect(page.getByText('Mi pedido actual',{exact:true})).toBeVisible({timeout:20000});
    let cortes=0;
    await page.route('**'+route+'*',async(r)=>{
      if(cortes===0 && r.request().method()==='POST' && (r.request().postData()||'').includes(order.id)){
        cortes++;await r.abort('failed');
      }else await r.continue();
    });
    const cancel=page.getByRole('button',{name:'Cancelar',exact:true});
    await cancel.click();
    await expect(page.getByText('No se pudo cancelar').first()).toBeVisible({timeout:15000});
    expect(cortes).toBe(1);await expect(cancel).toBeEnabled();
    expect((await ref.get()).data().status).toBe('nuevo');
    await expect(page.getByText('Pedido cancelado',{exact:true})).toHaveCount(0);
    await cancel.click();
    await expect.poll(async()=>(await ref.get()).data().status,{timeout:20000}).toBe('cancelado');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:/carta de tragos/i}).first().click();
    await expect(page.getByText('Mi pedido actual',{exact:true})).toHaveCount(0);
    expect((await ref.get()).data().status).toBe('cancelado');
    await info.attach('cancelacion-persistida.json',{body:JSON.stringify((await ref.get()).data()),contentType:'application/json'});
  } finally {await ref.delete();await fref.delete();borrarFiesta(fiesta.id);}
});
