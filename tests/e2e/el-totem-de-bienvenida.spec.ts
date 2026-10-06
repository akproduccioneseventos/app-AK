import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

test.describe('El tótem de bienvenida interactivo', () => {
  let fiesta: ReturnType<typeof crearFiestaDeEstaNoche>;

  test.beforeEach(async ({ page }) => {
    fiesta = crearFiestaDeEstaNoche();
    guardarFiesta(fiesta);
    await enchufarCamaraFalsa(page);
  });

  test.afterEach(() => {
    if (fiesta?.id) borrarFiesta(fiesta.id);
  });

  test('Sin QR muestra la pantalla de espera con Acercá el QR', async ({ page }) => {
    await page.goto(`/evento/bienvenida/${fiesta.id}`);
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible();
    await expect(page.locator('#respaldo-qr-input')).toBeVisible();
  });

  test('Con un QR bueno muestra ¡Hola, {nombre}! y el número de mesa del invitado', async ({ page }) => {
    await page.goto(`/evento/bienvenida/${fiesta.id}`);
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible();

    const invitado = fiesta.invitados![0];
    const qrBueno = `https://akproducciones.uy/invitacion/${fiesta.id}?guestId=${invitado.id}&token=${invitado.guestAccessToken}`;

    await page.fill('#respaldo-qr-input', qrBueno);
    await page.click('button:has-text("Leer")');

    await expect(page.locator(`text=¡Hola, ${invitado.nombre}!`)).toBeVisible();
    await expect(page.locator(`text=Mesa ${invitado.tableNumber}`)).toBeVisible();
  });

  test('Con un QR de otra fiesta o token malo muestra cartel de error y no saluda', async ({ page }) => {
    await page.goto(`/evento/bienvenida/${fiesta.id}`);
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible();

    // QR de otra fiesta
    const qrOtraFiesta = `https://akproducciones.uy/invitacion/otra_fiesta_999?guestId=inv_1&token=tok_1`;
    await page.fill('#respaldo-qr-input', qrOtraFiesta);
    await page.click('button:has-text("Leer")');

    await expect(page.locator('text=Este QR es de otra fiesta')).toBeVisible();
    await expect(page.locator('text=¡Hola,')).not.toBeVisible();

    // QR con token inválido
    const qrTokenMalo = `https://akproducciones.uy/invitacion/${fiesta.id}?guestId=${fiesta.invitados![0].id}&token=token_invalido_xxx`;
    await page.fill('#respaldo-qr-input', qrTokenMalo);
    await page.click('button:has-text("Leer")');

    await expect(page.locator('text=No reconocimos este QR, probá de nuevo')).toBeVisible();
    await expect(page.locator('text=¡Hola,')).not.toBeVisible();
  });

  test('Vuelve sola a la pantalla de espera', async ({ page }) => {
    // Reducir el tiempo de espera si fuera posible o probar con un error que vuelve en 4 segundos
    await page.goto(`/evento/bienvenida/${fiesta.id}`);
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible();

    const qrMalo = `https://akproducciones.uy/invitacion/otra_fiesta_999?guestId=inv_1&token=tok_1`;
    await page.fill('#respaldo-qr-input', qrMalo);
    await page.click('button:has-text("Leer")');

    await expect(page.locator('text=Este QR es de otra fiesta')).toBeVisible();

    // El error vuelve a la espera a los 4 segundos
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible({ timeout: 10000 });
  });
});
