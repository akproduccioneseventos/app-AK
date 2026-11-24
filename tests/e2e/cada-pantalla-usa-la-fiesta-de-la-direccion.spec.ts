import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo, crearFiestaDeEstaNoche, borrarFiesta, guardarFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = 'fiesta-orden-338-prueba';

test.beforeAll(async () => {
  const fiesta = crearFiestaDeEstaNoche({
    id: FIESTA_ID,
  });
  fiesta.configuracion.nombreEvento = 'Fiesta E2E Orden 338';
  guardarFiesta(fiesta);
});

test.afterAll(async () => {
  borrarFiesta(FIESTA_ID);
});

test.describe('Orden 338 - Cada pantalla usa la fiesta de la dirección', () => {
  test('verificar pantallas sin fiestaId y con fiestaId real', async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    // 1. /fiestas/nueva/show?tab=video-vida sin fiestaId
    await page.goto('/fiestas/nueva/show?tab=video-vida', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Abrí esta pantalla desde una fiesta/i).first()).toBeVisible({ timeout: 15_000 });
    const enlaceEventos = page.locator('a[href="/eventos"]').first();
    await expect(enlaceEventos).toBeVisible();
    await expect(page.locator('body')).not.toContainText('fiesta_muestra_auditor');

    // 2. /fiestas/nueva/show?tab=entretenimiento&subtab=control sin fiestaId
    await page.goto('/fiestas/nueva/show?tab=entretenimiento&subtab=control', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Abrí esta pantalla desde una fiesta/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('a[href="/eventos"]').first()).toBeVisible();
    expect(await page.locator('a[href*="undefined"]').count()).toBe(0);

    // 3. Con ?fiestaId=${FIESTA_ID} en ambas rutas
    await page.goto(`/fiestas/nueva/show?tab=video-vida&fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain(`fiestaId=${FIESTA_ID}`);
    expect(await page.locator('a[href*="undefined"]').count()).toBe(0);
    await expect(page.locator('body')).not.toContainText('fiesta_muestra_auditor');
    await expect(page.locator('text=Fiesta E2E Orden 338').first()).toBeVisible({ timeout: 15_000 });

    await page.goto(`/fiestas/nueva/show?tab=entretenimiento&subtab=control&fiestaId=${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain(`fiestaId=${FIESTA_ID}`);
    expect(await page.locator('a[href*="undefined"]').count()).toBe(0);
    await expect(page.locator('body')).not.toContainText('fiesta_muestra_auditor');
  });
});
