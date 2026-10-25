import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo QA ficticio');
const tag = `QA136_${process.pid}_${Date.now()}`;
const originals = new Map<string, Buffer | null>();
const dataFiles = ['servicios-empresa.json','proveedores.json','empleados.json','activos-fijos.json','crm-leads.json'];
test.beforeAll(() => {
  for (const folder of ['data','src/data']) for (const name of dataFiles) {
    const file = path.join(process.cwd(), folder, name);
    originals.set(file, fs.existsSync(file) ? fs.readFileSync(file) : null);
  }
});
test.afterAll(() => {
  for (const [file, bytes] of originals) {
    if (bytes) fs.writeFileSync(file, bytes);
    else if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});
test.beforeEach(async ({ context, baseURL }) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'firebaseinstallations.googleapis.com') return route.fulfill({ status: 200,
      contentType: 'application/json', body: JSON.stringify({ fid: 'cQA136localinstallation00', refreshToken: 'synthetic',
        authToken: { token: 'synthetic', expiresIn: '604800s' }, token: 'synthetic', expiresIn: '604800s' }) });
    return ['localhost','127.0.0.1'].includes(url.hostname) || ['blob:','data:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addInitScript(() => { Reflect.deleteProperty(Navigator.prototype, 'serviceWorker'); });
  await ponerSesionDelEquipo(context, baseURL);
});

async function findAfterReload(page: Page, name: string, list: string) {
  await expect(page).toHaveURL(new RegExp(`${list}(?:\\?|$)`));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const search = page.getByPlaceholder(/buscar/i).first();
  if (await search.count()) await search.fill(name);
  // Employee cells include the avatar initial before the unique synthetic name.
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
}

function persisted(file: string, name: string) {
  const rows = ['src/data','data'].flatMap((folder) => {
    const full = path.join(process.cwd(), folder, file);
    return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '')) : [];
  }).filter((row: any) => JSON.stringify(row).includes(name));
  expect(rows.length).toBeGreaterThan(0);
  expect(new Set(rows.map((row: any) => row.id)).size).toBe(1);
  return rows[0];
}

test('empresa: crear servicio, conservar precio y leerlo tras recarga', async ({ page }, info) => {
  const name = `${tag}_Servicio`;
  await page.goto('/empresa/servicios/nuevo');
  await page.locator('#item-nombre').fill(name);
  await page.locator('#item-subcategoria').fill('Prueba aislada');
  await page.locator('#item-costo').fill('120');
  await page.locator('#precio-venta').fill('850');
  await page.getByRole('button', { name: 'Crear Servicio', exact: true }).click();
  await findAfterReload(page, name, '/empresa/servicios');
  const row = persisted('servicios-empresa.json', name);
  await info.attach('persistencia.json', { body: JSON.stringify(row), contentType: 'application/json' });
  await info.attach('lista.png', { body: await page.screenshot(), contentType: 'image/png' });
  expect(JSON.stringify(row)).toContain('850');
});

test('empresa: crear proveedor y conservar contacto tras recarga', async ({ page }, info) => {
  const name = `${tag}_Proveedor`;
  await page.goto('/proveedores/new');
  await page.locator('#company-name').fill(name);
  await page.locator('#proveedor-name').fill('Contacto ficticio QA136');
  await page.locator('#proveedor-servicio').fill('Insumo QA136');
  await page.locator('#proveedor-telefono').fill('099000136');
  await page.locator('#proveedor-email').fill('qa136@example.invalid');
  await page.locator('#proveedor-notas').fill('Solo prueba, no contactar');
  await page.getByRole('button', { name: 'Guardar Registro', exact: true }).click();
  await findAfterReload(page, name, '/proveedores');
  const row = persisted('proveedores.json', name);
  expect(JSON.stringify(row)).toContain('099000136');
  expect(JSON.stringify(row)).toContain('qa136@example.invalid');
  await info.attach('persistencia.json', { body: JSON.stringify(row), contentType: 'application/json' });
  await info.attach('lista.png', { body: await page.screenshot(), contentType: 'image/png' });
});

test('empresa: crear empleado y conservar contacto tras recarga', async ({ page }, info) => {
  const name = `${tag}_Empleado`;
  await page.goto('/empleados/nuevo');
  await page.locator('#empleado-nombre').fill(name);
  await page.locator('#empleado-telefono').fill('59899000136');
  await page.locator('#empleado-email').fill('empleado136@example.invalid');
  await page.getByRole('button', { name: 'Guardar Empleado', exact: true }).click();
  await findAfterReload(page, name, '/empleados');
  const row = persisted('empleados.json', name);
  expect(JSON.stringify(row)).toContain('59899000136');
  expect(JSON.stringify(row)).toContain('empleado136@example.invalid');
  await info.attach('persistencia.json', { body: JSON.stringify(row), contentType: 'application/json' });
  await info.attach('lista.png', { body: await page.screenshot(), contentType: 'image/png' });
});

test('empresa: crear activo fijo y conservar stock tras recarga', async ({ page }, info) => {
  const name = `${tag}_Activo`;
  await page.goto('/empresa/activos-fijos/nuevo');
  await page.locator('#item-nombre').fill(name);
  await page.locator('#item-cantidad').fill('7');
  await page.locator('#item-valor-unitario').fill('250');
  await page.locator('#cantidad-fija').fill('2');
  await page.getByRole('button', { name: 'Guardar Activo', exact: true }).click();
  await findAfterReload(page, name, '/empresa/activos-fijos');
  const row = persisted('activos-fijos.json', name);
  expect(row.cantidadDisponible).toBe(7);
  await info.attach('persistencia.json', { body: JSON.stringify(row), contentType: 'application/json' });
  await info.attach('lista.png', { body: await page.screenshot(), contentType: 'image/png' });
});

test('comercial: prospecto y agenda conservan contacto, cita y hora Uruguay', async ({ page, isMobile }, info) => {
  const name = `Auditoria Qa136 ${process.pid} ${Date.now()}`;
  const phone = `099${String(process.pid).padStart(6, '0')}`;
  // /empresa/crm is specifically the guest-attraction view, not the main CRM.
  await page.goto('/contabilidad/crm');
  await page.getByRole('button', { name: 'Añadir Prospecto', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('#lead-name').fill(name);
  await dialog.locator('#lead-phone').fill(phone);
  await dialog.locator('#lead-notes').fill('Consulta ficticia de publicidad, sin correo ni presupuesto previo');
  await dialog.getByRole('button', { name: 'Añadir prospecto', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Buscar por nombre, teléfono, salón...').fill(name);
  if (isMobile) await page.getByRole('heading', { name: /^Consultó \d+$/ }).getByRole('button').click();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  const lead = persisted('crm-leads.json', name);
  expect(lead.phone).toBe(phone);
  expect(lead.email || '').toBe('');
  await page.goto('/contabilidad/crm/agenda');
  await page.getByRole('button', { name: 'Agendar Nueva Reunión', exact: true }).click();
  await dialog.getByPlaceholder('Buscar prospecto...').fill(name);
  await dialog.getByText(name, { exact: false }).first().click();
  await dialog.locator('#meeting-title').fill(`Entrevista ${name}`);
  await dialog.locator('#meeting-time').fill('18:45');
  await dialog.getByRole('button', { name: 'Agendar y Guardar', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/(?:18:45|6:45\s+p\.\s*m\.)/, { exact: false }).first()).toBeVisible();
  const updated = persisted('crm-leads.json', name);
  expect(updated.id).toBe(lead.id);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Montevideo', hour: '2-digit', minute: '2-digit' });
  expect(time.format(new Date(updated.followUpDate))).toBe('18:45');
  expect(updated.timeline.filter((entry: any) => entry.type === 'meeting_scheduled')).toHaveLength(1);
  await info.attach('persistencia.json', { body: JSON.stringify(updated), contentType: 'application/json' });
  await info.attach('agenda.png', { body: await page.screenshot(), contentType: 'image/png' });
  const reminder = page.getByRole('link', { name: 'Recordar por WhatsApp', exact: true }).filter({
    has: page.getByRole('button', { name: 'Recordar por WhatsApp', exact: true }),
  });
  const links = await reminder.evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).href));
  const href = links.find((value) => decodeURIComponent(value).includes(name));
  expect(href).toBeTruthy();
  const expectedPath = `/598${phone.slice(1)}`;
  await info.attach('recordatorio.json', { body: JSON.stringify({ href, expectedPath, storedPhone: updated.phone,
    followUpDate: updated.followUpDate, messageSent: false }), contentType: 'application/json' });
  expect(new URL(href!).pathname, 'WhatsApp requires international digits; stored local phone must stay unchanged').toBe(expectedPath);
});
