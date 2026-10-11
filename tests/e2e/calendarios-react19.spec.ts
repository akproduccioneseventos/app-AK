import { expect, test, type Locator } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.skip(process.env.AK_ENTORNO_AISLADO !== 'true', 'Solo entorno aislado, sin cuentas reales');
const monthName = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) \d{4}$/;

async function headerDoesNotOverlap(caption: Locator, next: Locator) {
  const label = await caption.boundingBox();
  const button = await next.boundingBox();
  expect(label).not.toBeNull();
  expect(button).not.toBeNull();
  if (label && button) {
    const overlapX = Math.min(label.x + label.width, button.x + button.width) - Math.max(label.x, button.x);
    const overlapY = Math.min(label.y + label.height, button.y + button.height) - Math.max(label.y, button.y);
    expect(overlapX > 0 && overlapY > 0, 'El mes no tapa el control de navegacion').toBe(false);
  }
}

test('agenda: elegir dia y navegar meses sin tapar los controles', async ({ page, context, baseURL }, info) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/contabilidad/crm/agenda', { waitUntil: 'domcontentloaded' });
  const grid = page.getByRole('grid').first();
  await expect(grid).toBeVisible();
  const caption = page.getByText(monthName, { exact: true }).first();
  const next = page.getByRole('button', { name: 'Ir al mes siguiente' });
  await headerDoesNotOverlap(caption, next);
  await headerDoesNotOverlap(caption, page.getByRole('button', { name: 'Ir al mes anterior' }));
  const initialMonth = await caption.textContent();
  await next.click();
  await expect(caption).not.toHaveText(initialMonth!);
  const selectedDay = grid.locator('td[data-day]:not([data-outside]) button').filter({ hasText: /^9$/ }).first();
  await selectedDay.click();
  await expect(selectedDay.locator('..')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(/^Reuniones para:/)).toContainText('9');
  await info.attach('agenda-calendario.png', { body: await grid.locator('..').screenshot(), contentType: 'image/png' });
});

test('redes: calendario visible y navegacion mensual', async ({ page, context, baseURL }, info) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: 'Calendario', exact: true }).click();
  const panel = page.getByRole('tabpanel');
  await expect(panel.getByRole('grid')).toBeVisible();
  const caption = panel.getByText(monthName, { exact: true });
  const next = panel.getByRole('button', { name: 'Ir al mes siguiente' });
  await headerDoesNotOverlap(caption, next);
  await headerDoesNotOverlap(caption, panel.getByRole('button', { name: 'Ir al mes anterior' }));
  const initialMonth = await caption.textContent();
  await next.click();
  await expect(caption).not.toHaveText(initialMonth!);
  await panel.getByRole('button', { name: 'Ir al mes anterior' }).click();
  await expect(caption).toHaveText(initialMonth!);
  await info.attach('redes-calendario.png', { body: await panel.screenshot(), contentType: 'image/png' });
});
