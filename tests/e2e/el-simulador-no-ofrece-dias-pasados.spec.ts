import { expect, test } from '@playwright/test';

function ayerEnUruguayIso(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const y = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const m = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1;
  const d = parseInt(parts.find((p) => p.type === 'day')!.value, 10);
  const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

test('Orden 295: el simulador deshabilita el día de ayer en el calendario y no permite elegirlo', async ({ page }) => {
  await page.goto('/simulador-de-presupuesto?tipo=boda&guests=50', { waitUntil: 'domcontentloaded' });

  const firstStepCta = page.getByTestId('simulator-first-step-cta');
  await expect(firstStepCta).toBeVisible({ timeout: 15_000 });
  await firstStepCta.click();

  const dateButton = page.getByRole('button', { name: /Selecciona una fecha/i });
  await expect(dateButton).toBeVisible({ timeout: 15_000 });
  await dateButton.click();

  const ayerIso = ayerEnUruguayIso();
  const hoyParts = ayerIso.split('-').map(Number);
  const ahoraParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const mesActual = parseInt(ahoraParts.find((p) => p.type === 'month')!.value, 10);

  // Si ayer pertenece al mes anterior (ej. hoy es día 1), retrocedemos un mes en el calendario para verificarlo.
  if (hoyParts[1] !== mesActual) {
    const prevButton = page.getByRole('button', { name: /previous month|mes anterior/i }).first();
    if (await prevButton.isVisible()) {
      await prevButton.click();
    }
  }

  const celdaAyer = page.locator(`[data-day="${ayerIso}"]`);
  await expect(celdaAyer).toBeVisible({ timeout: 10_000 });
  const botonAyer = celdaAyer.locator('button');
  await expect(botonAyer).toBeDisabled();
});
