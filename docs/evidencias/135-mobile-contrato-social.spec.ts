import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

test.use({ serviceWorkers: 'block' });

test.skip(
  process.env.AK_ENTORNO_AISLADO !== 'true'
    || process.env.AK_USE_LOCAL_JSON_ONLY !== 'true'
    || process.env.PLAYWRIGHT_BASE_URL !== 'http://127.0.0.1:3300',
  'Requires the disposable synthetic QA runner on localhost.',
);

test.beforeEach(async ({ context }, testInfo) => {
  await context.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'serviceWorker');
  });
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (/^https?:$/.test(url.protocol) && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      await testInfo.attach('blocked-external-url', {
        contentType: 'text/plain',
        body: `${url.origin}${url.pathname}`,
      });
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
});

const ids: string[] = [];
const clavePortal = 'clave-ficticia-qa135-responsive';

function sembrarFiesta() {
  if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Synthetic isolated QA only');
  const id = `e2e_qa135_contrato_responsive_${crypto.randomUUID()}`;
  ids.push(id);
  const fiesta: any = crearFiestaDeEstaNoche({ id, clavePortal });
  fiesta.estado = 'Presupuestada';
  fiesta.configuracion.fechaEvento = '2027-08-08';
  fiesta.contratoServicioTexto = 'CONTRATO FICTICIO QA135 RESPONSIVE. Sin validez ni cobros.';
  fiesta.contratoDatos = { ...fiesta.contratoDatos, planPagos: { activo: false } };
  delete fiesta.contratoFirmaInfo;
  delete fiesta.firmaDigitalConstancia;
  guardarFiesta(fiesta);
  return id;
}

test.afterEach(() => {
  while (ids.length) borrarFiesta(ids.pop()!);
});

test('171 contrato: conserva título, firma y texto del botón PDF dentro del celular', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.endsWith('mobile'), 'Auditoría de disposición móvil');
  const id = sembrarFiesta();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/portal-cliente/${id}`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="password"]').fill(clavePortal);
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.goto(`/portal/${id}/contrato`, { waitUntil: 'domcontentloaded' });
  await page.locator('#input-nombre-firmante').fill('Titular Ficticio QA135');
  await page.locator('#acceptedTerms').check();
  await page.getByRole('button', { name: 'Dejar Constancia de Firma Digital', exact: true }).click();
  await expect(page.getByText('Constancia de Firma', { exact: true })).toBeVisible();

  const metrics = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const titleElement = document.querySelector('h1');
    const titleBox = titleElement?.getBoundingClientRect();
    const lineHeight = titleElement ? Number.parseFloat(getComputedStyle(titleElement).lineHeight) : 0;
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('IMPRIMIR / DESCARGAR CONTRATO'));
    const buttonBox = button?.getBoundingClientRect();
    const range = document.createRange();
    if (button) range.selectNodeContents(button);
    const contentBox = button ? range.getBoundingClientRect() : null;
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      titleText: titleElement?.textContent?.trim(),
      titleLines: titleBox && lineHeight ? Math.round(titleBox.height / lineHeight) : null,
      signatureName: rect('p.font-dancing'),
      titularLabel: [...document.querySelectorAll('p')]
        .find((p) => p.textContent?.trim() === 'Firma del Titular')?.getBoundingClientRect().toJSON() ?? null,
      button: buttonBox?.toJSON() ?? null,
      buttonText: contentBox?.toJSON() ?? null,
    };
  });
  console.log(`QA135_CONTRATO_MOBILE_LAYOUT ${JSON.stringify(metrics)}`);
  await page.screenshot({ path: testInfo.outputPath('qa135-contrato-mobile-layout.png'), fullPage: true });

  expect(metrics.documentWidth, 'No debe exigir desplazamiento horizontal').toBeLessThanOrEqual(metrics.viewportWidth + 2);
  expect(metrics.titleLines, 'El título no debe fragmentarse en tres líneas en celular').toBeLessThanOrEqual(2);
  const name = metrics.signatureName;
  const label = metrics.titularLabel;
  expect(name, 'La firma debe existir para medirla').not.toBeNull();
  expect(label, 'La etiqueta debe existir para medirla').not.toBeNull();
  expect(metrics.button, 'El boton PDF debe existir para medirlo').not.toBeNull();
  expect(metrics.buttonText, 'El texto PDF debe existir para medirlo').not.toBeNull();
  const overlaps = Boolean(name && label && name.right > label.left && name.left < label.right && name.bottom > label.top && name.top < label.bottom);
  expect(overlaps, 'El nombre/sello digital no debe tapar "Firma del Titular"').toBe(false);
  expect(metrics.buttonText?.left, 'El texto del botón PDF debe quedar dentro del botón').toBeGreaterThanOrEqual((metrics.button?.left ?? 0) - 1);
  expect(metrics.buttonText?.right, 'El texto del botón PDF debe quedar dentro del botón').toBeLessThanOrEqual((metrics.button?.right ?? 0) + 1);
});

test('172 red social: el dock no tapa el encabezado Evento al abrir en celular', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.endsWith('mobile'), 'Auditoría de disposición móvil');
  const baseURL = testInfo.project.use.baseURL as string | undefined;
  await ponerSesionDelEquipo(page.context(), baseURL);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/empresa/red-social-eventos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('columnheader', { name: 'Evento', exact: true })).toBeVisible();

  const metrics = await page.evaluate(() => {
    const header = [...document.querySelectorAll('th')].find((item) => item.textContent?.trim() === 'Evento');
    const dock = document.querySelector('[class*="fixed"][class*="bottom-"][class*="left-"]');
    const rect = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      header: rect(header),
      dock: rect(dock),
    };
  });
  console.log(`QA135_SOCIAL_DOCK_LAYOUT ${JSON.stringify(metrics)}`);
  await page.screenshot({ path: testInfo.outputPath('qa135-social-dock-mobile.png'), fullPage: true });

  expect(metrics.header, 'Debe estar presente el encabezado Evento de Feeds de Eventos').not.toBeNull();
  expect(metrics.dock, 'Debe estar presente el dock fijo de navegación del módulo').not.toBeNull();
  expect(metrics.documentWidth, 'La comparación no debe introducir desplazamiento horizontal').toBeLessThanOrEqual(metrics.viewportWidth + 2);
  const header = metrics.header!;
  const dock = metrics.dock!;
  const overlapWidth = Math.max(0, Math.min(header.right, dock.right) - Math.max(header.left, dock.left));
  const overlapHeight = Math.max(0, Math.min(header.bottom, dock.bottom) - Math.max(header.top, dock.top));
  expect(overlapWidth * overlapHeight, 'El dock no debe cubrir el encabezado Evento').toBe(0);
});
