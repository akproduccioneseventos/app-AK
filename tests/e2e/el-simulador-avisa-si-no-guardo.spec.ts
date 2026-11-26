import { test, expect } from '@playwright/test';
import { borrarPresupuestosDePrueba, borrarProspectosDePrueba } from './helpers/fiesta-de-prueba';

test.afterAll(() => {
  borrarProspectosDePrueba();
  borrarPresupuestosDePrueba();
});

test('Orden 361: el simulador avisa cuando falla el autoguardado y muestra Reintentar', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

  const startBtn = page.getByRole('button', { name: /Armar mi presupuesto|Comenzar mi presupuesto|Cotizar/i }).first();
  await expect(startBtn).toBeVisible({ timeout: 45_000 });
  await startBtn.click();

  await expect(page.locator('#simulator-name')).toBeVisible({ timeout: 30_000 });
  await page.locator('#simulator-name').fill('Prospecto de prueba Simulador Falla');
  await page.locator('#simulator-phone').fill('099 123 456');

  await page.getByText('Más de 4 horas').first().click();
  await page.getByText('Tengo salón o locación propia').first().click();

  const adultos = page.locator('input[type="number"]').first();
  await adultos.fill('80');

  const calendario = page.getByRole('button', { name: /fecha|Elegí|Seleccion/i }).first();
  if (await calendario.isVisible().catch(() => false)) {
    await calendario.click();
    const siguiente = page.getByRole('button', { name: /next month|mes siguiente/i }).first();
    if (await siguiente.isVisible().catch(() => false)) await siguiente.click();
    const dia = page.getByRole('grid').getByRole('button', { name: /\b15\b/, disabled: false }).first();
    if (await dia.isVisible().catch(() => false)) await dia.click();
  }

  for (let paso = 0; paso < 3; paso += 1) {
    const continuar = page.getByRole('button', { name: 'Continuar' }).first();
    if (!(await continuar.isVisible().catch(() => false))) break;
    await expect(continuar).toBeEnabled({ timeout: 20_000 });
    await continuar.click();
    await page.waitForTimeout(1_500);
  }

  const mantener = page.getByRole('button', { name: /Mantener mi selección actual/i }).first();
  if (await mantener.isVisible().catch(() => false)) {
    await mantener.click();
    await page.waitForTimeout(1_000);
  }

  // Generar presupuesto para entrar al resumen final y luego cortar el autoguardado de syncBudgetChanges
  const verResumen = page.getByRole('button', { name: /Ver Resumen y Propuesta/i }).first();
  await expect(verResumen).toBeVisible({ timeout: 20_000 });
  await expect(verResumen).toBeEnabled({ timeout: 20_000 });
  await verResumen.click();

  await expect(page.getByText(/Esta es tu fiesta, y este es tu presupuesto estimado/i)).toBeVisible({ timeout: 30_000 });

  // Cortar llamadas POST mientras el useEffect (1s) dispara syncBudgetChanges
  await page.route('**/simulador-de-presupuesto*', async (route) => {
    if (route.request().method() === 'POST') {
      await route.abort();
    } else {
      await route.continue();
    }
  });

  const alerta = page.getByTestId('simulador-error-guardado');
  await expect(alerta).toBeVisible({ timeout: 15_000 });
  await expect(alerta).toContainText(/No pudimos guardar el cambio en el presupuesto/i);
  const reintentar = alerta.getByRole('button', { name: /Reintentar/i });
  await expect(reintentar).toBeVisible();

  await page.unroute('**/simulador-de-presupuesto*');
  await reintentar.click();
  await expect(alerta).not.toBeVisible({ timeout: 20_000 });
});
