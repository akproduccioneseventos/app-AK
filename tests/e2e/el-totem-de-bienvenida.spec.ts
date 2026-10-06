import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

// El mismo formato que imprime la invitación (src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx).
const qrDeInvitacion = (fiestaId: string, guestId: string, token: string) =>
  `https://akproducciones.uy/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&token=${encodeURIComponent(token)}&guestId=${encodeURIComponent(guestId)}`;

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
    const qrBueno = qrDeInvitacion(fiesta.id, invitado.id, invitado.guestAccessToken!);

    await page.fill('#respaldo-qr-input', qrBueno);
    await page.click('button:has-text("Leer")');

    // El saludo lleva el nombre de ESTE invitado y su mesa, no un texto fijo.
    await expect(page.locator('body')).toContainText(`¡Hola, ${invitado.nombre}!`);
    await expect(page.locator('body')).toContainText(`Mesa ${invitado.tableNumber}`);
  });

  test('Con un QR de otra fiesta o token malo muestra cartel de error y no saluda', async ({ page }) => {
    await page.goto(`/evento/bienvenida/${fiesta.id}`);
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible();

    // QR de otra fiesta
    const qrOtraFiesta = qrDeInvitacion('otra_fiesta_999', 'inv_1', 'tok_1');
    await page.fill('#respaldo-qr-input', qrOtraFiesta);
    await page.click('button:has-text("Leer")');

    await expect(page.locator('body')).toContainText('Este QR es de otra fiesta');
    await expect(page.locator('text=¡Hola,')).toHaveCount(0);

    // QR con token inválido
    const qrTokenMalo = qrDeInvitacion(fiesta.id, fiesta.invitados![0].id, 'token_invalido_xxx');
    await page.fill('#respaldo-qr-input', qrTokenMalo);
    await page.click('button:has-text("Leer")');

    await expect(page.locator('body')).toContainText('No reconocimos este QR, probá de nuevo');
    await expect(page.locator('text=¡Hola,')).toHaveCount(0);
  });

  test('Vuelve sola a la pantalla de espera', async ({ page }) => {
    // Reducir el tiempo de espera si fuera posible o probar con un error que vuelve en 4 segundos
    await page.goto(`/evento/bienvenida/${fiesta.id}`);
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible();

    const qrMalo = qrDeInvitacion('otra_fiesta_999', 'inv_1', 'tok_1');
    await page.fill('#respaldo-qr-input', qrMalo);
    await page.click('button:has-text("Leer")');

    await expect(page.locator('text=Este QR es de otra fiesta')).toBeVisible();

    // El error vuelve a la espera a los 4 segundos
    await expect(page.locator('text=¡Bienvenidos! Acercá el QR de tu invitación')).toBeVisible({ timeout: 10000 });
  });
});
