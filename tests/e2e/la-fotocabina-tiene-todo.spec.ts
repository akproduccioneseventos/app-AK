import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 39 Bloque 1 y 2: La fotocabina tiene todo.
 *
 * Verifica que la estación de fotocabina (/evento/fotocabina/[fiestaId])
 * cuente con los componentes requeridos:
 * - Stickers y accesorios decorativos (STICKERS).
 * - Selector de marcos (FRAMES).
 * - Selección de fondo virtual (procesarFondoCanvas).
 * - Enlace para ver la galería de la noche dentro de la estación.
 */

const fiestaLentaId = `e2e_fotocabina_lenta_${Date.now()}`;
const fiestaId = `e2e_fotocabina_todo_${Date.now()}`;

test.describe('Orden 39: La fotocabina tiene todo', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta de Prueba - Fotocabina Completa';
    guardarFiesta(fiesta);

    // OJO: esta fiesta se crea ACA y no adentro de la prueba. El servidor arma su
    // lista al arrancar, asi que una fiesta creada despues no existe para el.
    const fiestaLenta = crearFiestaDeEstaNoche({ id: fiestaLentaId });
    fiestaLenta.configuracion.nombreEvento = 'Fiesta Fotocabina Lenta';
    const others = (fiestaLenta as any).others || {};
    others.entretenimiento = others.entretenimiento || {};
    others.entretenimiento.modules = others.entretenimiento.modules || {};
    others.entretenimiento.modules.fotocabina = {
      ...(others.entretenimiento.modules.fotocabina || {}),
      enabled: true,
      velocidadRecuerdo: 'lenta',
    };
    (fiestaLenta as any).others = others;
    guardarFiesta(fiestaLenta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
    borrarFiesta(fiestaLentaId);
  });

  test('la fotocabina muestra stickers, marcos, fondos y enlace a la galería', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await enchufarCamaraFalsa(page);
    await page.goto(`/evento/fotocabina/${fiestaId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // 0. La foto se saca en un toque: las opciones arrancan plegadas y el botón está a la vista.
    //    Se abren a pedido del invitado (27/09/2026).
    const selectorStickers = page.locator('[data-testid="selector-stickers"]');
    await expect(page.getByRole('button', { name: /Preparar foto/i })).toBeVisible({ timeout: 15_000 });
    await expect(selectorStickers).toHaveCount(0);
    await page.getByTestId('boton-personalizar-foto').click();

    // 1. Selector de stickers interactivo
    await expect(selectorStickers).toBeVisible({ timeout: 15_000 });
    await expect(selectorStickers.getByText('★')).toBeVisible();
    await expect(selectorStickers.getByText('VIP')).toBeVisible();

    // 2. Selector de marcos decorativos
    const selectorMarcos = page.locator('[data-testid="selector-marcos"]');
    await expect(selectorMarcos).toBeVisible({ timeout: 10_000 });

    // 3. Fondos virtuales disponibles
    await expect(page.getByText('Sin fondo')).toBeVisible();
    await expect(page.getByText('Fondo borroso')).toBeVisible();

    // 4. Enlace a la galería de la noche
    const enlaceGaleria = page.getByRole('link', { name: /Ver galería de la noche/i });
    await expect(enlaceGaleria).toBeVisible();
    await expect(enlaceGaleria).toHaveAttribute('href', `/evento/galeria/${fiestaId}`);
  });

  test('la fotocabina no ofrece cámara lenta y una fiesta configurada con lenta abre en normal', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);

    try {
      const baseURL = testInfo.project.use.baseURL as string;
      await context.addCookies([
        { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
      ]);

      // Abrir en modo operador para verificar la configuración del efecto
      await enchufarCamaraFalsa(page);
      await page.goto(`/evento/fotocabina/${fiestaLentaId}?role=operator`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

      // Decisión del dueño: la fotocabina no usa cámara lenta.
      // El botón de cámara lenta no existe en los controles del operador.
      const botonLenta = page.locator('button[data-velocidad="lenta"]');
      await expect(botonLenta).toHaveCount(0);

      const botonNormal = page.locator('button[data-velocidad="normal"]');
      await expect(botonNormal).toBeVisible();
      const activa = await botonNormal.getAttribute('data-velocidad-activa');
      expect(activa, 'fiesta con lenta guardada debe abrir en normal').toBe('normal');

      // Ir a la pantalla de la cabina
      await enchufarCamaraFalsa(page);
      await page.goto(`/evento/fotocabina/${fiestaLentaId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

      // El aviso de duración aumentada de cámara lenta NO debe existir
      const avisoDuracion = page.locator('[data-testid="duracion-recuerdo-lenta"]');
      await expect(avisoDuracion).toHaveCount(0);
    } finally {
      // La fiesta se borra en el afterAll
    }
  });
});
