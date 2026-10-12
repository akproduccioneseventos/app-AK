import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium, devices, expect } from '@playwright/test';
import { fixtureGuard } from './110-fixture-guard.mjs';

const root = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3300';
const restore = fixtureGuard();
const results = [];
const browser = await chromium.launch({headless:true});
const read = file => JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
async function record(viewport,name,fn) {
  if (process.argv.includes('--meetings') && !name.startsWith('meeting-')) return;
  if (process.argv.includes('--providers') && !name.startsWith('provider-')) return;
  const item = {viewport,name};
  try { item.details = await fn(); item.status = item.details?.acceptance?.startsWith('FAIL') ? 'FAIL' : 'PASS'; }
  catch(error) { item.status = 'NOT_ACCEPTED'; item.error = error.message; }
  results.push(item); console.log(JSON.stringify(item));
}
async function session(viewport) {
  const context = await browser.newContext(viewport === 'mobile' ? devices['Pixel 7'] : {viewport:{width:1440,height:1000}});
  await context.route(/^https:\/\//,route => route.abort('blockedbyclient'));
  const user = {email:'qa110@example.invalid',userId:'qa110',role:'admin',perfil:'dueno'};
  const payload = `v1.${Date.now()+3600000}.${crypto.randomUUID()}.${encodeURIComponent(JSON.stringify(user))}`;
  const token = `${payload}.${crypto.createHmac('sha256',process.env.AK_SESSION_SECRET).update(payload).digest('hex')}`;
  await context.addCookies([{name:'ak_session',value:encodeURIComponent(token),url:root,httpOnly:true,sameSite:'Lax'}]);
  await context.addInitScript(() => { localStorage.setItem('ak_session','true');sessionStorage.setItem('ak_session','true'); });
  const page = await context.newPage(); page.setDefaultTimeout(18000);
  return {context,page};
}
const go = (page,url) => page.goto(root+url,{waitUntil:'networkidle',timeout:60000});
try {
  for (const viewport of ['desktop','mobile']) {
    const {context,page} = await session(viewport);
    const name = `QA110_${viewport}_${crypto.randomUUID()}`;
    let providerId;
    await record(viewport,'provider-create-persist-read',async()=>{
      await go(page,'/proveedores/new');
      await page.locator('#company-name').fill(name);
      await page.locator('#proveedor-servicio').fill('QA tecnologia');
      await page.locator('#proveedor-telefono').fill('099000110');
      await page.locator('#proveedor-notas').fill('QA110 registro ficticio');
      await page.getByRole('button',{name:'Guardar Registro',exact:true}).click();
      await expect(page).toHaveURL(root+'/proveedores');
      await expect(page.getByRole('row').filter({hasText:name})).toBeVisible();
      const row = read('src/data/proveedores.json').find(p=>p.nombreEmpresa===name);
      expect(row?.telefono).toBe('099000110'); providerId=row.id;
      await page.reload({waitUntil:'networkidle'});
      await expect(page.getByRole('row').filter({hasText:name})).toBeVisible();
      return {id:providerId,phone:row.telefono,storedAndReloaded:true};
    });
    await record(viewport,'provider-duplicate-refused',async()=>{
      await go(page,'/proveedores/new'); await page.locator('#company-name').fill(name);
      await page.locator('#proveedor-servicio').fill('QA tecnologia');
      await page.getByRole('button',{name:'Guardar Registro',exact:true}).click();
      await expect(page.getByText(/Ya existe un proveedor o servicio/)).toBeVisible();
      expect(read('src/data/proveedores.json').filter(p=>p.nombreEmpresa===name).length).toBe(1);
      return {rows:1,errorVisible:true};
    });
    await record(viewport,'provider-edit-reload',async()=>{
      if(!providerId) throw new Error('Creation did not yield ID');
      await go(page,`/proveedores/${providerId}/edit`);
      await expect(page.locator('#proveedor-telefono')).toHaveValue('099000110');
      await page.locator('#proveedor-telefono').fill('099000111');
      await page.getByRole('button',{name:'Guardar Cambios',exact:true}).click();
      await expect(page).toHaveURL(root+'/proveedores');
      await go(page,`/proveedores/${providerId}/edit`);
      await expect(page.locator('#proveedor-telefono')).toHaveValue('099000111');
      return {phone:read('src/data/proveedores.json').find(p=>p.id===providerId)?.telefono};
    });
    await record(viewport,'provider-failed-save-keeps-record-and-form',async()=>{
      if(!providerId) throw new Error('Creation did not yield ID');
      await go(page,`/proveedores/${providerId}/edit`);
      await page.locator('#proveedor-telefono').fill('099000112');
      const action = page.url(); let blocked=0;
      await page.route(action,route => {if(route.request().method()==='POST' && route.request().headers()['next-action']) {blocked++;return route.abort('failed');}return route.continue();});
      try {
        await page.getByRole('button',{name:'Guardar Cambios',exact:true}).click();
        await expect(page.getByText('Error al Guardar',{exact:true})).toBeVisible();
        await expect(page.locator('#proveedor-telefono')).toHaveValue('099000112');
        expect(read('src/data/proveedores.json').find(p=>p.id===providerId)?.telefono).toBe('099000111');
        return {blocked,errorVisible:true,formRetained:true,storedPhone:'099000111'};
      } finally {await page.unroute(action);}
    });
    await record(viewport,'provider-delete-cancel-and-confirm',async()=>{
      if(!providerId) throw new Error('Creation did not yield ID');
      await go(page,'/proveedores');
      await page.getByRole('button',{name:`Eliminar ${name}`,exact:true}).click();
      await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      expect(read('src/data/proveedores.json').some(p=>p.id===providerId)).toBe(true);
      await page.getByRole('button',{name:`Eliminar ${name}`,exact:true}).click();
      await page.getByRole('button',{name:'S\u00ed, eliminar',exact:true}).click();
      await expect(page.getByRole('row').filter({hasText:name})).toHaveCount(0);
      const localContainsDeleted=read('src/data/proveedores.json').some(p=>p.id===providerId);
      await page.reload({waitUntil:'networkidle'});
      const presentAfterReload=await page.getByRole('row').filter({hasText:name}).count();
      const admin=await import('firebase-admin');
      const documentExists=(await admin.default.app('qa110-providers').firestore().collection('proveedores').doc(providerId).get()).exists;
      await page.screenshot({path:`docs/evidencias/110-provider-delete-${viewport}.png`,fullPage:true});
      return {cancelKept:true,localContainsDeleted,presentAfterReload,documentExists,deletedId:providerId,acceptance:presentAfterReload===0&&!documentExists?'PASS':'FAIL_DELETED_RECORD_REAPPEARS'};
    });
    await record(viewport,'meeting-master-save-reload',async()=>{
      await go(page,'/settings/templates/reuniones');
      await page.getByPlaceholder('A\u00f1adir nuevo punto clave...').fill(name);
      await page.getByRole('button',{name:'A\u00f1adir',exact:true}).click();
      await page.getByPlaceholder('Escribe los puntos de consultor\u00eda...').fill(name+' guia');
      await page.getByRole('button',{name:'Guardar Configuraci\u00f3n Maestra',exact:true}).click();
      await expect(page.getByText('Plantilla Actualizada',{exact:true})).toBeVisible();
      await page.reload({waitUntil:'networkidle'});
      await expect(page.locator('input').filter({visible:true}).last()).toHaveValue(name);
      await expect(page.getByPlaceholder('Escribe los puntos de consultor\u00eda...')).toHaveValue(name+' guia');
      return {stored:read('src/data/meeting-checklist-template.json').checklist.some(i=>i.text===name),reload:true};
    });
    await record(viewport,'meeting-master-consumer-dialog',async()=>{
      const id='qa110_meeting_'+viewport+'_'+crypto.randomUUID();
      const fiesta={id,estado:'En Planificaci\u00f3n',configuracion:{nombreEvento:'QA110 Reunion',clienteNombre:'QA110',fechaEvento:'2026-11-15',cantidadInvitados:100},reuniones:[],tareas:[],invitados:[],serviciosContratados:[]};
      for(const dir of ['data/fiestas','src/data/fiestas']) {fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,id+'.json'),JSON.stringify(fiesta),{flag:'wx'});}
      await go(page,'/fiestas/nueva/reuniones?fiestaId='+id);
      await page.getByRole('button',{name:'Agendar Nueva Reunion',exact:true}).click();
      await page.getByRole('dialog').getByRole('tab',{name:'Guia y Checklist',exact:true}).click();
      await expect(page.getByRole('dialog').getByText(name,{exact:true})).toBeVisible();
      await page.screenshot({path:`docs/evidencias/110-meeting-${viewport}.png`,fullPage:true});
      return {fiestaId:id,masterItemActuallyConsumed:true};
    });
    await record(viewport,'invitation-create-and-delete-saved',async()=>{
      const before=fs.existsSync('src/data/invitacion-digital-templates.json')?read('src/data/invitacion-digital-templates.json'):[];
      await go(page,'/settings/templates/invitaciones');
      await page.getByRole('button',{name:'Crear Nueva Plantilla',exact:true}).click();
      await expect(page.getByText('Plantilla Creada',{exact:true})).toBeVisible();
      const added=read('src/data/invitacion-digital-templates.json').find(t=>!before.some(b=>b.id===t.id));
      expect(added?.id).toBeTruthy();
      await page.reload({waitUntil:'networkidle'});
      const card=page.locator('div.p-4.border').filter({has:page.getByText(added.name,{exact:true})});
      await card.getByTitle('Eliminar',{exact:true}).click();
      await page.getByRole('alertdialog').getByRole('button',{name:'Eliminar',exact:true}).click();
      await expect(page.getByText(added.name,{exact:true})).toHaveCount(0);
      expect(read('src/data/invitacion-digital-templates.json').some(t=>t.id===added.id)).toBe(false);
      return {createdId:added.id,deletedAndStored:true};
    });
    await record(viewport,'invitation-delete-builtin-observation',async()=>{
      await go(page,'/settings/templates/invitaciones');
      const card=page.locator('div.p-4.border').filter({has:page.getByText('Grazia Base',{exact:true})});
      await card.getByTitle('Eliminar',{exact:true}).click();
      await page.getByRole('alertdialog').getByRole('button',{name:'Eliminar',exact:true}).click();
      await expect(page.getByText('Plantilla Eliminada',{exact:true})).toBeVisible();
      const presentImmediately=await page.getByText('Grazia Base',{exact:true}).count();
      await page.reload({waitUntil:'networkidle'});
      const presentAfterReload=await page.getByText('Grazia Base',{exact:true}).count();
      await page.screenshot({path:`docs/evidencias/110-invitation-${viewport}.png`,fullPage:true});
      return {successToast:true,presentImmediately,presentAfterReload,acceptance:presentAfterReload===0?'PASS':'FAIL_FALSE_SUCCESS'};
    });
    await context.close();
  }
} finally {
  await browser.close();
  const suffix=process.argv.includes('--meetings')?'meetings':process.argv.includes('--providers')?'providers':'acciones';
  fs.writeFileSync(`docs/evidencias/110-${suffix}-restauracion.json`,JSON.stringify(restore(),null,2));
  fs.writeFileSync(`docs/evidencias/110-${suffix}.json`,JSON.stringify(results,null,2));
}
