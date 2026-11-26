import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_fotocabina_impresion_${Date.now()}` });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test('la impresión fallida muestra el aviso de impresión y no dice que la foto se perdió', async ({ page, context }, testInfo) => {
  test.setTimeout(150_000);
  const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
  await ponerSesionDelEquipo(context, baseURL);
  await enchufarCamaraFalsa(page);
  await page.addInitScript(() => {
    window.open = () => null;
  });

  const permiso = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
  await page.goto(`/evento/fotocabina/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-testid="preview-canvas"]')).toBeVisible({ timeout: 30_000 });

  let hayCamara = false;
  for (let intento = 0; intento < 20 && !hayCamara; intento += 1) {
    hayCamara = await page.evaluate(() => Boolean(document.querySelector('video')?.srcObject));
    if (!hayCamara) await page.waitForTimeout(500);
  }
  expect(hayCamara).toBe(true);

  const disparar = page.getByTestId('boton-sacar-foto');
  await expect(disparar).toBeEnabled({ timeout: 20_000 });
  await disparar.click();

  await expect(page.locator('img[alt="Captura Final"]')).toBeVisible({ timeout: 90_000 });

  const publicarBtn = page.getByRole('button', { name: /Publicar en el muro|Publicar/i });
  if (await publicarBtn.count()) {
    await publicarBtn.first().click();
  }

  await expect(page.getByText(/Tu recuerdo está listo/i)).toBeVisible({ timeout: 30_000 });

  const btnImprimir = page.getByRole('button', { name: /Imprimir mi recuerdo|Quiero otra copia/i }).first();
  await expect(btnImprimir).toBeVisible({ timeout: 20_000 });
  await btnImprimir.click();

  const avisoImpresion = page.locator('[data-testid="aviso-impresion"]');
  await expect(avisoImpresion).toBeVisible({ timeout: 10_000 });
  await expect(avisoImpresion).toContainText(/bloque[oó]|imprimir|operador/i);
  await expect(page.getByText(/No se pudo publicar/i)).toHaveCount(0);
  await expect(page.getByText(/no lleg[oó] al muro/i)).toHaveCount(0);
});
