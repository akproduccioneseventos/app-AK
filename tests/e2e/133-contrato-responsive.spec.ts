import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

const ids: string[] = [];
const clave = 'clave-ficticia-qa133-responsive';

function sembrar() {
  if (process.env.AK_ENTORNO_AISLADO !== 'true') throw new Error('Synthetic isolated QA only');
  const id = `e2e_qa133_contrato_responsive_${crypto.randomUUID()}`;
  ids.push(id);
  const fiesta: any = crearFiestaDeEstaNoche({ id, clavePortal: clave });
  fiesta.estado = 'Presupuestada';
  fiesta.configuracion.fechaEvento = '2027-08-08';
  fiesta.contratoServicioTexto = 'CONTRATO FICTICIO QA133 RESPONSIVE. Sin validez ni cobros.';
  fiesta.contratoDatos = { ...fiesta.contratoDatos, planPagos: { activo: false } };
  delete fiesta.contratoFirmaInfo;
  delete fiesta.firmaDigitalConstancia;
  guardarFiesta(fiesta);
  return id;
}

test.afterEach(() => { while (ids.length) borrarFiesta(ids.pop()!); });

test('contrato firmado mantiene título, firma y botón imprimible dentro del celular', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.endsWith('mobile'), 'Auditoría de disposición móvil');
  const id = sembrar();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/portal-cliente/${id}`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="password"]').fill(clave);
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.goto(`/portal/${id}/contrato`, { waitUntil: 'domcontentloaded' });
  await page.locator('#input-nombre-firmante').fill('Titular Ficticio QA133');
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
      titularLabel: [...document.querySelectorAll('p')].find((p) => p.textContent?.trim() === 'Firma del Titular')?.getBoundingClientRect().toJSON() ?? null,
      button: buttonBox?.toJSON() ?? null,
      buttonText: contentBox?.toJSON() ?? null,
    };
  });
  console.log(`CONTRATO_MOBILE_LAYOUT ${JSON.stringify(metrics)}`);
  await page.screenshot({ path: testInfo.outputPath('contrato-mobile-layout.png'), fullPage: true });

  expect(metrics.documentWidth, 'No debe exigir desplazamiento horizontal').toBeLessThanOrEqual(metrics.viewportWidth + 2);
  expect(metrics.titleLines, 'El título no debe fragmentarse en tres líneas en celular').toBeLessThanOrEqual(2);
  const name = metrics.signatureName;
  const label = metrics.titularLabel;
  const overlaps = Boolean(name && label && name.right > label.left && name.left < label.right && name.bottom > label.top && name.top < label.bottom);
  expect(overlaps, 'El nombre/sello digital no debe tapar "Firma del Titular"').toBe(false);
  expect(metrics.buttonText?.left, 'El texto del botón PDF debe quedar dentro del botón').toBeGreaterThanOrEqual((metrics.button?.left ?? 0) - 1);
  expect(metrics.buttonText?.right, 'El texto del botón PDF debe quedar dentro del botón').toBeLessThanOrEqual((metrics.button?.right ?? 0) + 1);
});
