import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.beforeEach(async ({ context, baseURL }) => {
  expect(process.env.AK_ENTORNO_AISLADO).toBe('true');
  expect(process.env.AK_USE_LOCAL_JSON_ONLY).toBe('true');
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await ponerSesionDelEquipo(context, baseURL);
});

test('179 agenda abre recordatorio con598 sin modificar el telefono local', async ({ page }, info) => {
  const id = `qa150_agenda_${info.project.name}_${Date.now()}`;
  const name = `Agenda QA150 ${id}`;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  const followUpDate = `${get('year')}-${get('month')}-${get('day')}T21:45:00.000Z`;
  const lead = { id, name, phone: '099000179', email: '', currentStageId: 'stage_nuevo', notes: 'QA ficticio sin envios',
    followUpDate, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), timeline: [] };
  for (const folder of ['data', 'src/data']) {
    const file = path.join(process.cwd(), folder, 'crm-leads.json');
    if (!fs.existsSync(file)) continue;
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(Array.isArray(rows)).toBe(true);
    fs.writeFileSync(file, JSON.stringify([...rows, lead], null, 2));
  }
  await page.goto('/contabilidad/crm/agenda', { waitUntil: 'domcontentloaded' });
  const card = page.getByText(name, { exact: true }).locator('../..');
  await expect(card).toBeVisible();
  const reminder = card.getByRole('link', { name: 'Recordar por WhatsApp' });
  const href = await reminder.getAttribute('href');
  expect(href).toBeTruthy();
  expect(new URL(href!).pathname).toBe('/59899000179');
  expect(new URL(href!).searchParams.get('text')).toContain(name);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  for (const folder of ['data', 'src/data']) {
    const file = path.join(process.cwd(), folder, 'crm-leads.json');
    if (!fs.existsSync(file)) continue;
    const stored = JSON.parse(fs.readFileSync(file, 'utf8')).find((r: any) => r.id === id);
    expect(stored.phone).toBe(lead.phone); expect(stored.followUpDate).toBe(followUpDate);
  }
  await info.attach('recordatorio', { body: Buffer.from(JSON.stringify({ href, phoneStored: lead.phone, messageSent: false })), contentType: 'application/json' });
  await info.attach('agenda', { body: await page.screenshot(), contentType: 'image/png' });
});

test('179 titulo de ajuste de costos visible y blanco sin desborde', async ({ page }, info) => {
  await page.goto('/empresa/servicios', { waitUntil: 'domcontentloaded' });
  const title = page.getByText('Ajuste de Costos Global', { exact: true });
  await expect(title).toBeVisible();
  const styles = await title.evaluate(el => {
    const s = getComputedStyle(el); const box = el.getBoundingClientRect();
    return { color: s.color, parentBackground: getComputedStyle(el.parentElement!).backgroundColor,
      parentImage: getComputedStyle(el.parentElement!).backgroundImage, width: innerWidth,
      left: box.left, right: box.right, text: el.textContent };
  });
  expect(styles.color).toBe('rgb(255, 255, 255)');
  expect(styles.left).toBeGreaterThanOrEqual(0); expect(styles.right).toBeLessThanOrEqual(styles.width);
  await info.attach('estilos', { body: Buffer.from(JSON.stringify(styles)), contentType: 'application/json' });
  await info.attach('catalogo', { body: await title.locator('..').screenshot(), contentType: 'image/png' });
});
