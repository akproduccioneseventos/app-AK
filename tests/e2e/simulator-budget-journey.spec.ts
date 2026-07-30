import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const MUTABLE_FILES = [
  'data/presupuestos.json',
  'src/data/presupuestos.json',
  'data/crm-leads.json',
  'src/data/crm-leads.json',
  'data/notifications.json',
  'src/data/notifications.json',
];

const snapshots = new Map<string, Buffer | null>();

test.beforeAll(() => {
  for (const relativePath of MUTABLE_FILES) {
    const absolutePath = path.join(process.cwd(), relativePath);
    snapshots.set(
      absolutePath,
      fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null,
    );
  }
});

test.afterAll(() => {
  for (const [absolutePath, snapshot] of snapshots) {
    if (snapshot === null) fs.rmSync(absolutePath, { force: true });
    else fs.writeFileSync(absolutePath, snapshot);
  }
});

test('prospect completes the simulator and downloads a formal future-year PDF', async ({ page }) => {
  test.setTimeout(240_000);
  const targetYear = new Date().getFullYear() + 1;
  const outputPath = path.join(process.cwd(), 'test-results', 'simulator-budget-download.pdf');

  const response = await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await page.getByTestId('simulator-cover-start').click();

  await expect(page.getByText(/Paso 1 de 5/i)).toBeVisible();
  await page.getByRole('button', { name: /Continuar/i }).click();

  await page.locator('#simulator-name').fill('Prospecto E2E AK');
  await page.locator('#simulator-phone').fill('099 765 432');
  await page.locator('input[type="number"]').first().fill('80');
  await page.getByRole('button', { name: /Tengo sal[oó]n o locaci[oó]n propia/i }).click();

  await page.getByRole('button', { name: /Selecciona una fecha/i }).click();
  const nextMonth = page.locator('button[name="next-month"]');
  for (let month = 0; month < 12; month += 1) await nextMonth.click();
  await page.locator('button[name="day"]:not([disabled])').filter({ hasText: /^15$/ }).first().click();
  await page.waitForFunction(() => !document.body.innerText.includes('Verificando disponibilidad'));

  await page.getByRole('button', { name: /Continuar/i }).click();
  await expect(page.getByText(/Paso 3 de 5/i)).toBeVisible();
  await page.getByRole('button', { name: /Continuar/i }).click();

  await expect(page.getByText(/Paso 4 de 5/i)).toBeVisible();
  const expandPackage = page.getByRole('button', { name: /Ver todo/i }).first();
  if (await expandPackage.isVisible()) {
    await expandPackage.click();
    await expect(page.getByRole('button', { name: /Ver resumen/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Ver resumen/i }).first().click();
  }
  await page.getByRole('button', { name: /Continuar/i }).click();

  // La sugerencia de paquete superior se abre medio segundo despues de entrar al
  // paso 5. Se espera de forma explicita para que el recorrido no dependa del
  // instante exacto en que aparece.
  const keepSelection = page.getByRole('button', { name: /Mantener mi selecci[oó]n actual/i });
  await keepSelection.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  if (await keepSelection.isVisible().catch(() => false)) {
    await keepSelection.click();
    await keepSelection.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
  }

  await expect(page.getByText(/Paso 5 de 5/i)).toBeVisible();
  await expect(page.getByText(new RegExp(`ajuste anual proyectado.*${targetYear}`, 'i')).first()).toBeVisible();
  await expect(page.getByText(/p\/p|por persona/i).first()).toBeVisible();
  await page.getByRole('button', { name: /Generar presupuesto/i }).click();

  await expect(page.getByRole('heading', { name: /Tu presupuesto est[aá] listo/i })).toBeVisible();
  await expect(page.getByText(/15 minutos/i).first()).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Guardar PDF/i }).click();
  const download = await downloadPromise;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await download.saveAs(outputPath);

  expect(download.suggestedFilename()).toMatch(/presupuesto.*\.pdf$/i);
  expect(fs.statSync(outputPath).size).toBeGreaterThan(5_000);
  await page.waitForTimeout(1_000);
});
