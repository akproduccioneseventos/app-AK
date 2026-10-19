import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true' || process.env.AK_USE_LOCAL_JSON_ONLY !== 'true', 'QA ficticio local');
const ids: string[] = [];
test.afterEach(() => { while (ids.length) borrarFiesta(ids.pop()!); });
test('fecha civil del evento se conserva en hoja de cocina y modo impresion', async ({ page, context, baseURL }, info) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'firebaseinstallations.googleapis.com') return route.fulfill({ status: 200,
      contentType: 'application/json', body: JSON.stringify({ fid: 'cQA143localinstallation00', refreshToken: 'synthetic',
        authToken: { token: 'synthetic', expiresIn: '604800s' }, token: 'synthetic', expiresIn: '604800s' }) });
    return ['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)
      ? route.continue() : route.abort('blockedbyclient');
  });
  await ponerSesionDelEquipo(context, baseURL);
  const date = '2027-08-08';
  const id = `e2e_143_${info.project.name}_${Date.now()}`;
  const fiesta = crearFiestaDeEstaNoche({ id, fechaEvento: date });
  fiesta.configuracion.nombreEvento = 'Fecha cocina QA143';
  delete fiesta.presupuestoId;
  guardarFiesta(fiesta); ids.push(id);
  await page.goto(`/fiestas/nueva/catering/hoja-de-cocina?fiestaId=${id}`, { waitUntil: 'domcontentloaded' });
  const header = page.locator('header.cabecera-documento');
  await expect(header.getByRole('heading', { name: 'Fecha cocina QA143', exact: true })).toBeVisible();
  const screen = await header.innerText();
  await page.emulateMedia({ media: 'print' });
  const printed = await header.innerText();
  const timezone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  await info.attach('fecha.json', { contentType: 'application/json', body: Buffer.from(JSON.stringify({
    fixtureDate: fiesta.configuracion.fechaEvento, expected: '08/08/2027', screen, printed, timezone,
  })) });
  await info.attach('cabecera.jpeg', { contentType: 'image/jpeg', body: await header.screenshot({ type: 'jpeg', quality: 65, timeout: 5000 }) });
  expect(screen).toContain('08/08/2027');
  expect(printed).toContain('08/08/2027');
});
