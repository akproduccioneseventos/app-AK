import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo copia QA ficticia');
const id = `e2e_135_${process.pid}_${Date.now()}`;
const budgetId = `${id}_presupuesto`;
const snapshots = new Map<string, Buffer | null>();

test.beforeAll(() => {
  const fiesta = crearFiestaDeEstaNoche({ id, clavePortal: 'clave-ficticia-qa135' });
  fiesta.configuracion.nombreEvento = 'Cocina y salon QA135';
  fiesta.presupuestoId = budgetId;
  fiesta.invitados = [
    { id: 'celiaco', nombre: 'Familia QA135', rsvp: 'Confirmado', partySize: 5, dietaryRestriction: 'Celiaco' },
    { id: 'pendiente', nombre: 'Pendiente QA135', rsvp: 'Pendiente', partySize: 2, dietaryRestriction: 'Vegano' },
  ] as any;
  fiesta.listaMusicaPortal = { siEsPosible: ['Opcional QA135 - Artista QA135'] } as any;
  fiesta.decoracion = { ...fiesta.decoracion, salonWidth: 20, salonHeight: 15, pixelsPerMeter: 40,
    salonElements: [
      { id: 'mesa135', type: 'element', category: 'mesa', name: 'Mesa QA135', x: 180, y: 160, width: 80, height: 80, rotation: 0 },
      { id: 'pista135', type: 'area', category: 'pista', name: 'Pista QA135', x: 420, y: 300, width: 160, height: 160, rotation: 0 },
    ],
  } as any;
  guardarFiesta(fiesta);
  const presupuesto = { id: budgetId, clienteNombre: 'Cliente ficticio QA135', invitadosAdultos: 80,
    invitadosNinos: 15, invitadosAdolescentes: 5, totalFinal: 1000,
    itemsPresupuestados: [
      { idServicioCatalogo: 'dish_135_entrada', nombreServicio: 'Entrada QA135', categoriaServicio: 'Entrada' },
      { idServicioCatalogo: 'dish_135_principal', nombreServicio: 'Principal QA135', categoriaServicio: 'Plato Principal' },
      { idServicioCatalogo: 'dish_135_infantil', nombreServicio: 'Infantil QA135', categoriaServicio: 'Menu Infantil' },
      { idServicioCatalogo: 'dish_135_postre', nombreServicio: 'Postre QA135', categoriaServicio: 'Postre' },
    ] };
  for (const dir of ['data', 'src/data']) {
    const file = path.join(process.cwd(), dir, 'presupuestos.json');
    const prior = fs.existsSync(file) ? fs.readFileSync(file) : null;
    snapshots.set(file, prior);
    const rows = prior ? JSON.parse(prior.toString('utf8').replace(/^\uFEFF/, '')) : [];
    if (!Array.isArray(rows)) throw new Error('Unexpected QA budgets fixture');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify([...rows, presupuesto], null, 2));
  }
});
test.afterAll(() => {
  borrarFiesta(id);
  for (const [file, prior] of snapshots) {
    if (prior) fs.writeFileSync(file, prior);
    else if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

test.beforeEach(async ({ context, baseURL }) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'firebaseinstallations.googleapis.com' && url.pathname.startsWith('/v1/projects/demo-ak-producciones/installations')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        fid: 'cQA135localinstallation00', refreshToken: 'synthetic-no-real-account',
        authToken: { token: 'synthetic-no-real-account', expiresIn: '604800s' },
        token: 'synthetic-no-real-account', expiresIn: '604800s',
      }) });
    }
    return ['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addInitScript(() => { Reflect.deleteProperty(Navigator.prototype, 'serviceWorker'); });
  await ponerSesionDelEquipo(context, baseURL);
});

test('cocina: evento y porciones reales, recarga y salida de impresion', async ({ page }, info) => {
  await page.goto(`/fiestas/nueva/catering/hoja-de-cocina?fiestaId=${id}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Cocina y salon QA135', exact: true })).toBeVisible();
  for (const [dish, amount] of [['Entrada QA135', 100], ['Principal QA135', 80], ['Infantil QA135', 20], ['Postre QA135', 100]] as const) {
    const row = page.getByRole('row').filter({ hasText: dish });
    await expect(row.getByRole('cell').nth(2)).toContainText(String(amount));
  }
  await expect(page.getByText('Celiaco', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toContainText('5 confirmaron');
  await expect(page.getByText('Vegano', { exact: true })).toHaveCount(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('row').filter({ hasText: 'Principal QA135' })).toContainText('80');
  await page.evaluate(() => { (window as any).__qaPrintCalls = 0; window.print = () => { (window as any).__qaPrintCalls++; }; });
  await page.getByRole('button', { name: 'Imprimir para la cocina' }).click();
  expect(await page.evaluate(() => (window as any).__qaPrintCalls)).toBe(1);
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ path: info.outputPath('hoja-cocina.pdf'), format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(2000);
  await info.attach('hoja-cocina.pdf', { body: pdf, contentType: 'application/pdf' });
  await info.attach('cabecera-impresion.json', { body: JSON.stringify(await page.evaluate(() => {
    const name = document.querySelector('h1');
    const header = name?.closest('header');
    return { text: name?.textContent, headerDisplay: header ? getComputedStyle(header).display : null,
      headingBox: name?.getBoundingClientRect().toJSON(), printMode: matchMedia('print').matches };
  })), contentType: 'application/json' });
  await expect(page.getByRole('heading', { name: 'Cocina y salon QA135', exact: true })).toBeVisible();
});

test('agenda: revisar sin Google conectado responde y no rompe la pantalla', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack || error.message));
  await page.goto('/settings/sincronizaciones', { waitUntil: 'domcontentloaded' });
  const card = page.getByTestId('limpiar-agenda');
  await expect(card).toBeVisible();
  await expect(card).toContainText(/personales no se tocan/i);
  await card.getByRole('button', { name: /revisar mi agenda/i }).click();
  await expect(page.locator('body')).toContainText(/no est[aá] conectada|no se pudo mirar la agenda/i);
  await info.attach('agenda.json', { body: JSON.stringify({ errors, observed: await card.innerText(), realGoogle: false }), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('DJ: la cancion opcional persistida aparece tambien tras recargar', async ({ page }) => {
  await page.goto(`/evento/dj/${id}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Opcional QA135 - Artista QA135', { exact: true })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Opcional QA135 - Artista QA135', { exact: true })).toBeVisible();
});

async function pixels(page: Page) {
  return page.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height;
    const ctx = copy.getContext('2d'); if (!ctx) throw new Error('Canvas reader missing');
    ctx.drawImage(canvas, 0, 0);
    const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
    const colors = new Set<string>();
    for (let i = 0; i < data.length; i += 256) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    return { colors: colors.size, width: canvas.width, height: canvas.height, image: canvas.toDataURL() };
  });
}

test('salon 3D: canvas real no blanco y giro, sin aceptar imagen de respaldo', async ({ page, context, isMobile }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await context.clearCookies();
  await page.goto(`/portal-cliente/${id}`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="password"]').fill('clave-ficticia-qa135');
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  expect((await context.cookies()).some((cookie) => cookie.name === 'ak_session')).toBe(false);
  await page.goto(`/portal/${id}/decoracion`, { waitUntil: 'domcontentloaded' });
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 45_000 });
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await pixels(page)).colors, { timeout: 20_000 }).toBeGreaterThan(20);
  const before = await pixels(page);
  expect(before.width).toBeGreaterThan(100); expect(before.height).toBeGreaterThan(100);
  const box = await canvas.boundingBox(); if (!box) throw new Error('No visible canvas bounds');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  if (isMobile) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + i * 5, y: y + i }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
  } else {
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 65, y + 20, { steps: 10 }); await page.mouse.up();
  }
  await page.waitForTimeout(800);
  const after = await pixels(page);
  expect(after.colors).toBeGreaterThan(20); expect(after.image).not.toBe(before.image);
  expect(errors).toEqual([]);
  await info.attach('salon-3d.png', { body: await canvas.screenshot(), contentType: 'image/png' });
  await info.attach('salon-3d.json', { body: JSON.stringify({ before: { ...before, image: undefined }, after: { ...after, image: undefined }, errors }), contentType: 'application/json' });
});
