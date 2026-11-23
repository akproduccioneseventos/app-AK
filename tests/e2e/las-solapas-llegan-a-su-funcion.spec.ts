import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

let fiestaId = '';

test.beforeAll(() => {
  const fiesta = crearFiestaDeEstaNoche({
    id: `e2e_solapas_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
  });
  guardarFiesta(fiesta);
  fiestaId = fiesta.id;
});

test.afterAll(() => {
  if (fiestaId) borrarFiesta(fiestaId);
});

test.describe('Orden 335 — Las solapas internas mantienen tab y usan subtab', () => {
  test('desde Operación → Itinerario abre Imprimir / PDF con subtab=pdf y vuelve a Itinerario', async ({
    context,
    page,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(
      `/fiestas/nueva/operacion?fiestaId=${encodeURIComponent(fiestaId)}&tab=itinerario`,
      { waitUntil: 'domcontentloaded' },
    );

    await expect(page.getByRole('heading', { name: 'Cronograma de la Fiesta' })).toBeVisible();

    await page.getByRole('button', { name: 'Imprimir / PDF', exact: true }).click();

    await expect(page).toHaveURL(/subtab=pdf/);
    const urlPdf = new URL(page.url());
    expect(urlPdf.pathname).toBe('/fiestas/nueva/operacion');
    expect(urlPdf.searchParams.get('fiestaId')).toBe(fiestaId);
    expect(urlPdf.searchParams.get('tab')).toBe('itinerario');
    expect(urlPdf.searchParams.get('subtab')).toBe('pdf');

    await expect(page.getByRole('button', { name: 'Imprimir / Guardar PDF' })).toBeVisible();

    await page.locator('button:not([role="tab"])', { hasText: /^Itinerario$/ }).click();

    await expect(page).toHaveURL(/subtab=itinerario/);
    const urlItinerario = new URL(page.url());
    expect(urlItinerario.pathname).toBe('/fiestas/nueva/operacion');
    expect(urlItinerario.searchParams.get('tab')).toBe('itinerario');
    expect(urlItinerario.searchParams.get('subtab')).toBe('itinerario');

    await expect(page.getByRole('heading', { name: 'Cronograma de la Fiesta' })).toBeVisible();
  });

  test('URLs redirigidas viejas permiten cambiar de subtab y conservan Atrás / Adelante', async ({
    context,
    page,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(
      `/fiestas/nueva/itinerario/pdf?fiestaId=${encodeURIComponent(fiestaId)}`,
      { waitUntil: 'domcontentloaded' },
    );

    await expect(page).toHaveURL(/\/fiestas\/nueva\/operacion/);
    const urlRedirPdf = new URL(page.url());
    expect(urlRedirPdf.searchParams.get('tab')).toBe('itinerario');
    expect(urlRedirPdf.searchParams.get('subtab')).toBe('pdf');
    await expect(page.getByRole('button', { name: 'Imprimir / Guardar PDF' })).toBeVisible();

    await page.locator('button:not([role="tab"])', { hasText: /^Itinerario$/ }).click();
    await expect(page).toHaveURL(/subtab=itinerario/);
    await expect(page.getByRole('heading', { name: 'Cronograma de la Fiesta' })).toBeVisible();

    await page.goto(
      `/fiestas/nueva/catering/lista-compras?fiestaId=${encodeURIComponent(fiestaId)}`,
      { waitUntil: 'domcontentloaded' },
    );

    await expect(page).toHaveURL(/\/fiestas\/nueva\/comida/);
    const urlRedirCompras = new URL(page.url());
    expect(urlRedirCompras.searchParams.get('tab')).toBe('catering');
    expect(urlRedirCompras.searchParams.get('subtab')).toBe('compras');
    await expect(page.getByRole('heading', { name: 'Lista de Compras y Pedidos' })).toBeVisible();

    await page.getByRole('button', { name: 'Hoja de cocina', exact: true }).click();
    await expect(page).toHaveURL(/subtab=cocina/);
    const urlCocina = new URL(page.url());
    expect(urlCocina.searchParams.get('tab')).toBe('catering');
    expect(urlCocina.searchParams.get('subtab')).toBe('cocina');
    await expect(page.getByRole('button', { name: 'Imprimir para la cocina' })).toBeVisible();

    await page.getByRole('button', { name: 'Catering y menú', exact: true }).click();
    await expect(page).toHaveURL(/subtab=catering/);
    const urlCatering = new URL(page.url());
    expect(urlCatering.searchParams.get('tab')).toBe('catering');
    expect(urlCatering.searchParams.get('subtab')).toBe('catering');
    await expect(page.getByRole('heading', { name: 'Gastronomía del Evento' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/fiestas\/nueva\/operacion/);
    const urlBack = new URL(page.url());
    expect(urlBack.searchParams.get('tab')).toBe('itinerario');
    expect(urlBack.searchParams.get('subtab')).toBe('itinerario');
    await expect(page.getByRole('heading', { name: 'Cronograma de la Fiesta' })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/fiestas\/nueva\/comida/);
    const urlForward = new URL(page.url());
    expect(urlForward.searchParams.get('tab')).toBe('catering');
    expect(urlForward.searchParams.get('subtab')).toBe('catering');
    await expect(page.getByRole('heading', { name: 'Gastronomía del Evento' })).toBeVisible();
  });
});
