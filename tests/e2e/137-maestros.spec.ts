import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo QA ficticio');
const tag = `QA137_${process.pid}_${Date.now()}`;
const snapshotFiles = ['src/data/customers.json', 'src/data/salones.json', 'data/customers.json', 'data/salones.json'];
const originals = new Map<string, Buffer | null>();

async function stored(collection: string, name: string) {
  const url = `http://127.0.0.1:8085/v1/projects/demo-ak-producciones/databases/(default)/documents/${collection}`;
  const response = await fetch(url, { headers: { Authorization: 'Bearer owner' } });
  expect(response.status).toBe(200);
  const body = await response.json();
  return (body.documents || []).filter((doc: any) => JSON.stringify(doc.fields).includes(name));
}

test.afterEach(async ({ page }, info) => {
  await info.attach('estado-final.txt', { body: Buffer.from(await page.locator('body').innerText().catch(() => 'page unavailable')), contentType: 'text/plain' });
});

test.beforeAll(() => {
  for (const rel of snapshotFiles) {
    const full = path.resolve(rel);
    originals.set(full, fs.existsSync(full) ? fs.readFileSync(full) : null);
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
      contentType: 'application/json', body: JSON.stringify({ fid: 'cQA137localinstallation00', refreshToken: 'synthetic',
        authToken: { token: 'synthetic', expiresIn: '604800s' }, token: 'synthetic', expiresIn: '604800s' }) });
    return ['localhost','127.0.0.1'].includes(url.hostname) || ['blob:','data:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addInitScript(() => { Reflect.deleteProperty(Navigator.prototype, 'serviceWorker'); });
  await ponerSesionDelEquipo(context, baseURL);
});

test('maestros: alta de cliente desde enlace visible y persistencia tras recarga', async ({ page }, info) => {
  const name = `${tag}_Cliente`;
  await page.goto('/empresa');
  await page.getByRole('link', { name: 'Clientes', exact: true }).first().click();
  await expect(page).toHaveURL(/\/customers(?:\?|$)/);
  await page.getByRole('link', { name: /Nuevo Cliente|Agregar Cliente|Añadir Cliente/i }).first().click();
  await expect(page).toHaveURL(/\/customers\/new(?:\?|$)/);
  await page.locator('#customer-name').fill(name);
  await page.getByRole('button', { name: 'Guardar Cliente', exact: true }).click();
  await expect(page).toHaveURL(/\/customers(?:\?|$)/);
  const before = await stored('clientes', name);
  await info.attach('cliente-store-antes.json', { body: Buffer.from(JSON.stringify(before)), contentType: 'application/json' });
  expect(before).toHaveLength(1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Cargando clientes...', { exact: true })).toBeHidden({ timeout: 65_000 });
  const after = await stored('clientes', name);
  await info.attach('cliente-store-despues.json', { body: Buffer.from(JSON.stringify(after)), contentType: 'application/json' });
  expect(after).toEqual(before);
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
  await info.attach('cliente.png', { body: await page.screenshot(), contentType: 'image/png' });
});

test('maestros: alta de salon desde enlace visible y persistencia tras recarga', async ({ page }, info) => {
  const name = `${tag}_Salon`;
  await page.goto('/empresa');
  await page.getByRole('link', { name: 'Salones', exact: true }).first().click();
  await expect(page).toHaveURL(/\/empresa\/salones(?:\?|$)/);
  await page.getByRole('button', { name: 'Agregar Salón', exact: true }).click();
  await page.locator('#salon-nombre').fill(name);
  await page.locator('#salon-capacidad').fill('80');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  const before = await stored('salones', name);
  await info.attach('salon-store-antes.json', { body: Buffer.from(JSON.stringify(before)), contentType: 'application/json' });
  expect(before).toHaveLength(1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(async () => await page.getByText(name, { exact: true }).count(), { timeout: 65_000 }).toBeGreaterThan(0);
  const after = await stored('salones', name);
  await info.attach('salon-store-despues.json', { body: Buffer.from(JSON.stringify(after)), contentType: 'application/json' });
  expect(after).toEqual(before);
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await info.attach('salon.png', { body: await page.screenshot(), contentType: 'image/png' });
});
