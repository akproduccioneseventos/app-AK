// @ts-nocheck -- Solo copia TEMP con Firestore demo; no facturas ni pagos reales.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test, expect} from '@playwright/test';
import admin from 'firebase-admin';
import {ponerSesionDelEquipo} from './helpers/fiesta-de-prueba';
if(process.env.AK_ENTORNO_AISLADO!=='true'||path.dirname(process.cwd())!==path.join(os.tmpdir(),'ak-codex88')
  ||!path.basename(process.cwd()).startsWith('ak-entorno-aislado-')
  ||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085') throw new Error('Solo TEMP demo');
const app=admin.initializeApp({projectId:'demo-ak-producciones'},'saldo88-'+process.pid);
const db=app.firestore(); db.settings({ignoreUndefinedProperties:true});
test.afterAll(async()=>{await app.delete();});
test('ultimo pago de 750 persiste, saldo cero, recibo y otro navegador coinciden',async({page,context,browser,baseURL},info)=>{
  test.setTimeout(240000);
  const id='e2e_factura88_'+process.pid+'_'+Date.now();
  const factura={id,invoiceNumber:'AUD88-'+id,customer:{id:'cliente-'+id,name:'Cliente ficticio auditoria88'},
    issueDate:'2026-10-09T12:00:00Z',dueDate:'2026-10-30T12:00:00Z',
    items:[{id:'i1',description:'Servicio ficticio 88',quantity:1,unitPrice:1000,total:1000}],
    subtotal:1000,taxRate:0,taxAmount:0,totalAmount:1000,status:'PartiallyPaid',currency:'UYU',
    vendorName:'AK',payments:[{id:'p1-'+id,amount:250,paymentDate:'2026-10-09T12:00:00Z',method:'Transferencia'}]};
  const ref=db.collection('facturas').doc(id);
  const files=['data/invoices.json','src/data/invoices.json'];
  const writeOwn=(value:any|null)=>{for(const file of files){
    const full=path.join(process.cwd(),file); fs.mkdirSync(path.dirname(full),{recursive:true});
    let entries=[];try{entries=JSON.parse(fs.readFileSync(full,'utf8'));}catch{}
    entries=Array.isArray(entries)?entries.filter(p=>p.id!==id):[];
    fs.writeFileSync(full,JSON.stringify(value?[...entries,value]:entries,null,2));
  }};
  let second;
  try{
    writeOwn(factura);await ref.set(factura);await ponerSesionDelEquipo(context,baseURL);
    await page.goto('/invoices/'+id,{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('heading',{name:'Estado de Cuenta',exact:true})).toBeVisible({timeout:45000});
    await page.locator('input[type="number"]').fill('750');
    await page.getByRole('button',{name:'Registrar Pago',exact:true}).click();
    await expect(page.getByText('Pago Registrado',{exact:true})).toBeVisible({timeout:30000});
    await expect.poll(async()=>{
      const data=(await ref.get()).data();
      return {paid:data?.payments?.reduce((s,p)=>s+p.amount,0),count:data?.payments?.length,status:data?.status};
    },{timeout:20000}).toEqual({paid:1000,count:2,status:'Paid'});
    await page.reload({waitUntil:'domcontentloaded'});
    const check=async(p)=>{
      await expect(p.getByRole('heading',{name:'Estado de Cuenta',exact:true})).toBeVisible({timeout:30000});
      await expect(p.getByText('TOTAL PAGADO:',{exact:true}).locator('..')).toContainText('1.000');
      await expect(p.getByText('SALDO PENDIENTE:',{exact:true}).locator('..')).toContainText('$ 0');
      await expect(p.getByRole('heading',{name:'RECIBO',exact:true})).toBeVisible();
      await expect(p.getByText('SETECIENTOS CINCUENTA PESOS URUGUAYOS',{exact:true})).toBeVisible();
    };
    await check(page);
    second=await browser.newContext();await ponerSesionDelEquipo(second,baseURL);
    const consumer=await second.newPage();await consumer.goto('/invoices/'+id,{waitUntil:'domcontentloaded'});
    await check(consumer);
    await info.attach('factura-guardada.json',{body:JSON.stringify((await ref.get()).data(),null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath('saldo-final.png'),fullPage:true});
  }finally{await second?.close();await ref.delete();writeOwn(null);}
});
