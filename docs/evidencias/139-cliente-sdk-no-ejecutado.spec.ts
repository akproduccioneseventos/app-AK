import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo QA ficticio');
test.beforeEach(async ({ context, baseURL }) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'firebaseinstallations.googleapis.com') return route.fulfill({ status: 200,
      contentType: 'application/json', body: JSON.stringify({ fid: 'cQA139localinstallation00', refreshToken: 'synthetic',
        authToken: { token: 'synthetic', expiresIn: '604800s' }, token: 'synthetic', expiresIn: '604800s' }) });
    return ['localhost', '127.0.0.1'].includes(url.hostname) || ['blob:', 'data:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addInitScript(() => { Reflect.deleteProperty(Navigator.prototype, 'serviceWorker'); });
  await ponerSesionDelEquipo(context, baseURL);
});

async function stored(name: string) {
  const r = await fetch('http://127.0.0.1:8085/v1/projects/demo-ak-producciones/databases/(default)/documents/clientes', {
    headers: { Authorization: 'Bearer owner' }, signal: AbortSignal.timeout(10_000),
  });
  expect(r.status).toBe(200);
  const rows = (await r.json()).documents || [];
  return rows.filter((row: any) => row.fields?.name?.stringValue === name);
}

test('cliente: alta telefono sin email, lista y persistencia SDK despues de recargar', async ({ page }, info) => {
  const name = `Auditoria Cliente Qa139 ${process.pid} ${Date.now()}`;
  const phone = `099${String(process.pid).padStart(6, '0').slice(-6)}`;
  const timings: Array<{ url: string; ms: number; status: number }> = [];
  page.on('response', (response) => {
    if (response.request().method() === 'POST') timings.push({ url: new URL(response.url()).pathname,
      ms: response.request().timing().responseEnd, status: response.status() });
  });
  await page.goto('/empresa');
  await page.getByRole('link', { name: 'Clientes', exact: true }).first().click();
  await page.getByRole('link', { name: /Nuevo Cliente|Agregar Cliente|Añadir Cliente/i }).first().click();
  await page.locator('#customer-name').fill(name);
  await page.locator('#customer-phone').fill(phone);
  const start = Date.now();
  await page.getByRole('button', { name: 'Guardar Cliente', exact: true }).click();
  try {
    await expect(page).toHaveURL(/\/customers(?:\?|$)/, { timeout: 55_000 });
    const before = await stored(name);
    await info.attach('store-antes.json', { body: Buffer.from(JSON.stringify(before)), contentType: 'application/json' });
    expect(before).toHaveLength(1);
    expect(before[0].fields.phone.stringValue).toBe(phone);
    expect(before[0].fields.email).toBeUndefined();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Cargando clientes...', { exact: true })).toBeHidden({ timeout: 35_000 });
    await page.getByPlaceholder('Buscar por nombre o empresa...').fill(name);
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    const after = await stored(name);
    await info.attach('store-despues.json', { body: Buffer.from(JSON.stringify(after)), contentType: 'application/json' });
    expect(after).toEqual(before);
    await info.attach('cliente-recarga.jpeg', { body: await page.screenshot({ type: 'jpeg', quality: 65,
      animations: 'disabled', timeout: 5_000 }), contentType: 'image/jpeg' });
  } finally {
    const current = await stored(name).catch((error) => ({ readError: String(error) }));
    await info.attach('diagnostico.json', { body: Buffer.from(JSON.stringify({ name, phone, elapsedMs: Date.now() - start,
      url: page.url(), current, timings })), contentType: 'application/json' });
  }
});
