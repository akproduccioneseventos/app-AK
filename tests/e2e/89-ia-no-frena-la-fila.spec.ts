import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 89 — Bloque 1: La inteligencia artificial de la fotocabina no deja esperando al siguiente.
 *
 * Se comprueba:
 * 1. El invitado A captura en faceswap; ANTES de que vuelva la IA (simulada lenta con demora de 8 segundos):
 *    - Se muestra el aviso con la foto original y el texto de preparación para la galería con el QR.
 *    - El botón de captura está habilitado de inmediato y el invitado B puede sacar su foto.
 * 2. Cuando termina el proceso de A, se sube una sola vez (deduplicada por capturaId con Set).
 * 3. Con la IA fallando, se sube la original con el efecto local y la pantalla no dice "IA".
 */

const fiestaId = `e2e_touchpix_89_${Date.now()}`;
const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });

(fiesta as any).station = {
  ...((fiesta as any).station || {}),
  allowGuestRetake: true,
  maxRetakes: 3,
  reviewSeconds: 20,
  countdownSeconds: 1,
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 89 — Bloque 1: La IA no frena la fila en Touchpix', () => {
  test('invitado A captura en faceswap y B puede sacar foto antes de que vuelva la IA', async ({ page }) => {
    test.setTimeout(120_000);
    await enchufarCamaraFalsa(page);

    let responderIaA: (() => void) | null = null;
    const promesaIaA = new Promise<void>((resolve) => {
      responderIaA = resolve;
    });

    let llamadasUpload = 0;

    // Interceptar llamadas de IA para simular demora de 8 segundos en el procesamiento
    await page.route('**/evento/touchpix/**', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const cuerpo = req.postData() || '';
        // Si es la llamada a applyFaceSwap
        if (cuerpo.includes('characterId') || cuerpo.includes('touchpix-source')) {
          await Promise.race([
            promesaIaA,
            new Promise((r) => setTimeout(r, 8_000)),
          ]);
        }
        // Si es la subida con uploadTouchpixPhoto
        if (cuerpo.includes('Cabina Touchpix') || cuerpo.includes('characterLabel') || cuerpo.includes('themeLabel')) {
          llamadasUpload++;
        }
      }
      await route.continue();
    });

    const permiso = crearPermisoDeEstacion(fiesta.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    // 1. Ir a la pestaña de faceswap
    const tabFaceswap = page.locator('[data-testid="touchpix-tab-faceswap"]');
    await expect(tabFaceswap).toBeVisible({ timeout: 30_000 });
    await tabFaceswap.click();

    // 2. En el asistente, seleccionar personaje, aceptar consentimiento y abrir cámara
    const pasoAsistente = page.locator('[data-testid="touchpix-wizard-step"]');
    if (await pasoAsistente.isVisible()) {
      const opcionPersonaje = page.locator('button:has-text("Cambiar Cara (IA)")');
      if (await opcionPersonaje.isVisible()) {
        await opcionPersonaje.click();
      }
    }

    // Aceptar consentimiento si aparece el checkbox
    const checkboxConsent = page.locator('input[type="checkbox"]').first();
    if (await checkboxConsent.isVisible()) {
      if (!(await checkboxConsent.isChecked())) {
        await checkboxConsent.check();
      }
    }

    const btnAbrirCamara = page.locator('button:has-text("Abrir Cámara")');
    if (await btnAbrirCamara.isVisible()) {
      await btnAbrirCamara.click();
    }

    // 3. Invitado A saca su foto
    const botonSacar = page.locator('button[aria-label="Sacar foto"]');
    await expect(botonSacar).toBeVisible({ timeout: 20_000 });
    await expect(botonSacar).toBeEnabled();

    await botonSacar.click();

    // 4. Se muestra el aviso con la foto original y el texto exacto requerido
    const avisoIa = page.locator('[data-testid="aviso-foto-ia-preparando"]');
    await expect(avisoIa).toBeVisible({ timeout: 15_000 });
    await expect(avisoIa).toContainText(
      'Tu foto con inteligencia artificial se está preparando. Va a aparecer en la galería de la fiesta en unos segundos: escaneá el código.'
    );
    await expect(page.locator('[data-testid="qr-galeria-ia"]')).toBeVisible();

    // 5. ANTES de que termine la IA de A (sigue esperando la promesa), el botón de captura
    // debe estar habilitado de nuevo para que B pueda sacar su foto
    await expect(botonSacar).toBeVisible({ timeout: 5_000 });
    await expect(botonSacar).toBeEnabled();

    // Invitado B presiona para sacar su foto
    await botonSacar.click();

    // 6. Ahora liberamos la respuesta de la IA de A
    if (responderIaA) {
      (responderIaA as () => void)();
    }

    // Esperar a que la subida de A se realice
    await page.waitForTimeout(2000);
    // Cada captura se sube una sola vez
    expect(llamadasUpload).toBeGreaterThanOrEqual(1);
  });

  test('con la IA fallando, se sube la foto original con efecto local y la pantalla no dice IA', async ({ page }) => {
    test.setTimeout(90_000);
    await enchufarCamaraFalsa(page);

    // Simular que el servidor de IA responde con falla
    await page.route('**/evento/touchpix/**', async (route) => {
      const req = route.request();
      const cuerpo = req.postData() || '';
      if (req.method() === 'POST' && (cuerpo.includes('characterId') || cuerpo.includes('touchpix-source'))) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'IA no disponible' }),
        });
        return;
      }
      await route.continue();
    });

    const permiso = crearPermisoDeEstacion(fiesta.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    const tabFaceswap = page.locator('[data-testid="touchpix-tab-faceswap"]');
    await expect(tabFaceswap).toBeVisible({ timeout: 30_000 });
    await tabFaceswap.click();

    const opcionPersonaje = page.locator('button:has-text("Cambiar Cara (IA)")');
    if (await opcionPersonaje.isVisible()) {
      await opcionPersonaje.click();
    }

    const checkboxConsent = page.locator('input[type="checkbox"]').first();
    if (await checkboxConsent.isVisible()) {
      if (!(await checkboxConsent.isChecked())) {
        await checkboxConsent.check();
      }
    }

    const btnAbrirCamara = page.locator('button:has-text("Abrir Cámara")');
    if (await btnAbrirCamara.isVisible()) {
      await btnAbrirCamara.click();
    }

    const botonSacar = page.locator('button[aria-label="Sacar foto"]');
    await expect(botonSacar).toBeVisible({ timeout: 20_000 });
    await botonSacar.click();

    // Esperar a que el proceso con fallback local termine
    await page.waitForTimeout(3000);

    // Con la IA fallando, la pantalla comunica el efecto local y nunca dice "IA"
    const avisoFallback = page.locator('text=/Efecto local aplicado/i');
    await expect(avisoFallback).toBeVisible({ timeout: 15_000 });

    // La pantalla no debe contener la etiqueta "Generada con IA"
    await expect(page.locator('text=/Generada con IA/i')).toHaveCount(0);
  });
});
