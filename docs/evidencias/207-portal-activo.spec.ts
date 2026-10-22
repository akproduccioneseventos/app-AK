import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta } from './helpers/fiesta-de-prueba';

const ID=`e2e_207_portal_${Date.now()}`;
const KEY=`qa207-clave-${Date.now()}`;
const BUDGET=`e2e_207_budget_${Date.now()}`;
const fiesta=crearFiestaDeEstaNoche({id:ID,clavePortal:KEY,fechaEvento:'2027-08-08'});
Object.assign(fiesta,{presupuestoId:BUDGET,clientPaymentNotifications:[],listaMusicaPortal:{imprescindibles:[],siEsPosible:[],noQuiero:[]},
  fotografiaYFilmacion:{notasGenerales:'Entrega oficial ficticia',servicios:[{id:'qa207-album',nombre:'Album QA207',estado:'Entregado completo',linkEntrega:'https://qa.invalid/album-oficial-207'}]}});
Object.assign(fiesta.clientPortalSettings!,{enabled:true,accessKey:KEY,accessPhase:'organizacion',musica:{visible:true},menu:{visible:true},
  cuentasBancarias:[1,2,3].map(n=>({id:`qa207-bank-${n}`,banco:`Banco ficticio207-${n}`,titular:`Titular207-${n}`,numero:`CUENTA-QA207-${n}`}))});
const budget={id:BUDGET,clienteNombre:'Cliente ficticio207',clienteContacto:'099000207',eventoTipo:'Boda',eventoFecha:'2027-08-08',invitadosCantidad:25,invitadosAdultos:25,invitadosNinos:0,invitadosAdolescentes:0,
  totalConDescuento:1000,totalFinal:1000,costoTotalEstimado:1000,ajusteAnualPorcentaje:0,ajusteAnualActivo:false,estado:'Aceptado',timestamp:'2026-10-21',pagosCliente:[],
  itemsPresupuestados:[{idServicioCatalogo:'qa207-menu',nombreServicio:'Menu ficticio207',categoriaServicio:'Catering',cantidad:25,precioUnitario:40,precioUnitarioPresupuesto:40,calculationMethod:'porPersona',costoTotalItem:1000}]};
test.beforeAll(()=>{
  guardarFiesta(fiesta);
  for(const folder of ['data','src/data']){fs.mkdirSync(path.join(process.cwd(),folder),{recursive:true});fs.writeFileSync(path.join(process.cwd(),folder,'presupuestos.json'),JSON.stringify([budget]));}
});
test.afterAll(()=>borrarFiesta(ID));
test.beforeEach(async({page,context})=>{
  await page.goto(`/portal/c/${KEY}`,{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'Personalizar portada',exact:true})).toBeVisible();
  await expect.poll(async()=> (await context.cookies()).some(c=>c.name==='ak_portal_session'),{timeout:30000}).toBe(true);
});
test('portal activo: tres bancos visibles y sin desborde',async({page},testInfo)=>{
  for(const n of [1,2,3])await expect(page.getByText(`CUENTA-QA207-${n}`,{exact:true})).toBeVisible();
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
  await page.screenshot({path:testInfo.outputPath('portal-activo.png'),fullPage:true});
});
test('portal activo: musica guarda en servidor y persiste tras recarga',async({page},testInfo)=>{
  const song=`Cancion real local207-${testInfo.project.name}`;
  await page.getByPlaceholder('Agregar canción importante').fill(song);
  await page.getByRole('button',{name:'Agregar',exact:true}).click();
  await expect(page.getByText('Canción agregada. AK ya la verá dentro del evento.',{exact:true})).toBeVisible();
  await expect.poll(()=>leerFiesta(ID)?.listaMusicaPortal?.imprescindibles||[]).toContain(song);
  await page.reload();await expect(page.getByText(song,{exact:true})).toBeVisible();
});
test('portal activo: portada abre y cierra con controles alcanzables',async({page},testInfo)=>{
  await page.getByRole('button',{name:'Personalizar portada',exact:true}).click();
  const close=page.getByRole('button',{name:'Cerrar',exact:true});await expect(close).toBeVisible();
  const rect=await close.boundingBox();expect(rect).not.toBeNull();expect(rect!.y).toBeGreaterThanOrEqual(0);
  expect(rect!.y+rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({path:testInfo.outputPath('portada-modal.png')});await close.click();
  await expect(close).toHaveCount(0);
});
test('portal activo: corte antes de enviar mantiene invitados y muestra error',async({page})=>{
  const adults=page.getByText('Adultos a agregar',{exact:true}).locator('input');
  await adults.fill('2');
  await page.route('**/portal/c/**',async route=>{if(route.request().method()==='POST'&&route.request().headers()['next-action'])await route.abort('internetdisconnected');else await route.continue();});
  await page.getByRole('button',{name:'Enviar solicitud',exact:true}).click();
  await expect(page.getByText('No se pudo enviar la solicitud.',{exact:true})).toBeVisible();await expect(adults).toHaveValue('2');
});
test('AK-KNOWN-210-A7 portal activo: Informar pago debe abrir formulario',async({page})=>{
  await page.getByRole('button',{name:'Informar pago',exact:true}).last().click();
  await expect(page.locator('input[type="file"]')).toBeVisible({timeout:5000});
});
test('AK-KNOWN-210-A8 portal activo: entrega oficial debe ser accesible',async({page})=>{
  await expect(page.locator('a[href="https://qa.invalid/album-oficial-207"]')).toBeVisible({timeout:5000});
});
