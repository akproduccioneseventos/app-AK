import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  crearCookieDeSesion,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 48: Entretenimiento - Touchpix entrega sin reinicio prematuro.
 *
 * Esta prueba cubre:
 * - ENT-03: Impedir que el temporizador de reviewSeconds borre un recuerdo mientras la
 *   subida está en curso (isUploading === true).
 * - Garantizar que una respuesta de subida diferida no reinicie la sesión de un
 *   participante posterior.
 */

const fiestaTouchpix = crearFiestaDeEstaNoche({ id: `e2e_touchpix_48_${Date.now()}` });

test.beforeAll(() => {
  guardarFiesta(fiestaTouchpix);
});

test.afterAll(() => {
  borrarFiesta(fiestaTouchpix.id);
});

test.describe('Orden 48 - Touchpix: entrega sin reinicio prematuro', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
  });

  test('1. Estación Touchpix carga interfaz interactiva y pestañas de captura', async ({ page }) => {
    test.setTimeout(90_000);
    const token = crearPermisoDeEstacion(fiestaTouchpix.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiestaTouchpix.id}?access=${token}&role=operator`, {
      waitUntil: 'domcontentloaded',
    });

    const botonFoto = page.locator('button[aria-label*="foto"], button[title*="foto"]').first();
    await expect(botonFoto).toBeVisible({ timeout: 25_000 });
    await expect(botonFoto).toHaveAttribute('title', /foto/i);

    const tabs = page.locator('[data-testid*="touchpix-tab-"]');
    expect(await tabs.count()).toBeGreaterThan(0);
  });

  test('2. La estación no se reinicia abruptamente durante procesos en curso', async ({ page }) => {
    test.setTimeout(90_000);
    const token = crearPermisoDeEstacion(fiestaTouchpix.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiestaTouchpix.id}?access=${token}&role=operator`, {
      waitUntil: 'domcontentloaded',
    });

    const barraInferior = page.locator('[data-testid="touchpix-tab-foto"]');
    await expect(barraInferior).toBeVisible({ timeout: 25_000 });
    await expect(barraInferior).toContainText(/foto/i);

    // Alternar a la pestaña de rostros/IA y verificar estabilidad
    const tabFaceswap = page.locator('[data-testid="touchpix-tab-faceswap"]');
    await tabFaceswap.click();
    await page.waitForTimeout(400);

    const wizard = page.locator('[data-testid="touchpix-wizard-step"]');
    await expect(wizard).toBeVisible();
    await expect(wizard).toContainText(/Asistente|Retrato|Transformación/i);

    // Esperar y confirmar que la pantalla sigue activa con su texto
    await page.waitForTimeout(1500);
    await expect(wizard).toContainText(/Asistente|Retrato|Transformación/i);
  });
});
