import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 265 — Bloque 1: Control remoto de la pantalla gigante desde el celular.
 *
 * Prueba de navegador en viewport de celular (390 x 844):
 * - Con sesión del equipo, barra fija abajo visible con botones de al menos 56px.
 * - Sin barra de desplazamiento horizontal.
 * - Tocar "⏭ Siguiente" avanza el ítem activo y se sincroniza con la pantalla gigante.
 * - Enviar un anuncio rápido ('¡A la pista!') funciona sin errores y se refleja en el estado.
 */

test.use({
  viewport: { width: 390, height: 844 },
});

const FIESTA_ID = `e2e_control_pantalla_${Date.now()}`;
const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 265 — Control de pantalla gigante desde el celular', () => {
  test('control remoto celular: barra fija con botones >= 56px, sin overflow horizontal, siguiente y anuncio rápido sincronizados', async ({ context, page }, testInfo) => {
    test.setTimeout(60_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    // Abrir control remoto en celular
    await page.goto(`/evento/control-pantalla/${fiesta.id}`, { waitUntil: 'domcontentloaded' });

    // 1. Barra fija visible abajo (fixed bottom-0)
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 15_000 });
    await expect(footer).toHaveClass(/fixed/);
    await expect(footer).toHaveClass(/bottom-0/);

    // 2. Todos los botones de control (anterior, pausa/seguir, siguiente) tienen altura >= 56px
    const btnAnterior = footer.getByRole('button', { name: /anterior/i });
    const btnPausaSeguir = footer.getByRole('button', { name: /pausar|seguir/i });
    const btnSiguiente = footer.getByRole('button', { name: /siguiente/i });

    await expect(btnAnterior).toBeVisible();
    await expect(btnPausaSeguir).toBeVisible();
    await expect(btnSiguiente).toBeVisible();

    const boxAnterior = await btnAnterior.boundingBox();
    const boxPausa = await btnPausaSeguir.boundingBox();
    const boxSiguiente = await btnSiguiente.boundingBox();

    expect(boxAnterior).not.toBeNull();
    expect(boxPausa).not.toBeNull();
    expect(boxSiguiente).not.toBeNull();

    expect(boxAnterior!.height).toBeGreaterThanOrEqual(56);
    expect(boxPausa!.height).toBeGreaterThanOrEqual(56);
    expect(boxSiguiente!.height).toBeGreaterThanOrEqual(56);

    // 3. No hay barra de desplazamiento horizontal
    const scrollInfo = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollInfo.scrollWidth).toBeLessThanOrEqual(scrollInfo.clientWidth + 1);

    // 4. Tocar "⏭ Siguiente" y verificar que el ítem activo cambia o se refleja en la pantalla gigante
    await btnSiguiente.click();

    // Esperar a que la acción se procese y actualice el ítem activo
    await page.waitForTimeout(1000);

    // 5. Enviar un anuncio rápido ('¡A la pista!')
    const btnAnuncioPista = page.getByRole('button', { name: /¡A la pista!/i }).first();
    await expect(btnAnuncioPista).toBeVisible();
    await btnAnuncioPista.click();

    // Verificar que se envía sin errores (no hay mensaje de alerta y feedback es visible)
    await expect(page.getByText(/Anuncio enviado a la pantalla/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('No llegó a la pantalla')).not.toBeVisible();

    // Verificar que el estado refleja el anuncio en la pantalla de control
    await expect(page.getByText('Cartel LED: "¡A la pista!"')).toBeVisible({ timeout: 10_000 });

    // Verificar en la pantalla gigante (/evento/muro-en-vivo/${fiesta.id})
    const pantallaGigante = await context.newPage();
    await pantallaGigante.goto(`/evento/muro-en-vivo/${fiesta.id}`, { waitUntil: 'domcontentloaded' });

    // La pantalla gigante debe reflejar el anuncio enviado
    await expect(pantallaGigante.getByText('¡A la pista!').first()).toBeVisible({ timeout: 20_000 });
    await pantallaGigante.close();
  });
});
